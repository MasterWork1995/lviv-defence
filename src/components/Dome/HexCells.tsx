"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  generateDomeCells,
  mapTop10ToCells,
  pickExtraCellFor,
  cellHash,
  fmtArea,
  DOME_RADIUS,
  type DonorData,
  type DomeCell,
} from "./hexUtils";

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/* ─────────────────────────────────────────────
   Palette — cyan/blue family. Borders render as a per-vertex gradient
   (top-of-hex bright, bottom-of-hex dim) for a more "glass shield" look.
   ───────────────────────────────────────────── */
const PALETTE = {
  baseLine: new THREE.Color("#1a65c0"), // gradient top
  baseLineLow: new THREE.Color("#0a2848"), // gradient bottom (darker)
  glowCyan: new THREE.Color("#38b0f0"), // additive halo over every line
  donorBorder: new THREE.Color("#00c8f0"),
  donorBorderHi: new THREE.Color("#00d4ff"),
  donorBorderTop: new THREE.Color("#f0b429"),
  selectedFill: new THREE.Color("#0c2d4a"),
  fillDonor: new THREE.Color("#071428"),
};

const M2_PER_UAH = 21.833;

function donorTier(squareM2: number): "small" | "medium" | "large" {
  const uah = squareM2 / M2_PER_UAH;
  if (uah >= 10_000) return "large";
  if (uah >= 1_000) return "medium";
  return "small";
}

function tierBorderColor(tier: "small" | "medium" | "large", multiplier = 1) {
  const c =
    tier === "large"
      ? PALETTE.donorBorderTop.clone().multiplyScalar(5.5)
      : tier === "medium"
        ? PALETTE.donorBorderHi.clone().multiplyScalar(6.5)
        : PALETTE.donorBorder.clone().multiplyScalar(4.0);
  return c.multiplyScalar(multiplier);
}

export function HexCells({ donors, selectedId, onSelect }: Props) {
  const cells = useMemo(() => generateDomeCells(DOME_RADIUS), []);

  /* Map donors → cells — STABLE.
     Top 10 positions are computed from the donors array only, so they NEVER
     move when selectedId changes. If a non-top-10 donor is selected, we
     append them as an 11th hex in a deterministic free cell. */
  const baseMap = useMemo(
    () => mapTop10ToCells(cells, donors),
    [cells, donors],
  );

  const cellToDonor = useMemo(() => {
    if (!selectedId) return baseMap.byCell;
    if (baseMap.byDonor.has(selectedId)) return baseMap.byCell;
    const selectedDonor = donors.find((d) => d.id === selectedId);
    if (!selectedDonor) return baseMap.byCell;
    const extra = pickExtraCellFor(cells, baseMap, selectedDonor);
    if (extra == null) return baseMap.byCell;
    // Clone + add the 11th — does NOT touch existing top-10 positions
    const map = new Map(baseMap.byCell);
    map.set(extra, selectedDonor);
    return map;
  }, [cells, donors, selectedId, baseMap]);

  /* Build merged geometry — 3 layers for the glass-glow look:
       (1) base lines   — per-vertex Y-axis gradient (dim → bright)
       (2) glow halo    — additive cyan over every line (the "glowing border")
       (3) accent layer — bright additive on ~18% random cells
     Per-cell inset varies 0.65..0.98 so hexes look visibly different sizes.
  */
  const { bgBorderGeom, bgGlowGeom, bgAccentGeom, donorCellList } =
    useMemo(() => {
      const borderPos: number[] = [],
        borderCol: number[] = [];
      const glowPos: number[] = [],
        glowCol: number[] = [];
      const accentPos: number[] = [],
        accentCol: number[] = [];

      cells.forEach((cell) => {
        if (cellToDonor.has(cell.index)) return;
        const h = cellHash(cell.index);
        const isAccent = h > 0.82;
        const baseAlpha = 0.03 + h * 0.14; // very transparent — reads as glass
        const hueShift = (cellHash(cell.index + 99) - 0.5) * 0.05;

        // Per-cell inset variation — visibly different hex sizes
        const inset = 0.65 + cellHash(cell.index + 311) * 0.33;
        const c = cell.position;
        const ring = cell.verts.map(
          (p) =>
            new THREE.Vector3(
              c.x + (p.x - c.x) * inset,
              c.y + (p.y - c.y) * inset,
              c.z + (p.z - c.z) * inset,
            ),
        );

        // Min/max y of ring for the vertical gradient
        let minY = Infinity,
          maxY = -Infinity;
        ring.forEach((p) => {
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });
        const yRange = Math.max(0.01, maxY - minY);

        const colAt = (p: THREE.Vector3) => {
          const t = (p.y - minY) / yRange;
          const mixed = PALETTE.baseLineLow.clone().lerp(PALETTE.baseLine, t);
          mixed.offsetHSL(hueShift, 0, 0).multiplyScalar(baseAlpha + t * 0.1);
          return mixed;
        };

        for (let j = 0; j < ring.length; j++) {
          const a = ring[j],
            b = ring[(j + 1) % ring.length];
          const ca = colAt(a),
            cb = colAt(b);

          borderPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          borderCol.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);

          const g = PALETTE.glowCyan.clone().multiplyScalar(0.06 + h * 0.16);
          glowPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          glowCol.push(g.r, g.g, g.b, g.r, g.g, g.b);
        }
      });

      const mk = (pos: number[], col: number[]) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
        return g;
      };
      const donorCellList: Array<{ cell: DomeCell; donor: DonorData }> = [];
      cellToDonor.forEach((donor, idx) =>
        donorCellList.push({ cell: cells[idx], donor }),
      );
      return {
        bgBorderGeom: mk(borderPos, borderCol),
        bgGlowGeom: mk(glowPos, glowCol),
        bgAccentGeom: mk(accentPos, accentCol),
        donorCellList,
      };
    }, [cells, cellToDonor]);

  /* Labels — show ALL donor cells (already capped to ~10–11 by the
     cellToDonor logic above). Selected donor gets a close button overlay. */
  const labels = useMemo(() => {
    const out: Array<{
      key: string;
      pos: [number, number, number];
      anchorPos: [number, number, number];
      name: string;
      area: string;
      selected: boolean;
    }> = [];
    cellToDonor.forEach((donor, idx) => {
      const c = cells[idx];
      const anchor = c.position.clone().addScaledVector(c.normal, 0.02);
      const label = c.position
        .clone()
        .addScaledVector(c.normal, 0.22)
        .add(new THREE.Vector3(0, 0.12, 0));
      out.push({
        key: donor.id,
        pos: [label.x, label.y, label.z],
        anchorPos: [anchor.x, anchor.y, anchor.z],
        name: donor.name,
        area: fmtArea(donor.squareM2),
        selected: donor.id === selectedId,
      });
    });
    return out;
  }, [cells, cellToDonor, selectedId]);

  return (
    <>
      {/* Background hex network — 3 merged draw calls */}
      <lineSegments>
        <primitive object={bgBorderGeom} attach="geometry" />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={1}
          toneMapped={false}
        />
      </lineSegments>

      {/* Additive halo on every border — gives the "glowing edge" look */}
      <lineSegments>
        <primitive object={bgGlowGeom} attach="geometry" />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* Brightest ~18% */}
      <lineSegments>
        <primitive object={bgAccentGeom} attach="geometry" />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* Donor hexes — per-cell with pulse/blink + accent borders */}
      {donorCellList.map(({ cell, donor }) => (
        <DonorHex
          key={donor.id}
          cell={cell}
          donor={donor}
          selected={donor.id === selectedId}
          dimmed={selectedId !== null && donor.id !== selectedId}
          onSelect={onSelect}
        />
      ))}

      {/* Labels — fixed pixel size in a glass pill. Selected label has a
          "↩" close button that releases the selection (= same as clicking
          the hex again). */}
      {labels.map((label) => (
        <Html
          key={label.key}
          position={label.pos}
          center
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: label.selected ? "auto" : "none",
            whiteSpace: "nowrap",
          }}
          occlude={false}
        >
          <div
            style={{
              transform: "translateY(-2px)",
              padding: "5px 10px",
              borderRadius: "999px",
              background: label.selected
                ? "rgba(20, 8, 0, 0.85)"
                : "rgba(4, 9, 26, 0.72)",
              border: label.selected
                ? "1px solid rgba(240, 180, 41, 0.85)"
                : "1px solid rgba(0, 200, 240, 0.28)",
              boxShadow: label.selected
                ? "0 0 14px rgba(240,180,41,0.5), 0 4px 12px rgba(0,0,0,0.55)"
                : "0 4px 12px rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              fontFamily: "var(--font-exo2, system-ui, sans-serif)",
              userSelect: "none",
              textAlign: "center",
              lineHeight: 1.15,
              display: "flex",
              alignItems: "center",
              gap: label.selected ? "6px" : 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  color: label.selected ? "#ffd76b" : "#ffffff",
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label.name}
              </div>
              {label.area && (
                <div
                  style={{
                    fontSize: "10px",
                    marginTop: 1,
                    color: label.selected ? "#ffe49a" : "#9fe9ff",
                    letterSpacing: "0.06em",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontWeight: 500,
                  }}
                >
                  {label.area}
                </div>
              )}
            </div>

            {label.selected && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(null);
                }}
                aria-label="Повернутись"
                title="Повернутись"
                style={{
                  pointerEvents: "auto",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  marginLeft: 4,
                  borderRadius: 999,
                  background: "rgba(240,180,41,0.18)",
                  border: "1px solid rgba(240,180,41,0.85)",
                  color: "#ffd76b",
                  fontFamily: "inherit",
                  fontSize: 12,
                  lineHeight: 1,
                  padding: 0,
                  boxShadow: "0 0 10px rgba(240,180,41,0.45)",
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                ✕
              </button>
            )}
          </div>
        </Html>
      ))}

      {/* Anchor dots on each labeled hex */}
      {labels.map((label) => (
        <mesh key={label.key + "-dot"} position={label.anchorPos}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial
            color={label.selected ? "#ffd76b" : "#9fe9ff"}
            transparent
            opacity={label.selected ? 1 : 0.9}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   Single donor hex — fill + outline + glow + halo ring.
   Uses side: FrontSide so clicks on the BACK of the dome are ignored.
   ───────────────────────────────────────────── */
function DonorHex({
  cell,
  donor,
  selected,
  dimmed,
  onSelect,
}: {
  cell: DomeCell;
  donor: DonorData;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string | null) => void;
}) {
  const fillMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null!);
  const glowMatRef = useRef<THREE.LineBasicMaterial>(null!);
  const ringMatRef = useRef<THREE.LineBasicMaterial>(null!);
  const tier = donorTier(donor.squareM2);

  const { fillGeom, outlineGeom, glowOutlineGeom, ringGeom } = useMemo(() => {
    const inset = 0.9;
    const c = cell.position;
    const ring = cell.verts.map(
      (p) =>
        new THREE.Vector3(
          c.x + (p.x - c.x) * inset,
          c.y + (p.y - c.y) * inset,
          c.z + (p.z - c.z) * inset,
        ),
    );
    const fillPos: number[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      fillPos.push(c.x, c.y, c.z, a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const fillG = new THREE.BufferGeometry();
    fillG.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(fillPos, 3),
    );
    fillG.computeVertexNormals();

    const outlinePos: number[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      outlinePos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const outlineG = new THREE.BufferGeometry();
    outlineG.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(outlinePos, 3),
    );

    // Glow outline = same geometry, drawn additively as a 2nd pass
    const glowOutlineG = outlineG.clone();

    // Halo ring — 6% larger contour for ambient "this is clickable" glow
    const ringPos: number[] = [];
    const ringInset = 1.05; // outside the actual outline
    const ringPoints = cell.verts.map(
      (p) =>
        new THREE.Vector3(
          c.x + (p.x - c.x) * inset * ringInset,
          c.y + (p.y - c.y) * inset * ringInset,
          c.z + (p.z - c.z) * inset * ringInset,
        ),
    );
    for (let i = 0; i < ringPoints.length; i++) {
      const a = ringPoints[i],
        b = ringPoints[(i + 1) % ringPoints.length];
      ringPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const ringG = new THREE.BufferGeometry();
    ringG.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(ringPos, 3),
    );

    return {
      fillGeom: fillG,
      outlineGeom: outlineG,
      glowOutlineGeom: glowOutlineG,
      ringGeom: ringG,
    };
  }, [cell]);

  /* Discrete BLINK on selected + ambient breathing halo on un-selected */
  useFrame((_, dt) => {
    if (!fillMatRef.current || !lineMatRef.current) return;
    const k = Math.min(1, dt * 12);
    // Blink: 380ms on, 220ms off
    const blinkOn = selected ? performance.now() % 600 < 380 : false;
    // Ambient breathe for the halo so donor hexes are visibly clickable
    const ambient = 0.45 + Math.sin(performance.now() * 0.0025) * 0.18;

    const targetFillOp = selected
      ? blinkOn
        ? 0.55
        : 0.12
      : dimmed
        ? 0.05
        : 0.18;
    fillMatRef.current.opacity +=
      (targetFillOp - fillMatRef.current.opacity) * k;

    const targetLineOp = selected
      ? blinkOn
        ? 1.0
        : 0.35
      : dimmed
        ? 0.45
        : 0.95;
    lineMatRef.current.opacity +=
      (targetLineOp - lineMatRef.current.opacity) * k;

    if (glowMatRef.current) {
      const t = selected ? (blinkOn ? 0.9 : 0.25) : dimmed ? 0.15 : 0.55;
      glowMatRef.current.opacity += (t - glowMatRef.current.opacity) * k;
    }
    if (ringMatRef.current) {
      const t = selected ? (blinkOn ? 0.85 : 0.35) : dimmed ? 0.1 : ambient;
      ringMatRef.current.opacity += (t - ringMatRef.current.opacity) * k;
    }

    const targetCol = selected
      ? PALETTE.donorBorderTop.clone().multiplyScalar(8)
      : tierBorderColor(tier, dimmed ? 0.6 : 1);
    lineMatRef.current.color.lerp(targetCol, k);

    const targetFillCol = selected ? PALETTE.selectedFill : PALETTE.fillDonor;
    fillMatRef.current.color.lerp(targetFillCol, k);
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = () => {
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(selected ? null : donor.id);
  };

  return (
    <group>
      <mesh
        geometry={fillGeom}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshBasicMaterial
          ref={fillMatRef}
          color={PALETTE.fillDonor}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide} /* BLOCKS clicks through the dome */
          toneMapped={false}
        />
      </mesh>

      {/* Crisp base border */}
      <lineSegments geometry={outlineGeom}>
        <lineBasicMaterial
          ref={lineMatRef}
          color={tierBorderColor(tier).getHex()}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </lineSegments>

      {/* Additive glow on the SAME border — fakes line thickness */}
      <lineSegments geometry={glowOutlineGeom}>
        <lineBasicMaterial
          ref={glowMatRef}
          color={tierBorderColor(tier).clone().multiplyScalar(1.4).getHex()}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* Outer halo ring (~5% larger) — ambient breathing glow so donor hexes
          are visibly clickable without hover. */}
      <lineSegments geometry={ringGeom}>
        <lineBasicMaterial
          ref={ringMatRef}
          color={tierBorderColor(tier).clone().multiplyScalar(0.8).getHex()}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

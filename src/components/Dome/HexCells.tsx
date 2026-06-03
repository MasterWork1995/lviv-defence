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
  DOME_LABEL_PRESETS,
  type DonorData,
  type DomeCell,
  type DomeViewport,
} from "./hexUtils";

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  viewport?: DomeViewport;
}

const PALETTE = {
  baseLine: new THREE.Color("#58627d"),
  baseLineLow: new THREE.Color("#111224"),
  glowCyan: new THREE.Color("#cad3e8"),
  donorBorder: new THREE.Color("#f39200"),
  selectedFill: new THREE.Color("#1c2238"),
  fillDonor: new THREE.Color("#161a2c"),
};

const M2_PER_UAH = 21.833;

function donorTier(squareM2: number): "small" | "medium" | "large" {
  const uah = squareM2 / M2_PER_UAH;
  if (uah >= 10_000) return "large";
  if (uah >= 1_000) return "medium";
  return "small";
}

function tierBorderOpacity(tier: "small" | "medium" | "large", multiplier = 1) {
  const base = tier === "large" ? 1 : tier === "medium" ? 0.9 : 0.78;
  return Math.min(1, base * multiplier);
}

export function HexCells({
  donors,
  selectedId,
  onSelect,
  viewport = "desktop",
}: Props) {
  const labelUi = DOME_LABEL_PRESETS[viewport];
  const cells = useMemo(() => generateDomeCells(DOME_RADIUS), []);

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
    const map = new Map(baseMap.byCell);
    map.set(extra, selectedDonor);
    return map;
  }, [cells, donors, selectedId, baseMap]);

  const BG_HEX_INSET = 0.92;

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
        const baseAlpha = 0.08;
        const inset = BG_HEX_INSET;
        const c = cell.position;
        const ring = cell.verts.map(
          (p) =>
            new THREE.Vector3(
              c.x + (p.x - c.x) * inset,
              c.y + (p.y - c.y) * inset,
              c.z + (p.z - c.z) * inset,
            ),
        );

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
          return mixed.multiplyScalar(baseAlpha + t * 0.1);
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
        .addScaledVector(c.normal, 0.14)
        .add(new THREE.Vector3(0, 0.04, 0));
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
      <lineSegments>
        <primitive object={bgBorderGeom} attach="geometry" />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={1}
          toneMapped={false}
        />
      </lineSegments>
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
      {labels.map((label) => (
        <Html
          key={label.key}
          position={label.pos}
          center
          distanceFactor={labelUi.distanceFactor}
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: label.selected ? "auto" : "none",
            whiteSpace: "nowrap",
          }}
          occlude={false}
        >
          <div
            style={{
              transform: `translateY(-1px) scale(${labelUi.uiScale})`,
              padding: `${labelUi.padY}px ${labelUi.padX}px`,
              borderRadius: "999px",
              background: label.selected
                ? "var(--color-primary-deep)"
                : "var(--color-excadra-72)",
              border: label.selected
                ? "1px solid var(--color-gold-75)"
                : "1px solid var(--color-accent-dim)",
              boxShadow: label.selected
                ? "0 0 14px var(--color-gold-50), 0 4px 12px var(--shadow-medium)"
                : "0 4px 12px var(--shadow-soft)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              fontFamily: "var(--font-uaf, system-ui, sans-serif)",
              userSelect: "none",
              textAlign: "center",
              lineHeight: 1.15,
              display: "flex",
              alignItems: "center",
              gap: label.selected ? "4px" : 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: `${labelUi.namePx}px`,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  color: label.selected
                    ? "var(--color-primary-soft)"
                    : "var(--color-white)",
                  maxWidth: `${labelUi.maxWidthPx}px`,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label.name}
              </div>
              {label.area && (
                <div
                  style={{
                    fontSize: `${labelUi.areaPx}px`,
                    marginTop: 1,
                    color: label.selected
                      ? "var(--color-primary-soft)"
                      : "var(--color-accent-glow)",
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
                  width: labelUi.namePx + 8,
                  height: labelUi.namePx + 8,
                  marginLeft: 2,
                  borderRadius: 999,
                  background: "var(--color-gold-18)",
                  border: "1px solid var(--color-gold-75)",
                  color: "var(--color-primary-soft)",
                  fontFamily: "inherit",
                  fontSize: labelUi.namePx,
                  lineHeight: 1,
                  padding: 0,
                  boxShadow: "0 0 10px var(--color-gold-45)",
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                ✕
              </button>
            )}
          </div>
        </Html>
      ))}
      {labels.map((label) => (
        <mesh key={label.key + "-dot"} position={label.anchorPos}>
          <sphereGeometry args={[labelUi.dotRadius, 8, 8]} />
          <meshBasicMaterial
            color={label.selected ? "#fde68a" : "#cad3e8"}
            transparent
            opacity={label.selected ? 1 : 0.9}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

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
  const tier = donorTier(donor.squareM2);

  const { fillGeom, outlineGeom } = useMemo(() => {
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

    return {
      fillGeom: fillG,
      outlineGeom: outlineG,
    };
  }, [cell]);

  /* Discrete BLINK on selected. Fill stays visibly dark either way so the
     donor hex is clearly readable as a filled cell. */
  useFrame((_, dt) => {
    if (!fillMatRef.current || !lineMatRef.current) return;
    const k = Math.min(1, dt * 12);
    // Blink: 380ms on, 220ms off
    const blinkOn = selected ? performance.now() % 600 < 380 : false;

    const targetFillOp = selected
      ? blinkOn
        ? 0.85
        : 0.55
      : dimmed
        ? 0.35
        : 0.65;
    fillMatRef.current.opacity +=
      (targetFillOp - fillMatRef.current.opacity) * k;

    const targetLineOp = selected
      ? blinkOn
        ? 1.0
        : 0.55
      : dimmed
        ? 0.45
        : tierBorderOpacity(tier);
    lineMatRef.current.opacity +=
      (targetLineOp - lineMatRef.current.opacity) * k;

    lineMatRef.current.color.copy(PALETTE.donorBorder);

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

  const pointerHandlers = {
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut,
    onClick: handleClick,
  };

  return (
    <group>
      <mesh geometry={fillGeom} {...pointerHandlers}>
        <meshBasicMaterial
          ref={fillMatRef}
          color={PALETTE.fillDonor}
          transparent
          opacity={0.65}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <lineSegments geometry={outlineGeom}>
        <lineBasicMaterial
          ref={lineMatRef}
          color={PALETTE.donorBorder}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

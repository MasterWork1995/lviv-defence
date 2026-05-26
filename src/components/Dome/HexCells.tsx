"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  generateDomeCells,
  pickDonorCells,
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

const PALETTE = {
  /* base cyan range for non-donor cells */
  baseCyan: new THREE.Color("#1a65c0"),
  brightCyan: new THREE.Color("#00c8f0"),
  /* donor highlights */
  donorBorder: new THREE.Color("#00c8f0"),
  donorBorderHi: new THREE.Color("#00d4ff"),
  donorBorderTop: new THREE.Color("#f0b429"),
  /* selection */
  selectedFill: new THREE.Color("#051a30"),
  /* fills */
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
        ? PALETTE.donorBorderHi.clone().multiplyScalar(7.0)
        : PALETTE.donorBorder.clone().multiplyScalar(4.5);
  return c.multiplyScalar(multiplier);
}

export function HexCells({ donors, selectedId, onSelect }: Props) {
  /* ─── 1. Generate Goldberg dome cells once ─── */
  const cells = useMemo(() => generateDomeCells(DOME_RADIUS), []);

  /* ─── 2. Map donors ↔ cells ─── */
  const cellToDonor = useMemo(() => {
    const sorted = [...donors].sort((a, b) => b.squareM2 - a.squareM2);
    const ctd = new Map<number, DonorData>();
    const claimed = new Set<string>();

    // honour explicit `sector` if the donor has one; otherwise pick a free spot
    const reserved = new Set<number>();
    sorted.forEach((d) => {
      if (
        d.sector != null &&
        d.sector < cells.length &&
        !cells[d.sector].isPent
      ) {
        reserved.add(d.sector);
        ctd.set(d.sector, d);
        claimed.add(d.id);
      }
    });
    const remaining = sorted.filter((d) => !claimed.has(d.id));
    const free = cells.filter((c) => !reserved.has(c.index));
    const picks = pickDonorCells(free, remaining.length);
    remaining.forEach((d, i) => {
      const ci = free[picks[i]]?.index;
      if (ci != null) ctd.set(ci, d);
    });
    return ctd;
  }, [cells, donors]);

  /* ─── 3. Build merged geometry for non-donor cells (single draw call) ─── */
  const { bgBorderGeom, bgAccentGeom, donorCellList } = useMemo(() => {
    const borderPos: number[] = [];
    const borderCol: number[] = [];
    const accentPos: number[] = [];
    const accentCol: number[] = [];

    cells.forEach((cell) => {
      if (cellToDonor.has(cell.index)) return; // donors handled separately

      const h = cellHash(cell.index);
      const isAccent = h > 0.82; // ~18% get extra additive glow
      const baseAlpha = 0.18 + h * 0.38; // most are dim, some pop
      const hueShift = (cellHash(cell.index + 99) - 0.5) * 0.06;
      const baseCol = PALETTE.baseCyan
        .clone()
        .offsetHSL(hueShift, 0, 0)
        .multiplyScalar(baseAlpha);

      const inset = 0.96;
      const c = cell.position;
      const ring = cell.verts.map(
        (p) =>
          new THREE.Vector3(
            c.x + (p.x - c.x) * inset,
            c.y + (p.y - c.y) * inset,
            c.z + (p.z - c.z) * inset,
          ),
      );

      for (let j = 0; j < ring.length; j++) {
        const a = ring[j];
        const b = ring[(j + 1) % ring.length];
        borderPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        borderCol.push(
          baseCol.r,
          baseCol.g,
          baseCol.b,
          baseCol.r,
          baseCol.g,
          baseCol.b,
        );
        if (isAccent) {
          const accCol = PALETTE.brightCyan.clone().multiplyScalar(0.35);
          accentPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          accentCol.push(
            accCol.r,
            accCol.g,
            accCol.b,
            accCol.r,
            accCol.g,
            accCol.b,
          );
        }
      }
    });

    const bgBorderGeom = new THREE.BufferGeometry();
    bgBorderGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(borderPos, 3),
    );
    bgBorderGeom.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(borderCol, 3),
    );

    const bgAccentGeom = new THREE.BufferGeometry();
    bgAccentGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(accentPos, 3),
    );
    bgAccentGeom.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(accentCol, 3),
    );

    const donorCellList: Array<{ cell: DomeCell; donor: DonorData }> = [];
    cellToDonor.forEach((donor, idx) =>
      donorCellList.push({ cell: cells[idx], donor }),
    );

    return { bgBorderGeom, bgAccentGeom, donorCellList };
  }, [cells, cellToDonor]);

  /* ─── 4. Top-5 + selected labels ─── */
  const labels = useMemo(() => {
    const top5 = new Set(
      [...cellToDonor.values()]
        .sort((a, b) => b.squareM2 - a.squareM2)
        .slice(0, 5)
        .map((d) => d.id),
    );
    if (selectedId) top5.add(selectedId);

    const out: Array<{
      key: string;
      pos: [number, number, number];
      name: string;
      area: string;
      selected: boolean;
    }> = [];
    cellToDonor.forEach((donor, idx) => {
      if (!top5.has(donor.id)) return;
      const c = cells[idx];
      const p = c.position.clone().addScaledVector(c.normal, 0.06);
      out.push({
        key: donor.id,
        pos: [p.x, p.y, p.z],
        name: donor.name,
        area: fmtArea(donor.squareM2),
        selected: donor.id === selectedId,
      });
    });
    return out;
  }, [cells, cellToDonor, selectedId]);

  return (
    <>
      {/* ── Background hex network — single draw call for the line mesh ── */}
      <lineSegments>
        <primitive object={bgBorderGeom} attach="geometry" />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={1}
          toneMapped={false}
        />
      </lineSegments>

      {/* Accent glow layer — additive on top of ~18% random cells */}
      <lineSegments>
        <primitive object={bgAccentGeom} attach="geometry" />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* ── Donor cells — per-cell mesh so we can hover / click / pulse ── */}
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

      {/* ── Labels ── */}
      {labels.map((label) => (
        <Html
          key={label.key}
          position={label.pos}
          center
          zIndexRange={[50, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="pointer-events-none select-none text-center">
            <div
              style={{
                fontSize: "7px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                lineHeight: 1.2,
                color: label.selected ? "#00ffff" : "#00c8f0",
                fontFamily: "var(--font-exo2, system-ui, sans-serif)",
                maxWidth: "80px",
                wordBreak: "break-word",
                textShadow:
                  "0 0 8px rgba(0,200,240,0.9), 0 0 14px rgba(0,0,0,0.9)",
                opacity: label.selected ? 1 : 0.9,
              }}
            >
              {label.name}
            </div>
            {label.area && (
              <div
                style={{
                  fontSize: "6px",
                  color: label.selected ? "#f0b429" : "#38b0f0",
                  marginTop: "1px",
                  letterSpacing: "0.03em",
                  textShadow: "0 0 6px rgba(0,0,0,0.9)",
                }}
              >
                {label.area}
              </div>
            )}
          </div>
        </Html>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   Single donor hex — fill + outline + pulse on select
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
  const tier = donorTier(donor.squareM2);

  const { fillGeom, outlineGeom } = useMemo(() => {
    const inset = 0.92;
    const c = cell.position;
    const ring = cell.verts.map(
      (p) =>
        new THREE.Vector3(
          c.x + (p.x - c.x) * inset,
          c.y + (p.y - c.y) * inset,
          c.z + (p.z - c.z) * inset,
        ),
    );
    // Fan triangulation from centroid
    const fillPos: number[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      fillPos.push(c.x, c.y, c.z, a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const fillG = new THREE.BufferGeometry();
    fillG.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(fillPos, 3),
    );
    fillG.computeVertexNormals();

    const outlinePos: number[] = [];
    for (let i = 0; i <= ring.length; i++) {
      const p = ring[i % ring.length];
      outlinePos.push(p.x, p.y, p.z);
    }
    const outlineG = new THREE.BufferGeometry();
    outlineG.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(outlinePos, 3),
    );

    return { fillGeom: fillG, outlineGeom: outlineG };
  }, [cell]);

  /* selection breathing + smooth color/opacity */
  useFrame((_, dt) => {
    if (!fillMatRef.current || !lineMatRef.current) return;

    const targetFillOp = selected
      ? 0.55 + Math.sin(performance.now() * 0.005) * 0.2
      : dimmed
        ? 0.08
        : 0.22;
    fillMatRef.current.opacity +=
      (targetFillOp - fillMatRef.current.opacity) * Math.min(1, dt * 8);

    const targetLineOp = selected ? 1 : dimmed ? 0.4 : 0.95;
    lineMatRef.current.opacity +=
      (targetLineOp - lineMatRef.current.opacity) * Math.min(1, dt * 8);

    const targetCol = selected
      ? PALETTE.donorBorderTop.clone().multiplyScalar(8)
      : tierBorderColor(tier, dimmed ? 0.6 : 1);
    lineMatRef.current.color.lerp(targetCol, Math.min(1, dt * 8));

    const targetFillCol = selected ? PALETTE.selectedFill : PALETTE.fillDonor;
    fillMatRef.current.color.lerp(targetFillCol, Math.min(1, dt * 8));
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
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <lineSegments geometry={outlineGeom}>
        <lineBasicMaterial
          ref={lineMatRef}
          color={tierBorderColor(tier).getHex()}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  generateDomeCells,
  buildHexShape,
  fmtArea,
  TOTAL_CELLS,
  DOME_RADIUS,
  HEX_OUTER,
  HEX_INNER,
  type DonorData,
} from "./hexUtils";

// HDR border colors (ACESFilmic makes bright values bloom softly)
const C_BORDER_EMPTY    = new THREE.Color(0x1a3a6e).multiplyScalar(1.5);
const C_BORDER_SMALL    = new THREE.Color(0x00c8f0).multiplyScalar(4.5);
const C_BORDER_MEDIUM   = new THREE.Color(0x00d4ff).multiplyScalar(7.0);
const C_BORDER_LARGE    = new THREE.Color(0xf0b429).multiplyScalar(5.5);
const C_BORDER_SELECTED = new THREE.Color(0x00ffff).multiplyScalar(11.0);
const C_BORDER_HOVER    = new THREE.Color(0x38b0f0).multiplyScalar(8.0);

// Dark interior fill colors
const C_FILL_EMPTY    = new THREE.Color(0x010508);
const C_FILL_DONATED  = new THREE.Color(0x071428);
const C_FILL_SELECTED = new THREE.Color(0x051a30);

const M2_PER_UAH = 21.833;

function borderColor(m2: number): THREE.Color {
  const uah = m2 / M2_PER_UAH;
  if (uah >= 10_000) return C_BORDER_LARGE.clone();
  if (uah >= 1_000)  return C_BORDER_MEDIUM.clone();
  return C_BORDER_SMALL.clone();
}

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function HexCells({ donors, selectedId, onSelect }: Props) {
  const borderRef = useRef<THREE.InstancedMesh>(null!);
  const fillRef   = useRef<THREE.InstancedMesh>(null!);

  const colorDirty    = useRef(true);
  const hoveredIdxRef = useRef<number | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);

  const cells = useMemo(() => generateDomeCells(DOME_RADIUS), []);

  const { cellToDonor, donorToCell } = useMemo(() => {
    const ctd = new Map<number, DonorData>();
    const dtc = new Map<string, number>();
    [...donors]
      .sort((a, b) => b.squareM2 - a.squareM2)
      .forEach((donor, i) => {
        const cellIdx = donor.sector != null
          ? Math.min(donor.sector, TOTAL_CELLS - 1)
          : i % TOTAL_CELLS;
        if (!ctd.has(cellIdx)) {
          ctd.set(cellIdx, donor);
          dtc.set(donor.id, cellIdx);
        }
      });
    return { cellToDonor: ctd, donorToCell: dtc };
  }, [donors]);

  const { borderGeom, fillGeom, borderMat, fillMat } = useMemo(() => {
    const borderGeom = new THREE.ShapeGeometry(buildHexShape(HEX_OUTER));
    const fillGeom   = new THREE.ShapeGeometry(buildHexShape(HEX_INNER));
    const borderMat  = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.0,
      metalness: 0.95,
    });
    const fillMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      roughness: 1.0,
      metalness: 0.0,
    });
    return { borderGeom, fillGeom, borderMat, fillMat };
  }, []);

  // Place each hex on sphere surface
  useEffect(() => {
    if (!borderRef.current || !fillRef.current) return;
    const dummy = new THREE.Object3D();
    const zAxis = new THREE.Vector3(0, 0, 1);

    cells.forEach((cell, i) => {
      const outward = cell.position.clone().normalize();
      // Border sits slightly further out than fill
      dummy.position.copy(cell.position).addScaledVector(outward, 0.014);
      dummy.quaternion.setFromUnitVectors(zAxis, outward);
      dummy.updateMatrix();
      borderRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.copy(cell.position).addScaledVector(outward, 0.010);
      dummy.updateMatrix();
      fillRef.current.setMatrixAt(i, dummy.matrix);
    });
    borderRef.current.instanceMatrix.needsUpdate = true;
    fillRef.current.instanceMatrix.needsUpdate   = true;
  }, [cells]);

  const cellToDonorRef = useRef(cellToDonor);
  const donorToCellRef = useRef(donorToCell);
  useEffect(() => { cellToDonorRef.current = cellToDonor; colorDirty.current = true; }, [cellToDonor]);
  useEffect(() => { donorToCellRef.current = donorToCell; }, [donorToCell]);
  useEffect(() => { selectedIdRef.current = selectedId; colorDirty.current = true; }, [selectedId]);

  const updateColors = useCallback(() => {
    if (!borderRef.current || !fillRef.current) return;
    const ctd     = cellToDonorRef.current;
    const dtc     = donorToCellRef.current;
    const selCell = selectedIdRef.current ? dtc.get(selectedIdRef.current) : undefined;
    const hovIdx  = hoveredIdxRef.current;
    const bc = new THREE.Color();
    const fc = new THREE.Color();

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const donor = ctd.get(i);
      if (i === selCell) {
        bc.copy(C_BORDER_SELECTED);
        fc.copy(C_FILL_SELECTED);
      } else if (i === hovIdx) {
        bc.copy(C_BORDER_HOVER);
        fc.copy(C_FILL_DONATED);
      } else if (donor) {
        bc.copy(borderColor(donor.squareM2));
        fc.copy(C_FILL_DONATED);
      } else {
        bc.copy(C_BORDER_EMPTY);
        fc.copy(C_FILL_EMPTY);
      }
      borderRef.current.setColorAt(i, bc);
      fillRef.current.setColorAt(i, fc);
    }
    if (borderRef.current.instanceColor) borderRef.current.instanceColor.needsUpdate = true;
    if (fillRef.current.instanceColor)   fillRef.current.instanceColor.needsUpdate   = true;
  }, []);

  useFrame(() => {
    if (colorDirty.current) {
      updateColors();
      colorDirty.current = false;
    }
  });

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const idx = e.instanceId ?? null;
    if (idx === hoveredIdxRef.current) return;
    hoveredIdxRef.current = idx;
    colorDirty.current = true;
  }, []);

  const handlePointerOut = useCallback(() => {
    hoveredIdxRef.current = null;
    colorDirty.current = true;
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx == null) return;
    const donor = cellToDonorRef.current.get(idx);
    onSelect(donor?.id ?? null);
  }, [onSelect]);

  // Labels for top-5 donors + currently selected (always visible, rotate with dome)
  const labels = useMemo(() => {
    const top5Ids = new Set(
      [...cellToDonor.values()]
        .sort((a, b) => b.squareM2 - a.squareM2)
        .slice(0, 5)
        .map((d) => d.id),
    );
    if (selectedId) top5Ids.add(selectedId);

    const result: Array<{
      idx: number;
      pos: [number, number, number];
      name: string;
      area: string;
      selected: boolean;
    }> = [];

    cellToDonor.forEach((donor, cellIdx) => {
      if (!top5Ids.has(donor.id)) return;
      const cell = cells[cellIdx];
      if (!cell) return;
      const outward = cell.position.clone().normalize();
      const p = cell.position.clone().addScaledVector(outward, 0.07);
      result.push({
        idx: cellIdx,
        pos: [p.x, p.y, p.z],
        name: donor.name,
        area: fmtArea(donor.squareM2),
        selected: donor.id === selectedId,
      });
    });
    return result;
  }, [cells, cellToDonor, selectedId]);

  return (
    <>
      {/* Outer glow border hexagons */}
      <instancedMesh
        ref={borderRef}
        args={[borderGeom, borderMat, TOTAL_CELLS]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {/* Inner dark fill hexagons */}
      <instancedMesh
        ref={fillRef}
        args={[fillGeom, fillMat, TOTAL_CELLS]}
      />

      {/* Donor name labels */}
      {labels.map((label) => (
        <Html
          key={label.idx}
          position={label.pos}
          center
          zIndexRange={[50, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="pointer-events-none select-none text-center"
            style={{
              opacity: label.selected ? 1 : 0.85,
              textShadow: "0 0 8px rgba(0,200,240,0.9)",
            }}
          >
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
                textAlign: "center",
              }}
            >
              {label.name}
            </div>
            {label.area && (
              <div
                style={{
                  fontSize: "6px",
                  color: "#38b0f0",
                  marginTop: "1px",
                  letterSpacing: "0.03em",
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

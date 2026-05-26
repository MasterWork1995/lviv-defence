"use client";

import { useRef, useMemo, useEffect, useState, useCallback, type RefObject } from "react";
import * as THREE from "three";
import { useThree, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import gsap from "gsap";
import {
  generateDomeCells,
  buildHexShape,
  fmtArea,
  TOTAL_CELLS,
  type DonorData,
} from "./hexUtils";

const DOME_RADIUS = 1.4;
const HEX_SIZE = 0.115;

// HDR colors — ACESFilmic tone-mapping creates soft glow on bright values
const C_EMPTY    = new THREE.Color(0x0a1e3c).multiplyScalar(0.9);   // near-invisible dark
const C_SMALL    = new THREE.Color(0x1a65c0).multiplyScalar(2.8);   // blue glow
const C_MEDIUM   = new THREE.Color(0x00c8f0).multiplyScalar(3.8);   // bright cyan
const C_LARGE    = new THREE.Color(0xf0b429).multiplyScalar(3.8);   // gold
const C_HOVER    = new THREE.Color(0x38b0f0).multiplyScalar(5.5);   // intense blue-cyan
const C_SELECTED = new THREE.Color(0x00d4ff).multiplyScalar(9.0);   // blazing white-cyan

const M2_PER_UAH = 21.833;

function donorColor(squareM2: number): THREE.Color {
  const uah = squareM2 / M2_PER_UAH;
  if (uah >= 10_000) return C_LARGE.clone();
  if (uah >= 1_000)  return C_MEDIUM.clone();
  return C_SMALL.clone();
}

interface TooltipInfo {
  pos: [number, number, number];
  name: string;
  area: string;
}

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  // duck-typed so we avoid drei internal type imports
  controlsRef: RefObject<{ enabled: boolean; target: THREE.Vector3; update: () => void } | null>;
}

export function HexCells({ donors, selectedId, onSelect, controlsRef }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const { camera } = useThree();

  const colorDirty   = useRef(true);
  const hoveredIdxRef = useRef<number | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const cells = useMemo(() => generateDomeCells(DOME_RADIUS), []);

  const { cellToDonor, donorToCell } = useMemo(() => {
    const cellToDonor = new Map<number, DonorData>();
    const donorToCell = new Map<string, number>();
    const sorted = [...donors].sort((a, b) => b.squareM2 - a.squareM2);
    sorted.forEach((donor, i) => {
      const cellIdx = donor.sector != null
        ? Math.min(donor.sector, TOTAL_CELLS - 1)
        : i % TOTAL_CELLS;
      if (!cellToDonor.has(cellIdx)) {
        cellToDonor.set(cellIdx, donor);
        donorToCell.set(donor.id, cellIdx);
      }
    });
    return { cellToDonor, donorToCell };
  }, [donors]);

  const { geom, mat } = useMemo(() => {
    const shape = buildHexShape(HEX_SIZE);
    const geom = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      roughness: 0.05,   // mirror-smooth panels
      metalness: 0.85,   // highly metallic — catches apex light
    });
    return { geom, mat };
  }, []);

  // Place each hex on sphere surface, oriented with normal pointing outward
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const zAxis = new THREE.Vector3(0, 0, 1);

    cells.forEach((cell, i) => {
      const outward = cell.position.clone().normalize();
      dummy.position.copy(cell.position).addScaledVector(outward, 0.009);
      dummy.quaternion.setFromUnitVectors(zAxis, outward);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [cells]);

  // Refs for stable updateColors callback
  const cellToDonorRef = useRef(cellToDonor);
  const donorToCellRef = useRef(donorToCell);
  useEffect(() => { cellToDonorRef.current = cellToDonor; colorDirty.current = true; }, [cellToDonor]);
  useEffect(() => { donorToCellRef.current = donorToCell; }, [donorToCell]);
  useEffect(() => { selectedIdRef.current = selectedId; colorDirty.current = true; }, [selectedId]);

  const updateColors = useCallback(() => {
    if (!meshRef.current) return;
    const ctd = cellToDonorRef.current;
    const dtc = donorToCellRef.current;
    const selCell = selectedIdRef.current ? dtc.get(selectedIdRef.current) : undefined;
    const hovIdx  = hoveredIdxRef.current;
    const color   = new THREE.Color();

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const donor = ctd.get(i);
      if (i === selCell)        color.copy(C_SELECTED);
      else if (i === hovIdx)    color.copy(C_HOVER);
      else if (donor)           color.copy(donorColor(donor.squareM2));
      else                      color.copy(C_EMPTY);
      meshRef.current.setColorAt(i, color);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame(() => {
    if (colorDirty.current) {
      updateColors();
      colorDirty.current = false;
    }
  });

  const flyToCell = useCallback((cellIdx: number) => {
    const cell = cells[cellIdx];
    if (!cell) return;
    const controls = controlsRef.current;
    if (controls) controls.enabled = false;

    const startSph = new THREE.Spherical().setFromVector3(camera.position);
    const dest = cell.position.clone().normalize().multiplyScalar(3.6);
    dest.y = Math.max(dest.y, 0.6);
    const endSph = new THREE.Spherical().setFromVector3(dest);

    const cur = { phi: startSph.phi, theta: startSph.theta, radius: startSph.radius };
    gsap.to(cur, {
      phi: endSph.phi,
      theta: endSph.theta,
      radius: 3.6,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.position.setFromSphericalCoords(cur.radius, cur.phi, cur.theta);
        camera.lookAt(0, 0.4, 0);
      },
      onComplete: () => {
        if (controls) {
          controls.target.set(0, 0.4, 0);
          controls.update();
          controls.enabled = true;
        }
      },
    });
  }, [cells, camera, controlsRef]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const idx = e.instanceId ?? null;
    if (idx === hoveredIdxRef.current) return;
    hoveredIdxRef.current = idx;
    colorDirty.current = true;

    if (idx !== null) {
      const cell  = cells[idx];
      const donor = cellToDonorRef.current.get(idx);
      const s     = 1.2;
      setTooltip({
        pos: [cell.position.x * s, cell.position.y * s, cell.position.z * s],
        name: donor?.name ?? "Вільна сотка",
        area: donor ? fmtArea(donor.squareM2) : "",
      });
    } else {
      setTooltip(null);
    }
  }, [cells]);

  const handlePointerOut = useCallback(() => {
    hoveredIdxRef.current = null;
    colorDirty.current = true;
    setTooltip(null);
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx == null) return;
    const donor = cellToDonorRef.current.get(idx);
    onSelect(donor?.id ?? null);
    flyToCell(idx);
  }, [onSelect, flyToCell]);

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[geom, mat, TOTAL_CELLS]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {tooltip && (
        <Html
          position={tooltip.pos}
          center
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="pointer-events-none whitespace-nowrap rounded border border-primary/40 bg-surface/90 px-2.5 py-1.5 text-xs backdrop-blur-sm">
            <div className="font-semibold text-primary">{tooltip.name}</div>
            {tooltip.area && (
              <div className="mt-0.5 text-text-muted">{tooltip.area}</div>
            )}
          </div>
        </Html>
      )}
    </>
  );
}

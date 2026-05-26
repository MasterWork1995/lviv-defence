"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { HexCells } from "./HexCells";
import { DOME_RADIUS, generateDomeCells, type DonorData } from "./hexUtils";

const R = DOME_RADIUS;
const AUTO_ROTATE_SPEED = 0.06; // rad/sec — full revolution in ~1m 45s

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function DomeScene({ donors, selectedId, onSelect }: Props) {
  const domeRef = useRef<THREE.Group>(null!);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const { camera } = useThree();

  /* Look at the dome upper half — slight upward tilt for the arch effect */
  useEffect(() => {
    camera.lookAt(0, R * 0.55, 0);
  }, [camera]);

  /* When a donor is selected, tween the dome rotation so their cell faces the camera. */
  useEffect(() => {
    if (!domeRef.current) return;
    tweenRef.current?.kill();
    if (!selectedId) return;

    const cells = generateDomeCells(R);
    // Find which cell the selected donor occupies (mirror logic from HexCells)
    const sorted = [...donors].sort((a, b) => b.squareM2 - a.squareM2);
    let cellIndex = -1;
    const donor = sorted.find((d) => d.id === selectedId);
    if (!donor) return;
    if (donor.sector != null && donor.sector < cells.length) {
      cellIndex = donor.sector;
    } else {
      const idx = sorted.indexOf(donor);
      // approximate same azimuth schedule as pickDonorCells: spread evenly
      const t = (idx + 0.5) / sorted.length;
      const targetTheta = t * Math.PI * 2;
      let best = -1,
        bestD = Infinity;
      cells.forEach((c, i) => {
        if (c.isPent) return;
        const d = Math.abs(
          ((c.theta - targetTheta + Math.PI) % (Math.PI * 2)) - Math.PI,
        );
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      cellIndex = best;
    }
    if (cellIndex < 0) return;
    const cell = cells[cellIndex];
    if (!cell) return;

    const current = domeRef.current.rotation.y;
    let target = -cell.theta;
    // shortest-arc tween (avoid spinning the long way around)
    while (target - current > Math.PI) target -= Math.PI * 2;
    while (target - current < -Math.PI) target += Math.PI * 2;

    tweenRef.current = gsap.to(domeRef.current.rotation, {
      y: target,
      duration: 1.1,
      ease: "power3.out",
    });
  }, [selectedId, donors]);

  /* Auto-rotate while nothing is selected */
  useFrame((_, dt) => {
    if (!domeRef.current) return;
    if (selectedId || tweenRef.current?.isActive()) return;
    domeRef.current.rotation.y += dt * AUTO_ROTATE_SPEED;
  });

  return (
    <>
      {/* Ambient — deep navy base fill */}
      <ambientLight color="#061428" intensity={12} />

      {/* Apex: strong cyan beacon from directly above */}
      <pointLight
        position={[0, 4.0, 0]}
        color="#00c8f0"
        intensity={65}
        distance={20}
        decay={2}
      />

      {/* Front-right fill — cool blue */}
      <pointLight
        position={[2, 1.5, 3.5]}
        color="#1a65c0"
        intensity={18}
        distance={14}
        decay={2}
      />

      {/* Rear rim — dramatic edge depth */}
      <pointLight
        position={[-2, 0.5, -3]}
        color="#38b0f0"
        intensity={12}
        distance={12}
        decay={2}
      />

      {/* ⚠ removed purple `#5020a0` accent — replaced with a soft cyan side light */}
      <pointLight
        position={[3.5, 0.2, 0]}
        color="#1a65c0"
        intensity={6}
        distance={10}
        decay={2}
      />

      <group ref={domeRef}>
        {/* Inner dark backing — makes hex cells pop */}
        <mesh>
          <sphereGeometry
            args={[R * 0.984, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color="#010810"
            transparent
            opacity={0.65}
            side={THREE.BackSide}
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* Equator ring: outer wide dim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R * 0.982, 0.015, 8, 96]} />
          <meshBasicMaterial color="#1a65c0" transparent opacity={0.32} />
        </mesh>

        {/* Equator ring: inner thin bright */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R * 0.975, 0.006, 8, 96]} />
          <meshBasicMaterial color="#00c8f0" transparent opacity={0.9} />
        </mesh>

        {/* Apex glint — tiny bright sphere at dome peak */}
        <mesh position={[0, R * 0.997, 0]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>

        {/* Hex donor cells (Goldberg polyhedron tessellation) */}
        <HexCells donors={donors} selectedId={selectedId} onSelect={onSelect} />
      </group>
    </>
  );
}

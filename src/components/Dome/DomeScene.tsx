"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HexCells } from "./HexCells";
import type { DonorData } from "./hexUtils";
import { DOME_RADIUS } from "./hexUtils";

const R = DOME_RADIUS;

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function DomeScene({ donors, selectedId, onSelect }: Props) {
  const domeRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * 0.015; // ~7 min per full revolution
    }
  });

  return (
    <>
      {/* Ambient — deep navy base fill */}
      <ambientLight color="#061428" intensity={12} />

      {/* Apex: strong cyan beacon from directly above */}
      <pointLight position={[0, 4.0, 0]} color="#00c8f0" intensity={65} distance={20} decay={2} />

      {/* Front-right fill — cool blue */}
      <pointLight position={[2, 1.5, 3.5]} color="#1a65c0" intensity={18} distance={14} decay={2} />

      {/* Rear rim — dramatic edge depth */}
      <pointLight position={[-2, 0.5, -3]} color="#38b0f0" intensity={12} distance={12} decay={2} />

      {/* Right accent — subtle magenta/purple tint matching reference */}
      <pointLight position={[3.5, 0.2, 0]} color="#5020a0" intensity={8} distance={10} decay={2} />

      <group ref={domeRef}>
        {/* Outer glass shell — barely visible refraction */}
        <mesh>
          <sphereGeometry args={[R * 1.002, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#1a4080"
            transparent
            opacity={0.035}
            side={THREE.FrontSide}
            roughness={0.05}
            metalness={0.7}
          />
        </mesh>

        {/* Inner dark backing — makes hex cells pop */}
        <mesh>
          <sphereGeometry args={[R * 0.984, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#010810"
            transparent
            opacity={0.65}
            side={THREE.BackSide}
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* Geodesic structural grid lines */}
        <mesh>
          <sphereGeometry args={[R * 0.977, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#1a65c0" transparent opacity={0.055} wireframe />
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

        {/* Hex donor cells */}
        <HexCells
          donors={donors}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </group>
    </>
  );
}

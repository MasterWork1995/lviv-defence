"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { HexCells } from "./HexCells";
import type { DonorData } from "./hexUtils";

const R = 1.4; // dome radius

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function DomeScene({ donors, selectedId, onSelect }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    ctrl.target.set(0, 0.35, 0);
    ctrl.update();
  }, []);

  return (
    <>
      {/* Ambient — deep navy base fill */}
      <ambientLight color="#061428" intensity={8} />

      {/* Apex: strong cyan beacon from above */}
      <pointLight position={[0, 3.5, 0]} color="#00c8f0" intensity={45} distance={15} decay={2} />

      {/* Front-right fill — cool blue */}
      <pointLight position={[2, 1, 3]} color="#1a65c0" intensity={12} distance={10} decay={2} />

      {/* Rear rim — dramatic depth edge */}
      <pointLight position={[-1.5, 0.5, -3]} color="#38b0f0" intensity={8} distance={8} decay={2} />

      {/* Outer glass shell — very subtle FrontSide */}
      <mesh>
        <sphereGeometry args={[R * 1.002, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1a4080"
          transparent
          opacity={0.05}
          side={THREE.FrontSide}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>

      {/* Inner dark backing — makes hex cells pop */}
      <mesh>
        <sphereGeometry args={[R * 0.985, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#020810"
          transparent
          opacity={0.55}
          side={THREE.BackSide}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Geodesic grid lines — barely-there structural feel */}
      <mesh>
        <sphereGeometry args={[R * 0.978, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#1a65c0" transparent opacity={0.05} wireframe />
      </mesh>

      {/* Equator ring: outer wide dim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * 0.982, 0.014, 8, 96]} />
        <meshBasicMaterial color="#1a65c0" transparent opacity={0.28} />
      </mesh>

      {/* Equator ring: inner thin bright */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * 0.976, 0.005, 8, 96]} />
        <meshBasicMaterial color="#38b0f0" transparent opacity={0.75} />
      </mesh>

      {/* Apex glint */}
      <mesh position={[0, R * 0.996, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Hex donor cells */}
      <HexCells
        donors={donors}
        selectedId={selectedId}
        onSelect={onSelect}
        controlsRef={controlsRef}
      />

      {/* Controls — rotation only, NO zoom */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.06}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  );
}

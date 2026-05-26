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

/* ─────────────────────────────────────────────
   Fresnel halo material — cyan rim that intensifies at glancing angles
   ───────────────────────────────────────────── */
function makeRimMaterial(color = 0x5ee8ff, opacity = 0.22) {
  return new THREE.ShaderMaterial({
    uniforms: {
      c: { value: new THREE.Color(color) },
      maxOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vP;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vP = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 c;
      uniform float maxOpacity;
      varying vec3 vN; varying vec3 vP;
      void main() {
        float d = clamp(dot(normalize(vN), normalize(vP)), 0.0, 1.0);
        float f = pow(1.0 - d, 3.5);
        gl_FragColor = vec4(c, f * maxOpacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

export function DomeScene({ donors, selectedId, onSelect }: Props) {
  const domeRef = useRef<THREE.Group>(null!);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const { camera } = useThree();

  /* Look at the dome upper half — slight upward tilt */
  useEffect(() => {
    camera.lookAt(0, R * 0.6, 0);
  }, [camera]);

  /* On selection: tween rotation so the selected donor's cell faces the camera */
  useEffect(() => {
    if (!domeRef.current) return;
    tweenRef.current?.kill();
    if (!selectedId) return;

    const cells = generateDomeCells(R);
    const sorted = [...donors].sort((a, b) => b.squareM2 - a.squareM2);
    const donor = sorted.find((d) => d.id === selectedId);
    if (!donor) return;

    let cellIndex = -1;
    if (donor.sector != null && donor.sector < cells.length) {
      cellIndex = donor.sector;
    } else {
      const idx = sorted.indexOf(donor);
      const t = (idx + 0.5) / sorted.length;
      const targetTheta = t * Math.PI * 2;
      let best = -1, bestD = Infinity;
      cells.forEach((c, i) => {
        if (c.isPent) return;
        const d = Math.abs(((c.theta - targetTheta + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (d < bestD) { bestD = d; best = i; }
      });
      cellIndex = best;
    }
    if (cellIndex < 0) return;
    const cell = cells[cellIndex];
    if (!cell) return;

    const current = domeRef.current.rotation.y;
    let target = -cell.theta;
    while (target - current > Math.PI) target -= Math.PI * 2;
    while (target - current < -Math.PI) target += Math.PI * 2;

    tweenRef.current = gsap.to(domeRef.current.rotation, {
      y: target,
      duration: 1.1,
      ease: "power3.out",
    });
  }, [selectedId, donors]);

  /* Auto-rotate while nothing is selected & no tween is running */
  useFrame((_, dt) => {
    if (!domeRef.current) return;
    if (selectedId || tweenRef.current?.isActive()) return;
    domeRef.current.rotation.y += dt * AUTO_ROTATE_SPEED;
  });

  /* Cache the halo materials so they aren't rebuilt on each render */
  const outerRimMat = useRef<THREE.ShaderMaterial | null>(null);
  const innerRimMat = useRef<THREE.ShaderMaterial | null>(null);
  if (!outerRimMat.current) outerRimMat.current = makeRimMaterial(0x5ee8ff, 0.28);
  if (!innerRimMat.current) innerRimMat.current = makeRimMaterial(0x88e5ff, 0.14);

  return (
    <>
      {/* ── Lighting — cool cyan/blue only, no purple ── */}
      <ambientLight color="#0a1f3a" intensity={4} />
      {/* Apex beacon — strong cyan from directly above */}
      <pointLight position={[0, R * 2.5, 0]} color="#00d4ff" intensity={40} distance={14} decay={2} />
      {/* Front fill — keeps faces toward camera bright */}
      <pointLight position={[1.5, R * 0.8, 3.5]} color="#38b0f0" intensity={14} distance={12} decay={2} />
      {/* Rear rim — silhouettes the back hexes */}
      <pointLight position={[-1.5, R * 0.3, -3]} color="#1a65c0" intensity={10} distance={10} decay={2} />

      <group ref={domeRef}>
        {/* Outer fresnel halo — cyan glow that's only visible at the rim */}
        <mesh>
          <sphereGeometry args={[R * 1.06, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2 + 0.04]} />
          <primitive object={outerRimMat.current} attach="material" />
        </mesh>

        {/* Inner soft glow — adds depth without becoming a solid bowl */}
        <mesh>
          <sphereGeometry args={[R * 0.94, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2 + 0.04]} />
          <primitive object={innerRimMat.current} attach="material" />
        </mesh>

        {/* Base ring at "ground line" — thin bright cyan circle */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R * 0.998, R * 1.014, 128]} />
          <meshBasicMaterial
            color="#5ee8ff"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* Apex glint — tiny bright sphere at dome peak */}
        <mesh position={[0, R * 0.998, 0]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color="#9ff3ff" toneMapped={false} />
        </mesh>

        {/* Hex network */}
        <HexCells donors={donors} selectedId={selectedId} onSelect={onSelect} />
      </group>
    </>
  );
}

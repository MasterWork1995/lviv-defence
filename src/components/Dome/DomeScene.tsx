"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { HexCells } from "./HexCells";
import {
  DOME_RADIUS,
  generateDomeCells,
  getDomeCameraSettings,
  mapTop10ToCells,
  pickExtraCellFor,
  type DonorData,
  type DomeViewport,
} from "./hexUtils";

const R = DOME_RADIUS;
const AUTO_ROTATE_SPEED = 0.025;
const MANUAL_RESUME_MS = 1200;

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  viewport?: DomeViewport;
}

function makeRimMaterial(color = 0x00c8f0, maxOpacity = 0.32) {
  return new THREE.ShaderMaterial({
    uniforms: {
      c: { value: new THREE.Color(color) },
      maxOpacity: { value: maxOpacity },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vP;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vP = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 c; uniform float maxOpacity;
      varying vec3 vN; varying vec3 vP;
      void main() {
        float d = clamp(dot(normalize(vN), normalize(vP)), 0.0, 1.0);
        float f = pow(1.0 - d, 3.5);
        gl_FragColor = vec4(c, f * maxOpacity);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

export function DomeScene({
  donors,
  selectedId,
  onSelect,
  viewport = "desktop",
}: Props) {
  const domeRef = useRef<THREE.Group>(null!);
  const rotTween = useRef<gsap.core.Tween | null>(null);

  const isDragging = useRef(false);
  const lastDragX = useRef(0);
  const dragVelX = useRef(0);
  const manualOverride = useRef(0);

  const { camera, gl } = useThree();

  useEffect(() => {
    const s = getDomeCameraSettings(R, viewport);
    camera.up.set(0, 1, 0);
    camera.position.set(...s.position);
    camera.lookAt(...s.lookAt);
    if ("fov" in camera) {
      (camera as THREE.PerspectiveCamera).fov = s.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, viewport]);

  useEffect(() => {
    const el = gl.domElement;

    const down = (e: PointerEvent) => {
      isDragging.current = true;
      lastDragX.current = e.clientX;
      dragVelX.current = 0;
      manualOverride.current = performance.now();
      el.setPointerCapture(e.pointerId);
      rotTween.current?.kill();
    };
    const move = (e: PointerEvent) => {
      if (!isDragging.current || !domeRef.current) return;
      const dx = e.clientX - lastDragX.current;
      lastDragX.current = e.clientX;
      domeRef.current.rotation.y += dx * 0.006;
      dragVelX.current = dx * 0.006;
    };
    const up = (e: PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  const cells = useMemo(() => generateDomeCells(R), []);
  const baseMap = useMemo(
    () => mapTop10ToCells(cells, donors),
    [cells, donors],
  );

  useEffect(() => {
    if (!domeRef.current) return;
    rotTween.current?.kill();

    if (!selectedId) return;

    const donor = donors.find((d) => d.id === selectedId);
    if (!donor) return;

    let cellIndex = baseMap.byDonor.get(donor.id);
    if (cellIndex == null)
      cellIndex = pickExtraCellFor(cells, baseMap, donor) ?? undefined;
    if (cellIndex == null) return;
    const cell = cells[cellIndex];

    const current = domeRef.current.rotation.y;
    let target = -cell.theta;
    while (target - current > Math.PI) target -= Math.PI * 2;
    while (target - current < -Math.PI) target += Math.PI * 2;
    rotTween.current = gsap.to(domeRef.current.rotation, {
      y: target,
      duration: 1.0,
      ease: "power3.out",
    });
  }, [selectedId, donors, baseMap, cells]);

  useFrame((_, dt) => {
    if (!domeRef.current) return;
    if (selectedId) return;
    if (rotTween.current?.isActive()) return;
    if (isDragging.current) return;

    const sinceManual = performance.now() - manualOverride.current;
    const factor = Math.min(1, sinceManual / MANUAL_RESUME_MS);

    domeRef.current.rotation.y += dt * AUTO_ROTATE_SPEED * factor;
    if (Math.abs(dragVelX.current) > 0.0001) {
      domeRef.current.rotation.y += dragVelX.current;
      dragVelX.current *= 0.88;
    }
  });

  const outerRim = useRef<THREE.ShaderMaterial | null>(null);
  const innerRim = useRef<THREE.ShaderMaterial | null>(null);
  if (!outerRim.current) outerRim.current = makeRimMaterial(0xcad3e8, 0);
  if (!innerRim.current) innerRim.current = makeRimMaterial(0x7e8aa8, 0);

  return (
    <>
      <ambientLight color="#1a2342" intensity={4} />
      <pointLight
        position={[0, R * 2.5, 0]}
        color="#cad3e8"
        intensity={45}
        distance={R * 8}
        decay={2}
      />
      <pointLight
        position={[R * 0.8, R * 0.8, R * 1.8]}
        color="#7e8aa8"
        intensity={14}
        distance={R * 6}
        decay={2}
      />
      <pointLight
        position={[-R * 0.8, R * 0.3, -R * 1.5]}
        color="#3d4866"
        intensity={10}
        distance={R * 5}
        decay={2}
      />

      <group ref={domeRef}>
        <mesh>
          <sphereGeometry
            args={[R * 1.06, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2 + 0.05]}
          />
          <primitive object={outerRim.current} attach="material" />
        </mesh>

        <mesh>
          <sphereGeometry
            args={[R * 0.94, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2 + 0.05]}
          />
          <primitive object={innerRim.current} attach="material" />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R * 0.998, R * 1.014, 128]} />
          <meshBasicMaterial
            color="#f39200"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        <mesh position={[0, R * 0.997, 0]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        <HexCells
          donors={donors}
          selectedId={selectedId}
          onSelect={onSelect}
          viewport={viewport}
        />
      </group>
    </>
  );
}

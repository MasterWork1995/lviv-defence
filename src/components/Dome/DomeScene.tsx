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
const AUTO_ROTATE_SPEED = 0.025; // slow — ~4 min per revolution
const MANUAL_RESUME_MS = 1200; // after how long auto-rotate resumes post-drag

interface Props {
  donors: DonorData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  viewport?: DomeViewport;
}

/* Fresnel rim — bright cyan only at the silhouette of the dome */
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
  const camTween = useRef<gsap.core.Tween | null>(null);
  /** Per-frame live re-aim source: local cell position. */
  const focusedCell = useRef<THREE.Vector3 | null>(null);

  // Drag state — own pointer handlers on the canvas DOM element.
  // ONLY horizontal drag is honoured (vertical drag was confusing — user
  // requested rotation only around the screen's vertical (Y world) axis).
  const isDragging = useRef(false);
  const lastDragX = useRef(0);
  const dragVelX = useRef(0);
  const manualOverride = useRef(0);

  const { camera, gl } = useThree();

  const camSettings = useMemo(
    () => getDomeCameraSettings(R, viewport),
    [viewport],
  );
  const BASE_CAM = useRef(
    new THREE.Vector3(...camSettings.position),
  );
  const BASE_LOOK = useRef(new THREE.Vector3(...camSettings.lookAt));

  useEffect(() => {
    const s = getDomeCameraSettings(R, viewport);
    BASE_CAM.current.set(...s.position);
    BASE_LOOK.current.set(...s.lookAt);
    camera.position.copy(BASE_CAM.current);
    camera.lookAt(BASE_LOOK.current);
    if ("fov" in camera) {
      (camera as THREE.PerspectiveCamera).fov = s.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, R, viewport]);

  /* ── Drag-to-rotate (Y axis + clamped X tilt) ── */
  useEffect(() => {
    const el = gl.domElement;

    const down = (e: PointerEvent) => {
      isDragging.current = true;
      lastDragX.current = e.clientX;
      dragVelX.current = 0;
      manualOverride.current = performance.now();
      el.setPointerCapture(e.pointerId);
      rotTween.current?.kill(); // drag cancels rotation tween
    };
    const move = (e: PointerEvent) => {
      if (!isDragging.current || !domeRef.current) return;
      const dx = e.clientX - lastDragX.current;
      lastDragX.current = e.clientX;
      // Horizontal only → spin around Y axis. Vertical drag is intentionally ignored.
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

  /* Compute the SAME cell mapping HexCells uses (memoised at module scope
     via WeakMap on the donors array, so both calls share one result). */
  const cells = useMemo(() => generateDomeCells(R), []);
  const baseMap = useMemo(
    () => mapTop10ToCells(cells, donors),
    [cells, donors],
  );

  /* ── Selection → rotate + zoom-in camera ── */
  useEffect(() => {
    if (!domeRef.current) return;
    rotTween.current?.kill();
    camTween.current?.kill();

    if (!selectedId) {
      focusedCell.current = null;
      camTween.current = gsap.to(camera.position, {
        x: BASE_CAM.current.x,
        y: BASE_CAM.current.y,
        z: BASE_CAM.current.z,
        duration: 0.9,
        ease: "power3.out",
        onUpdate: () => camera.lookAt(BASE_LOOK.current),
      });
      return;
    }

    const donor = donors.find((d) => d.id === selectedId);
    if (!donor) return;

    // Locate the donor's cell — same logic as HexCells.tsx
    let cellIndex = baseMap.byDonor.get(donor.id);
    if (cellIndex == null)
      cellIndex = pickExtraCellFor(cells, baseMap, donor) ?? undefined;
    if (cellIndex == null) return;
    const cell = cells[cellIndex];

    /* Rotate dome so the hex faces front */
    const current = domeRef.current.rotation.y;
    let target = -cell.theta;
    while (target - current > Math.PI) target -= Math.PI * 2;
    while (target - current < -Math.PI) target += Math.PI * 2;
    rotTween.current = gsap.to(domeRef.current.rotation, {
      y: target,
      duration: 1.1,
      ease: "power3.out",
    });

    /* Camera dolly along the hex's outward normal (straight-on, not from the side) */
    const cosT = Math.cos(-cell.theta);
    const sinT = Math.sin(-cell.theta);
    const cellWorld = new THREE.Vector3(
      cell.position.x * cosT + cell.position.z * sinT,
      cell.position.y,
      -cell.position.x * sinT + cell.position.z * cosT,
    );
    const normalWorld = cellWorld.clone().normalize();
    const camDist = R * 0.95;
    const camTarget = cellWorld.clone().addScaledVector(normalWorld, camDist);

    /* Live re-aim source — recomputed every frame in useFrame below */
    focusedCell.current = cell.position.clone();

    camTween.current = gsap.to(camera.position, {
      x: camTarget.x,
      y: camTarget.y,
      z: camTarget.z,
      duration: 1.1,
      ease: "power3.out",
    });
  }, [selectedId, donors, baseMap, cells, camera]);

  /* Live re-aim — every frame while focused. Only Y rotation matters now. */
  useFrame(() => {
    if (!focusedCell.current || !domeRef.current) return;
    const y = domeRef.current.rotation.y;
    const c = focusedCell.current;
    const tmp = new THREE.Vector3(
      c.x * Math.cos(y) + c.z * Math.sin(y),
      c.y,
      -c.x * Math.sin(y) + c.z * Math.cos(y),
    );
    camera.lookAt(tmp);
  });

  /* Auto-rotate when idle (no selection, no tween, no drag) */
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
  if (!outerRim.current) outerRim.current = makeRimMaterial(0x00c8f0, 0);
  if (!innerRim.current) innerRim.current = makeRimMaterial(0x88e5ff, 0);

  return (
    <>
      {/* Lighting — pure cyan/blue */}
      <ambientLight color="#0a1f3a" intensity={4} />
      <pointLight
        position={[0, R * 2.5, 0]}
        color="#00d4ff"
        intensity={45}
        distance={R * 8}
        decay={2}
      />
      <pointLight
        position={[R * 0.8, R * 0.8, R * 1.8]}
        color="#38b0f0"
        intensity={14}
        distance={R * 6}
        decay={2}
      />
      <pointLight
        position={[-R * 0.8, R * 0.3, -R * 1.5]}
        color="#1a65c0"
        intensity={10}
        distance={R * 5}
        decay={2}
      />

      <group ref={domeRef}>
        {/* Outer fresnel halo */}
        <mesh>
          <sphereGeometry
            args={[R * 1.06, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2 + 0.05]}
          />
          <primitive object={outerRim.current} attach="material" />
        </mesh>

        {/* Inner soft glow */}
        <mesh>
          <sphereGeometry
            args={[R * 0.94, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2 + 0.05]}
          />
          <primitive object={innerRim.current} attach="material" />
        </mesh>

        {/* Base ring on the ground line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R * 0.998, R * 1.014, 128]} />
          <meshBasicMaterial
            color="#00c8f0"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* Apex glint */}
        <mesh position={[0, R * 0.997, 0]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#9fe9ff" toneMapped={false} />
        </mesh>

        {/* Hex network */}
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

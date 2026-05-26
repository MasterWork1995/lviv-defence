"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DomeScene } from "./DomeScene";
import type { DonorData } from "./hexUtils";

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function DomeCanvas() {
  const [donors, setDonors] = useState<DonorData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [webgl] = useState(isWebGLAvailable);

  useEffect(() => {
    const load = () =>
      fetch("/api/donations")
        .then((r) => r.json())
        .then((d: { donations?: DonorData[] }) => {
          if (d.donations) setDonors(d.donations);
        })
        .catch(() => {});

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!webgl) return null;

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0.25, 3.1], fov: 68, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera, gl }) => {
          // Look up at the dome center — creates the arch effect
          camera.lookAt(0, 0.9, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <DomeScene
            donors={donors}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

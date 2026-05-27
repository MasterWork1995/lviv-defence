"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DomeScene } from "./DomeScene";
import { useDomeSelection, setSelected } from "./store";
import { useDonors } from "./donorsStore";

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
  const { donors } = useDonors();           // shared store — no fetch here
  const selectedId = useDomeSelection();
  const [webgl] = useState(isWebGLAvailable);

  if (!webgl) return null;

  return (
    <div className="h-full w-full">
      <Canvas
        /* Camera tuned for DOME_RADIUS = 3.4 */
        camera={{ position: [0, 0.7, 8.4], fov: 46, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.25;
        }}
        style={{ background: "transparent", touchAction: "none", cursor: "grab" }}
      >
        <Suspense fallback={null}>
          <DomeScene donors={donors} selectedId={selectedId} onSelect={setSelected} />
        </Suspense>
      </Canvas>
    </div>
  );
}

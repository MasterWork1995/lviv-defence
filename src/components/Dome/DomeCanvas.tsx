"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DomeScene } from "./DomeScene";
import { getDomeCameraSettings } from "./hexUtils";
import { useDomeSelection, setSelected } from "./store";
import { useDonors } from "./donorsStore";
import { useDomeViewport } from "./useDomeViewport";

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
  const { donors } = useDonors();
  const selectedId = useDomeSelection();
  const [webgl] = useState(isWebGLAvailable);
  const viewport = useDomeViewport();
  const domeCamera = useMemo(
    () => getDomeCameraSettings(undefined, viewport),
    [viewport],
  );

  if (!webgl) return null;

  return (
    <div className="h-full w-full touch-none">
      <Canvas
        camera={{
          position: domeCamera.position,
          fov: domeCamera.fov,
          near: domeCamera.near,
          far: domeCamera.far,
        }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.25;
        }}
        style={{ background: "transparent", touchAction: "none", cursor: "grab" }}
      >
        <Suspense fallback={null}>
          <DomeScene
            donors={donors}
            selectedId={selectedId}
            onSelect={setSelected}
            viewport={viewport}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

import * as THREE from "three";

/* ─────────────────────────────────────────────
   Goldberg-polyhedron dome cells.

   Mathematically: subdivide an icosahedron, then take its DUAL — every vertex
   becomes a face. Degree-6 vertices yield hexagons; the 12 original
   icosahedron vertices yield pentagons. We keep only the upper hemisphere.

   detail=2 → ~80 cells, detail=3 → ~320, detail=4 → ~1280.
   3 is the sweet spot for the dome on the homepage.
   ───────────────────────────────────────────── */

export interface DomeCell {
  index: number;
  /** centroid on the sphere surface */
  position: THREE.Vector3;
  /** outward normal (== position normalized) */
  normal: THREE.Vector3;
  /** ordered ring of vertices around the cell, on the sphere surface */
  verts: THREE.Vector3[];
  /** true ⇒ 5-gon (12 of them), false ⇒ 6-gon */
  isPent: boolean;
  /** azimuth around Y axis (in radians, range −π..π) — used to tween rotation */
  theta: number;
  /** legacy: rough ring index (0 = top), kept for back-compat with old code */
  ringIndex: number;
}

export interface DonorData {
  id: string;
  name: string;
  amount: number;
  squareM2: number;
  sector: number | null;
}

export const DOME_RADIUS = 1.6;
const SUBDIVISION = 3;

/* ─── one-time mesh build (memoised at module load) ─── */
let CELLS_CACHE: DomeCell[] | null = null;

export function generateDomeCells(radius = DOME_RADIUS): DomeCell[] {
  if (CELLS_CACHE && radius === DOME_RADIUS) return CELLS_CACHE;

  const ico = new THREE.IcosahedronGeometry(radius, SUBDIVISION);
  const arr = ico.attributes.position.array as Float32Array;

  // 1. merge duplicate verts (IcosahedronGeometry is non-indexed)
  const map = new Map<string, number>();
  const verts: number[] = [];
  const tris: [number, number, number][] = [];
  const vid = (x: number, y: number, z: number) => {
    const k = `${Math.round(x * 1000)},${Math.round(y * 1000)},${Math.round(z * 1000)}`;
    let id = map.get(k);
    if (id === undefined) {
      id = verts.length / 3;
      map.set(k, id);
      verts.push(x, y, z);
    }
    return id;
  };
  for (let i = 0; i < arr.length; i += 9) {
    tris.push([
      vid(arr[i], arr[i + 1], arr[i + 2]),
      vid(arr[i + 3], arr[i + 4], arr[i + 5]),
      vid(arr[i + 6], arr[i + 7], arr[i + 8]),
    ]);
  }

  // 2. vertex → adjacent triangles
  const v2t = new Map<number, number[]>();
  tris.forEach((t, ti) =>
    t.forEach((v) => {
      const list = v2t.get(v);
      if (list) list.push(ti);
      else v2t.set(v, [ti]);
    }),
  );

  // 3. one face per vertex (centroid + neighboring tri centers as boundary)
  const out: DomeCell[] = [];
  v2t.forEach((triList, vi) => {
    if (triList.length < 5) return; // ignore boundary verts (shouldn't happen on sphere)

    const cx = verts[vi * 3];
    const cy = verts[vi * 3 + 1];
    const cz = verts[vi * 3 + 2];
    const position = new THREE.Vector3(cx, cy, cz);
    const normal = position.clone().normalize();

    const boundary = triList.map((ti) => {
      const [a, b, c] = tris[ti];
      const x = (verts[a * 3] + verts[b * 3] + verts[c * 3]) / 3;
      const y = (verts[a * 3 + 1] + verts[b * 3 + 1] + verts[c * 3 + 1]) / 3;
      const z = (verts[a * 3 + 2] + verts[b * 3 + 2] + verts[c * 3 + 2]) / 3;
      // push triangle centroid out to the sphere surface
      const k = radius / Math.hypot(x, y, z);
      return new THREE.Vector3(x * k, y * k, z * k);
    });

    // sort boundary points by angle around the face normal so the polygon is convex
    const u = (
      Math.abs(normal.y) < 0.99
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0)
    )
      .cross(normal)
      .normalize();
    const v = new THREE.Vector3().crossVectors(normal, u);
    boundary.sort((A, B) => {
      const a1 = Math.atan2(
        A.clone().sub(position).dot(v),
        A.clone().sub(position).dot(u),
      );
      const a2 = Math.atan2(
        B.clone().sub(position).dot(v),
        B.clone().sub(position).dot(u),
      );
      return a1 - a2;
    });

    out.push({
      index: 0, // assigned after filtering
      position,
      normal,
      verts: boundary,
      isPent: boundary.length === 5,
      theta: Math.atan2(cx, cz),
      ringIndex: Math.round((1 - cy / radius) * 4), // 0..~8 — for legacy refs
    });
  });

  // 4. keep upper hemisphere only (y > -ε)
  const upper = out.filter((f) => f.position.y > -0.05 * radius);
  // 5. assign final indices (used for InstancedMesh / sector matching)
  upper.forEach((c, i) => {
    c.index = i;
  });

  CELLS_CACHE = upper;
  return upper;
}

/* ─────────────────────────────────────────────
   Donor → cell assignment.

   Picks 10 cells spread evenly around the dome at varied latitudes,
   skipping the 12 pentagons so donors always land on hexes.
   Returns indices in the same order as the input donors (sorted by area DESC).
   ───────────────────────────────────────────── */
export function pickDonorCells(
  cells: DomeCell[],
  donorCount: number,
): number[] {
  const targets: { theta: number; phi: number }[] = [];
  // jittered fibonacci-style spread
  for (let i = 0; i < donorCount; i++) {
    const t = (i + 0.5) / donorCount;
    targets.push({
      theta: t * Math.PI * 2,
      phi: 0.45 + (i % 3) * 0.25, // alternates between 3 latitudes
    });
  }
  const used = new Set<number>();
  return targets.map((t) => {
    const tx = Math.sin(t.phi) * Math.sin(t.theta);
    const ty = Math.cos(t.phi);
    const tz = Math.sin(t.phi) * Math.cos(t.theta);
    let best = -1;
    let bestD = Infinity;
    cells.forEach((c, i) => {
      if (used.has(i) || c.isPent) return;
      const dx = c.normal.x - tx;
      const dy = c.normal.y - ty;
      const dz = c.normal.z - tz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) used.add(best);
    return best;
  });
}

/* ─────────────────────────────────────────────
   Deterministic per-cell pseudo-random (for hue/brightness variation)
   ───────────────────────────────────────────── */
export function cellHash(i: number): number {
  let x = ((i * 2654435761) >>> 0) ^ 0x9e3779b9;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x85ebca6b) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  return (x >>> 0) / 4294967295;
}

/* ─────────────────────────────────────────────
   Format helpers (kept from the previous implementation)
   ───────────────────────────────────────────── */
export function fmtArea(m2: number): string {
  if (m2 <= 0) return "";
  if (m2 < 100_000) {
    return new Intl.NumberFormat("uk-UA").format(Math.round(m2)) + " м²";
  }
  const km2 = m2 / 1_000_000;
  return (km2 >= 1 ? km2.toFixed(2) : km2.toFixed(3)) + " км²";
}

/* ─── legacy exports kept for backwards-compatibility with older code ─── */
export const TOTAL_CELLS = (() => generateDomeCells().length)();

/** @deprecated — kept only for components that haven't migrated yet */
export const HEX_OUTER = 0.235;
/** @deprecated — kept only for components that haven't migrated yet */
export const HEX_INNER = 0.185;

/** @deprecated — Goldberg cells already carry their own vertex polygon */
export function buildHexShape(circumradius: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * circumradius;
    const y = Math.sin(a) * circumradius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

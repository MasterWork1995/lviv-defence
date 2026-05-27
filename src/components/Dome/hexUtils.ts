import * as THREE from "three";

/* ─────────────────────────────────────────────
   Goldberg-polyhedron dome cells.

   Subdivide an icosahedron, take its DUAL — every vertex becomes a face.
   Degree-6 vertices yield hexagons; the 12 original icosahedron vertices
   yield pentagons. Upper hemisphere only.

   detail=3 → ~150–180 cells in the upper hemisphere.
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
  /** azimuth around Y axis (in radians, range −π..π) */
  theta: number;
  /** legacy: rough ring index (0 = top) */
  ringIndex: number;
}

export interface DonorData {
  id: string;
  name: string;
  amount: number;
  squareM2: number;
  sector: number | null;
}

export const DOME_RADIUS = 4.5;
const SUBDIVISION = 3;

export type DomeViewport = "desktop" | "tablet" | "mobile";

const DOME_CAMERA_PRESETS: Record<
  DomeViewport,
  { z: number; y: number; fov: number; lookAtYFactor: number }
> = {
  desktop: { z: 8.4, y: 0.7, fov: 46, lookAtYFactor: 0.4 },
  tablet: { z: 11.6, y: 0.64, fov: 42, lookAtYFactor: 0.36 },
  mobile: { z: 10.8, y: 0.66, fov: 40, lookAtYFactor: 0.38 },
};

export const DOME_LABEL_PRESETS: Record<
  DomeViewport,
  {
    distanceFactor: number;
    uiScale: number;
    namePx: number;
    areaPx: number;
    maxWidthPx: number;
    padY: number;
    padX: number;
    dotRadius: number;
  }
> = {
  desktop: {
    distanceFactor: 12,
    uiScale: 0.88,
    namePx: 10,
    areaPx: 8,
    maxWidthPx: 110,
    padY: 3,
    padX: 7,
    dotRadius: 0.016,
  },
  tablet: {
    distanceFactor: 13,
    uiScale: 0.88,
    namePx: 10,
    areaPx: 8,
    maxWidthPx: 110,
    padY: 3,
    padX: 7,
    dotRadius: 0.016,
  },
  mobile: {
    distanceFactor: 10,
    uiScale: 0.76,
    namePx: 9,
    areaPx: 7,
    maxWidthPx: 96,
    padY: 2,
    padX: 6,
    dotRadius: 0.014,
  },
};

export const getDomeCameraSettings = (
  radius = DOME_RADIUS,
  viewport: DomeViewport = "desktop",
) => {
  const p = DOME_CAMERA_PRESETS[viewport];
  return {
    position: [0, p.y, p.z] as [number, number, number],
    lookAt: [0, radius * p.lookAtYFactor, 0] as [number, number, number],
    fov: p.fov,
    near: 0.1,
    far: 100,
  };
};

let CELLS_CACHE: DomeCell[] | null = null;
let CELLS_CACHE_RADIUS: number | null = null;

export function generateDomeCells(radius = DOME_RADIUS): DomeCell[] {
  if (CELLS_CACHE && CELLS_CACHE_RADIUS === radius) return CELLS_CACHE;

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

  // 3. one face per vertex
  const out: DomeCell[] = [];
  v2t.forEach((triList, vi) => {
    if (triList.length < 5) return;

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
      const k = radius / Math.hypot(x, y, z);
      return new THREE.Vector3(x * k, y * k, z * k);
    });

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
      index: 0,
      position,
      normal,
      verts: boundary,
      isPent: boundary.length === 5,
      theta: Math.atan2(cx, cz),
      ringIndex: Math.round((1 - cy / radius) * 4),
    });
  });

  const upper = out.filter((f) => f.position.y > -0.05 * radius);
  upper.forEach((c, i) => {
    c.index = i;
  });

  CELLS_CACHE_RADIUS = radius;
  CELLS_CACHE = upper;
  return upper;
}

const DONOR_VIEW_BIAS = new THREE.Vector3(0, 0.22, 1).normalize();

export function cellPlacementScore(cell: DomeCell): number {
  const n = cell.normal;
  const front = Math.max(0, n.dot(DONOR_VIEW_BIAS));
  const idealY = 0.38;
  const yFit = 1 - Math.min(1, Math.abs(n.y - idealY) / 0.4);
  const apexPenalty = n.y > 0.72 ? (n.y - 0.72) * 4 : 0;
  return front * 0.6 + yFit * 0.4 - apexPenalty;
}

export function pickDonorCells(
  cells: DomeCell[],
  donorCount: number,
): number[] {
  const targets: { theta: number; phi: number }[] = [];
  for (let i = 0; i < donorCount; i++) {
    const t = (i + 0.5) / donorCount;
    targets.push({
      theta: t * Math.PI * 2,
      phi: 1.12 + (i % 4) * 0.11,
    });
  }
  const used = new Set<number>();
  return targets.map((t) => {
    const tx = Math.sin(t.phi) * Math.sin(t.theta);
    const ty = Math.cos(t.phi);
    const tz = Math.sin(t.phi) * Math.cos(t.theta);
    let best = -1;
    let bestScore = Infinity;
    cells.forEach((c, i) => {
      if (used.has(i) || c.isPent) return;
      const dx = c.normal.x - tx,
        dy = c.normal.y - ty,
        dz = c.normal.z - tz;
      const dist = dx * dx + dy * dy + dz * dz;
      const score = dist - cellPlacementScore(c) * 0.42;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best >= 0) used.add(best);
    return best;
  });
}

/* ─────────────────────────────────────────────
   STABLE mapping from donors → cells.

   Key property: positions of the TOP-10 donors DO NOT change when
   `selectedId` changes.  This was the source of the "crooked" feel —
   previously we re-ran pickDonorCells() on every selection, which
   shuffled all 10 positions whenever a 11th was added.

   Strategy:
     1. Sort donors by squareM2 desc.
     2. Top 10 get assigned to cells via pickDonorCells (stable: depends only
        on donors, not selectedId).
     3. If the selected donor is OUTSIDE top 10, pick a free cell for them
        based on a hash of their id (deterministic, stable per donor).
   ───────────────────────────────────────────── */
export interface DonorCellMap {
  /** cellIndex → donor */
  byCell: Map<number, DonorData>;
  /** donor.id → cellIndex */
  byDonor: Map<string, number>;
}

const baseMapCache = new WeakMap<DonorData[], DonorCellMap>();

export function mapTop10ToCells(
  cells: DomeCell[],
  donors: DonorData[],
): DonorCellMap {
  // Memo on the donors array reference — recomputes only when donors actually change.
  const cached = baseMapCache.get(donors);
  if (cached) return cached;

  const sorted = [...donors].sort((a, b) => b.squareM2 - a.squareM2);
  const top10 = sorted.slice(0, 10);
  const byCell = new Map<number, DonorData>();
  const byDonor = new Map<string, number>();

  // 1. Honour explicit `sector` first (top-10 only)
  const reserved = new Set<number>();
  const claimed = new Set<string>();
  top10.forEach((d) => {
    if (
      d.sector != null &&
      d.sector < cells.length &&
      !cells[d.sector].isPent
    ) {
      reserved.add(d.sector);
      byCell.set(d.sector, d);
      byDonor.set(d.id, d.sector);
      claimed.add(d.id);
    }
  });

  // 2. Remaining top-10 → pickDonorCells over the free cells
  const remaining = top10.filter((d) => !claimed.has(d.id));
  const free = cells.filter((c) => !reserved.has(c.index));
  const picks = pickDonorCells(free, remaining.length);
  remaining.forEach((d, i) => {
    const idx = free[picks[i]]?.index;
    if (idx != null) {
      byCell.set(idx, d);
      byDonor.set(d.id, idx);
    }
  });

  const result = { byCell, byDonor };
  baseMapCache.set(donors, result);
  return result;
}

/** Pick a deterministic free cell for a donor outside top-10 (for selection). */
export function pickExtraCellFor(
  cells: DomeCell[],
  baseMap: DonorCellMap,
  donor: DonorData,
): number | null {
  if (baseMap.byDonor.has(donor.id)) return baseMap.byDonor.get(donor.id)!;
  if (
    donor.sector != null &&
    donor.sector < cells.length &&
    !cells[donor.sector].isPent &&
    !baseMap.byCell.has(donor.sector)
  ) {
    return donor.sector;
  }
  const free = cells.filter((c) => !c.isPent && !baseMap.byCell.has(c.index));
  if (free.length === 0) return null;
  let h = 2166136261;
  for (let i = 0; i < donor.id.length; i++) {
    h ^= donor.id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const tie = ((h >>> 0) % 1000) / 100000;
  let best = free[0].index;
  let bestScore = -Infinity;
  for (const c of free) {
    const s = cellPlacementScore(c) + tie;
    if (s > bestScore) {
      bestScore = s;
      best = c.index;
    }
  }
  return best;
}

/* Deterministic per-cell pseudo-random (hue/brightness variation) */
export function cellHash(i: number): number {
  let x = ((i * 2654435761) >>> 0) ^ 0x9e3779b9;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x85ebca6b) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  return (x >>> 0) / 4294967295;
}

export function fmtArea(m2: number): string {
  if (m2 <= 0) return "";
  if (m2 < 100_000) {
    return new Intl.NumberFormat("uk-UA").format(Math.round(m2)) + " м²";
  }
  const km2 = m2 / 1_000_000;
  return (km2 >= 1 ? km2.toFixed(2) : km2.toFixed(3)) + " км²";
}

/* ─── legacy exports kept for backwards-compatibility ─── */
export const TOTAL_CELLS = (() => generateDomeCells().length)();

/** @deprecated */
export const HEX_OUTER = 0.235;
/** @deprecated */
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

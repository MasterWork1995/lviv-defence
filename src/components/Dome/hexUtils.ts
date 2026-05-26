import * as THREE from "three";

export interface DomeCell {
  index: number;
  position: THREE.Vector3;
  ringIndex: number;
}

export interface DonorData {
  id: string;
  name: string;
  amount: number;
  squareM2: number;
  sector: number | null;
}

const DEG = Math.PI / 180;

// (degrees from Y-pole, cell count per ring)
const RINGS = [
  { thetaDeg: 0,  count: 1  },
  { thetaDeg: 18, count: 6  },
  { thetaDeg: 34, count: 12 },
  { thetaDeg: 48, count: 18 },
  { thetaDeg: 61, count: 24 },
  { thetaDeg: 74, count: 28 },
] as const;

export const TOTAL_CELLS = RINGS.reduce((s, r) => s + r.count, 0); // 89

export function generateDomeCells(radius: number): DomeCell[] {
  const cells: DomeCell[] = [];
  let idx = 0;

  RINGS.forEach(({ thetaDeg, count }, ringIndex) => {
    const theta = thetaDeg * DEG;
    // Odd rings rotated half-step for better cell packing
    const phiOffset = ringIndex % 2 === 1 ? Math.PI / Math.max(count, 1) : 0;

    for (let j = 0; j < count; j++) {
      const phi = (j / Math.max(count, 1)) * 2 * Math.PI + phiOffset;
      cells.push({
        index: idx++,
        position: new THREE.Vector3(
          radius * Math.sin(theta) * Math.cos(phi),
          radius * Math.cos(theta),
          radius * Math.sin(theta) * Math.sin(phi),
        ),
        ringIndex,
      });
    }
  });

  return cells;
}

export function buildHexShape(circumradius: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6; // flat-top orientation
    const x = Math.cos(angle) * circumradius;
    const y = Math.sin(angle) * circumradius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function fmtArea(m2: number): string {
  if (m2 <= 0) return "";
  if (m2 < 100_000) {
    return new Intl.NumberFormat("uk-UA").format(Math.round(m2)) + " м²";
  }
  const km2 = m2 / 1_000_000;
  return (km2 >= 1 ? km2.toFixed(2) : km2.toFixed(3)) + " км²";
}

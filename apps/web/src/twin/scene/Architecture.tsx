'use client';

/**
 * The building: forecourt, facade and doorway, the nave with its colonnade and
 * coffered beams, clerestory windows, and the Chaitya arch at the far end.
 *
 * The composition is arranged around one sightline. From the doorway, the
 * centre aisle runs clear to the Chaitya arch and the Constitution gallery
 * inside it, and a pair of brass inlay lines on the floor lead the eye there.
 * Devices sit either side of that line, never on it.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { box, mergeParts, type Part } from '../geometry';
import { hallMaterials } from '../materials';
import { HALL, WINDOW, hallCentreZ, hallLength } from '../layout';

const W = HALL.halfWidth;
const H = HALL.height;

function chaityaArch(): THREE.BufferGeometry {
  // A horseshoe arch, the gavaksha of the Buddhist cave halls: the curve runs
  // past the half circle before dropping into the jambs.
  const c = 6.2;
  const R = 5.2;
  const r = 4.2;
  const a0 = (-12 * Math.PI) / 180;
  const a1 = (192 * Math.PI) / 180;
  const ox = R * Math.cos(a0);
  const ix = r * Math.cos(a0);
  const s = new THREE.Shape();
  s.moveTo(ox, 0);
  s.lineTo(ox, c + R * Math.sin(a0));
  s.absarc(0, c, R, a0, a1, false);
  s.lineTo(-ox, 0);
  s.lineTo(-ix, 0);
  s.lineTo(-ix, c + r * Math.sin(a0));
  s.absarc(0, c, r, a1, a0, true);
  s.lineTo(ix, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 1.3,
    bevelEnabled: true,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    bevelSegments: 2,
    curveSegments: 48,
  });
  g.translate(0, 0, -0.65);
  return g;
}

function archRibs(): THREE.BufferGeometry[] {
  // Concentric ribs recessed inside the arch, after the timber ribs that the
  // rock-cut chaitya halls reproduced in stone.
  return [3.95, 3.7].map((radius, i) => {
    const t = new THREE.TorusGeometry(radius, 0.09, 8, 64, (204 * Math.PI) / 180);
    t.rotateZ((-12 * Math.PI) / 180);
    t.translate(0, 6.2, -0.5 - i * 0.35);
    return t;
  });
}

export function Architecture() {
  const m = hallMaterials();

  const g = useMemo(() => {
    const plain: Part[] = [];
    const carved: Part[] = [];
    const dark: Part[] = [];

    // The front of the hall is now the memorial's rotunda: the drum encloses
    // this end of the nave and its recessed portal is the doorway. The carved
    // temple facade that used to stand at HALL.front is gone with it — it was
    // seventeen metres of elevation in front of a building that has its own.
    // A short return wall either side of the opening is all that is left, and
    // it is hidden inside the drum. Memorial.tsx owns what a visitor sees.
    const dw = HALL.doorHalfWidth;
    for (const sx of [-1, 1]) {
      plain.push({
        geometry: box(W - dw, H, 0.8),
        position: [sx * (dw + (W - dw) / 2), H / 2, HALL.front - 2.4],
      });
    }
    plain.push({
      geometry: box(dw * 2, H - HALL.doorHeight, 0.8),
      position: [0, (H + HALL.doorHeight) / 2, HALL.front - 2.4],
    });

    // Nave walls, back wall and ceiling slab.
    plain.push({
      geometry: box(0.6, H, hallLength),
      position: [-(W + 0.3), H / 2, hallCentreZ],
    });
    plain.push({
      geometry: box(0.6, H, hallLength),
      position: [W + 0.3, H / 2, hallCentreZ],
    });
    plain.push({
      geometry: box(W * 2 + 1.2, H, 0.6),
      position: [0, H / 2, HALL.back - 0.3],
    });
    dark.push({
      geometry: box(W * 2 + 1.2, 0.5, hallLength + 1.2),
      position: [0, H + 0.25, hallCentreZ],
    });

    // Interior frieze in carved red sandstone, per the building record. It
    // runs on the right wall only: the left wall carries the clerestory
    // windows, and a frieze at this height would cut straight across them.
    carved.push({
      geometry: box(0.24, 1.0, hallLength),
      position: [W - 0.12, 9.4, hallCentreZ],
    });
    plain.push({
      geometry: box(0.5, 0.3, hallLength),
      position: [W - 0.25, 10.05, hallCentreZ],
    });
    carved.push({
      geometry: box(W * 2, 1.0, 0.24),
      position: [0, 9.4, HALL.back + 0.12],
    });

    // Colonnade: base, shaft and capital per column.
    for (const sx of [-1, 1]) {
      for (const z of HALL.columnsZ) {
        const x = sx * HALL.colonnadeX;
        // Plain shafts. Carving every column made the colonnade read as a
        // lattice; relief is kept for the gate, the arch and the friezes.
        plain.push({ geometry: box(1.25, 0.4, 1.25), position: [x, 0.2, z] });
        plain.push({
          geometry: box(0.88, H - 1.2, 0.88),
          position: [x, (H - 1.2) / 2 + 0.4, z],
        });
        carved.push({ geometry: box(1.02, 0.7, 1.02), position: [x, 1.4, z] });
        plain.push({ geometry: box(1.3, 0.55, 1.3), position: [x, H - 0.52, z] });
      }
    }

    // Coffered ceiling: transverse beams on the column lines, and two
    // longitudinal beams over the colonnades.
    for (const z of HALL.columnsZ) {
      plain.push({ geometry: box(W * 2, 0.7, 0.55), position: [0, H - 0.35, z] });
    }
    for (const sx of [-1, 1]) {
      plain.push({
        geometry: box(0.6, 0.7, hallLength),
        position: [sx * HALL.colonnadeX, H - 0.35, hallCentreZ],
      });
    }

    // Chaitya arch on a dais, with recessed ribs.
    carved.push({ geometry: chaityaArch(), position: [0, 0.45, HALL.archZ] });
    for (const rib of archRibs())
      carved.push({ geometry: rib, position: [0, 0.45, HALL.archZ] });
    plain.push({ geometry: box(13, 0.45, 5.5), position: [0, 0.225, HALL.archZ - 1.6] });
    plain.push({ geometry: box(11, 0.22, 0.6), position: [0, 0.11, HALL.archZ + 1.4] });

    return {
      plain: mergeParts(plain, 2.4),
      carved: mergeParts(carved, 3.4),
      dark: mergeParts(dark),
    };
  }, []);

  const windows = useMemo(() => {
    // Tall clerestory windows on the left wall, between the columns.
    const parts: Part[] = HALL.columnsZ.slice(0, -1).map((z, i) => ({
      geometry: new THREE.PlaneGeometry(1.35, WINDOW.height),
      position: [-(W - 0.02), WINDOW.centreY, (z + (HALL.columnsZ[i + 1] ?? z)) / 2] as [
        number,
        number,
        number,
      ],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
    }));
    return mergeParts(parts);
  }, []);

  const inlay = useMemo(() => {
    // A processional path in brass, from the threshold to the dais.
    const length = HALL.front - (HALL.archZ + 1.7);
    const z = HALL.archZ + 1.7 + length / 2;
    return mergeParts([
      { geometry: box(0.07, 0.012, length), position: [-1.15, 0.006, z] },
      { geometry: box(0.07, 0.012, length), position: [1.15, 0.006, z] },
    ]);
  }, []);

  return (
    <group>
      <mesh geometry={g.plain} material={m.sandstone} />
      <mesh geometry={g.carved} material={m.carved} />
      <mesh geometry={g.dark} material={m.ceiling} />
      <mesh geometry={windows} material={m.window} />
      <mesh geometry={inlay} material={m.inlay} />

      {/*
        The forecourt, its paved path and the dusk sky sphere are gone. The
        ground outside is the memorial's campus now, and the sky over it is
        daylight. Both belong to the exterior, which is culled the moment the
        visitor is in here anyway.
      */}
    </group>
  );
}

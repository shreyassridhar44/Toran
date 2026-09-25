'use client';

/**
 * The road outside the compound wall, with its kerbs, footpaths and markings.
 *
 * Alipur Road runs past the memorial's gate, and the arrival begins above it.
 * A monument standing in empty ground reads as a render; the same monument with
 * a kerb and a bus lane in front of it reads as a place.
 *
 * Markings are geometry rather than part of the asphalt texture. The road is
 * long and thin, and a map carrying the centre line would either repeat it
 * every few metres or have to be enormous.
 */

import { useMemo } from 'react';
import { COMPOUND, ROAD } from '../../campus';
import { box, mergeParts, type Part } from '../../geometry';
import { campusMaterials } from '../../materials';

export function Road() {
  const m = campusMaterials();
  const length = ROAD.extent * 2;

  const surface = useMemo(
    () =>
      mergeParts(
        [
          {
            geometry: box(length, 0.06, ROAD.halfWidth * 2),
            position: [0, 0.03, ROAD.centreZ],
          },
        ],
        6,
      ),
    [length],
  );

  const kerbs = useMemo(() => {
    const parts: Part[] = [];
    for (const side of [-1, 1]) {
      const z = ROAD.centreZ + side * ROAD.halfWidth;
      parts.push({
        geometry: box(length, ROAD.kerbHeight + 0.12, 0.32),
        position: [0, (ROAD.kerbHeight + 0.12) / 2, z],
      });
      // The footpath behind the kerb, a little proud of the road.
      parts.push({
        geometry: box(length, ROAD.kerbHeight, ROAD.footpathHalfWidth * 2),
        position: [0, ROAD.kerbHeight / 2, z + side * (ROAD.footpathHalfWidth + 0.16)],
      });
    }
    // The strip between the near footpath and the compound wall.
    const gapZ = ROAD.centreZ - ROAD.halfWidth - ROAD.footpathHalfWidth * 2;
    const gap = gapZ - COMPOUND.frontZ;
    parts.push({
      geometry: box(length, 0.05, gap),
      position: [0, 0.025, COMPOUND.frontZ + gap / 2],
    });
    return mergeParts(parts, 3);
  }, [length]);

  const markings = useMemo(() => {
    const parts: Part[] = [];
    // A dashed centre line, three metres on and five off, as Indian roads mark.
    const dash = 3;
    const gap = 5;
    for (let x = -ROAD.extent; x < ROAD.extent; x += dash + gap) {
      parts.push({
        geometry: box(dash, 0.02, 0.14),
        position: [x + dash / 2, 0.07, ROAD.centreZ],
      });
    }
    // Solid edge lines, set in from the kerb.
    for (const side of [-1, 1]) {
      parts.push({
        geometry: box(length, 0.02, 0.12),
        position: [0, 0.07, ROAD.centreZ + side * (ROAD.halfWidth - 0.7)],
      });
    }
    return mergeParts(parts);
  }, [length]);

  return (
    <group>
      <mesh geometry={surface} material={m.asphalt} />
      <mesh geometry={kerbs} material={m.concrete} />
      <mesh geometry={markings} material={m.marking} />
    </group>
  );
}

'use client';

/**
 * The ring plaza, the approach, and the mudra walls that flank it.
 *
 * The concentric paving is the dominant ground pattern of the whole site and
 * the thing that organises the bird's eye shot: seventeen bands of cream and
 * warm grey centred on the Ashoka pillar. They are geometry rather than a
 * texture because their edges have to stay crisp seen from directly above, and
 * a texture sharp enough to do that across a sixty metre plaza would cost more
 * than the memorial's entire texture budget.
 *
 * Alternate rings share a material, so the whole plaza is two draw calls.
 *
 * The mudra walls are arcs about the same centre, which is why they read as
 * part of the plaza rather than as two walls that happen to be curved. Each
 * carries a row of bronze hands in the Buddhist gestures, on circular bosses
 * with a name plaque beneath.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { MEMORIAL, MUDRA, PLAZA } from '../../campus';
import { box, mergeParts, type Part } from '../../geometry';
import { campusMaterials } from '../../materials';
import { arcBand, mergeRaw, ring } from '../world';

/**
 * A hand, projecting from the wall on its boss.
 *
 * Eleven of these a side, at two metres, seen in passing. A palm and four
 * fingers is enough to read as a gesture; `turn` rotates the palm so no two
 * hands along the wall are alike.
 */
function hand(turn: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const palm = new THREE.SphereGeometry(0.17, 8, 6);
  palm.scale(1, 1.25, 0.42);
  parts.push(palm);

  for (let i = 0; i < 4; i++) {
    const f = new THREE.CapsuleGeometry(0.035, 0.17 + i * 0.015, 3, 6);
    f.translate((i - 1.5) * 0.075, 0.28, 0);
    parts.push(f);
  }
  // Thumb, out to one side and forward.
  const thumb = new THREE.CapsuleGeometry(0.042, 0.13, 3, 6);
  thumb.rotateZ(0.9);
  thumb.translate(-0.17, 0.09, 0.04);
  parts.push(thumb);

  // Wrist, running back into the boss.
  const wrist = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
  wrist.rotateX(Math.PI / 2);
  wrist.translate(0, -0.14, -0.14);
  parts.push(wrist);

  const g = mergeRaw(parts);
  g.rotateZ(turn);
  return g;
}

export function Plaza() {
  const m = campusMaterials();

  // The rings, split by parity so the two tones cost one draw call each.
  const { light, dark } = useMemo(() => {
    const step = (PLAZA.outerRadius - PLAZA.innerRadius) / PLAZA.rings;
    const a: Part[] = [];
    const b: Part[] = [];
    for (let i = 0; i < PLAZA.rings; i++) {
      const inner = PLAZA.innerRadius + i * step;
      // A hair of overlap, so a grazing view never finds a seam of ground
      // between two rings.
      const g = ring(inner, inner + step + 0.02, 96, 0.01);
      (i % 2 === 0 ? a : b).push({ geometry: g });
    }
    return { light: mergeParts(a, 3.0), dark: mergeParts(b, 3.0) };
  }, []);

  // The paved approach, from the plaza's inner edge to the foot of the steps,
  // and from its outer edge back toward the gate.
  const approach = useMemo(() => {
    const parts: Part[] = [];
    const innerZ = PLAZA.centreZ - PLAZA.outerRadius;
    const outerZ = PLAZA.centreZ + PLAZA.outerRadius;

    const toSteps = innerZ - MEMORIAL.stepsFrontZ;
    parts.push({
      geometry: box(PLAZA.approachHalfWidth * 2, 0.02, toSteps + 1),
      position: [0, 0.01, MEMORIAL.stepsFrontZ + toSteps / 2],
    });

    const toGate = 110 - outerZ;
    parts.push({
      geometry: box(PLAZA.approachHalfWidth * 2, 0.02, toGate + 1),
      position: [0, 0.01, outerZ + toGate / 2],
    });

    return mergeParts(parts, 3.0);
  }, []);

  // The two mudra walls, as arcs about the plaza's centre.
  const walls = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const mirror of [false, true]) {
      parts.push(
        arcBand({
          ax: MUDRA.radius,
          az: MUDRA.radius,
          startAngle: Math.PI / 2 - MUDRA.halfSweep,
          endAngle: Math.PI / 2 + MUDRA.halfSweep,
          segments: 40,
          width: MUDRA.thickness,
          height: MUDRA.height,
          y: MUDRA.height / 2,
          centreZ: MUDRA.centreZ,
          mirror,
        }),
      );
      // A coping along the top.
      parts.push(
        arcBand({
          ax: MUDRA.radius,
          az: MUDRA.radius,
          startAngle: Math.PI / 2 - MUDRA.halfSweep,
          endAngle: Math.PI / 2 + MUDRA.halfSweep,
          segments: 40,
          width: MUDRA.thickness + 0.18,
          height: 0.22,
          y: MUDRA.height + 0.11,
          centreZ: MUDRA.centreZ,
          mirror,
        }),
      );
    }
    const g = mergeRaw(parts);
    return g;
  }, []);

  // The hands and their bosses, ranged along both walls.
  const { hands, bosses } = useMemo(() => {
    const handParts: THREE.BufferGeometry[] = [];
    const bossParts: THREE.BufferGeometry[] = [];

    for (const mirror of [false, true]) {
      const sx = mirror ? -1 : 1;
      for (let i = 0; i < MUDRA.hands; i++) {
        // Ranged across the sweep, inset from both ends so none sits on a
        // corner of the wall.
        const t = (i + 0.5) / MUDRA.hands;
        const a = Math.PI / 2 - MUDRA.halfSweep + MUDRA.halfSweep * 2 * t;
        const x = sx * MUDRA.radius * Math.sin(a);
        const z = MUDRA.centreZ + MUDRA.radius * Math.cos(a);

        // Inward, toward the plaza, which is the side the visitor stands on and
        // the only side a hand can project from. Deriving this from the yaw
        // instead of from the position sent every hand the other way, and the
        // whole row ended up buried in the masonry.
        const dx = -x;
        const dz = MUDRA.centreZ - z;
        const len = Math.hypot(dx, dz) || 1;
        const nx = dx / len;
        const nz = dz / len;
        const yaw = Math.atan2(nx, nz);

        const boss = new THREE.CylinderGeometry(
          MUDRA.bossRadius,
          MUDRA.bossRadius,
          0.18,
          14,
        );
        boss.rotateX(Math.PI / 2);
        boss.rotateY(yaw);
        boss.translate(
          x + nx * (MUDRA.thickness / 2),
          MUDRA.handY,
          z + nz * (MUDRA.thickness / 2),
        );
        bossParts.push(boss);

        // Each hand turned differently, so the row is a series of gestures
        // rather than eleven copies of one.
        const h = hand(((i * 1.7) % 4) * 0.45 - 0.9);
        h.rotateY(yaw);
        h.translate(
          x + nx * (MUDRA.thickness / 2 + 0.3),
          MUDRA.handY,
          z + nz * (MUDRA.thickness / 2 + 0.3),
        );
        handParts.push(h);

        // The name plaque under it, flat on the face of the wall.
        const plaque = box(0.46, 0.17, 0.05);
        plaque.rotateY(yaw);
        plaque.translate(
          x + nx * (MUDRA.thickness / 2 + 0.02),
          MUDRA.handY - 0.62,
          z + nz * (MUDRA.thickness / 2 + 0.02),
        );
        bossParts.push(plaque);
      }
    }

    return { hands: mergeRaw(handParts), bosses: mergeRaw(bossParts) };
  }, []);

  return (
    <group>
      <group position={[PLAZA.centreX, 0, PLAZA.centreZ]}>
        <mesh geometry={light} material={m.pavingLight} />
        <mesh geometry={dark} material={m.pavingDark} />
      </group>
      <mesh geometry={approach} material={m.pavingLight} />
      <mesh geometry={walls} material={m.ashlar} />
      <mesh geometry={hands} material={m.verdigris} />
      <mesh geometry={bosses} material={m.gold} />
    </group>
  );
}

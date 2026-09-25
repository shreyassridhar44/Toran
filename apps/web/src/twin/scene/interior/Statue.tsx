'use client';

/**
 * Dr. Ambedkar, in bronze, at the centre of the atrium.
 *
 * The pose is the one every memorial to him uses and the one in image8: standing
 * in a three-piece suit, the right arm raised with the index finger pointing
 * upward, the left arm holding a bound copy of the Constitution against the
 * chest. Those three things — the raised arm, the book, the heavy spectacles —
 * are what identify him, and they are the whole brief for this model. Nothing
 * else about it needs to be accurate, because nothing else is read.
 *
 * Built from primitives and merged, so the statue is one draw call. It is the
 * closest the camera comes to any figure in the twin: the arrival ends looking
 * at it from nine metres.
 *
 * The pedestal is dark granite with the inscription in gold —
 * BHARAT RATNA, DR. BHIMRAO AMBEDKAR — drawn rather than modelled.
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { HALL, STATUE } from '../../layout';
import { box } from '../../geometry';
import { campusMaterials } from '../../materials';
import { inscription } from '../../textures';
import { mergeRaw } from '../world';

/**
 * The figure, feet at the origin, facing +z.
 *
 * `h` is head-to-heel; every dimension below is a fraction of it, so the whole
 * statue scales from one number.
 */
function figure(h: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, x = 0, y = 0, z = 0) => {
    g.translate(x, y, z);
    parts.push(g);
  };
  /** A limb: capsules, because a cylinder has hard ends and reads as pipework. */
  const limb = (r: number, len: number, tilt: number, roll = 0) => {
    const g = new THREE.CapsuleGeometry(r, len, 4, 10);
    if (roll !== 0) g.rotateX(roll);
    if (tilt !== 0) g.rotateZ(tilt);
    return g;
  };

  // Legs, in trousers: one foot a little forward, weight on the other.
  for (const side of [-1, 1] as const) {
    add(limb(0.049 * h, 0.4 * h, side * 0.02), side * 0.055 * h, 0.25 * h, 0);
    const shoe = new THREE.SphereGeometry(0.042 * h, 10, 7);
    shoe.scale(1, 0.55, 1.9);
    add(shoe, side * 0.055 * h, 0.028 * h, 0.026 * h);
  }

  // The coat. Three sections rather than one tube: a hem that flares over the
  // hips, a waist that draws in, and a chest that broadens to the shoulders.
  // The taper is the whole difference between a suit and a barrel.
  const hem = new THREE.CylinderGeometry(0.121 * h, 0.132 * h, 0.14 * h, 18);
  add(hem, 0, 0.5 * h, 0);
  const waist = new THREE.CylinderGeometry(0.128 * h, 0.121 * h, 0.13 * h, 18);
  add(waist, 0, 0.635 * h, 0);
  const chest = new THREE.CylinderGeometry(0.142 * h, 0.128 * h, 0.14 * h, 18);
  add(chest, 0, 0.77 * h, 0);
  // Shoulders: a capsule across the top, which is what gives a figure its
  // width where the eye looks for it.
  const shoulders = new THREE.CapsuleGeometry(0.062 * h, 0.17 * h, 4, 12);
  shoulders.rotateZ(Math.PI / 2);
  add(shoulders, 0, 0.828 * h, 0);
  // Lapels, a shallow V down the chest.
  for (const side of [-1, 1] as const) {
    const lapel = box(0.045 * h, 0.17 * h, 0.028 * h);
    lapel.rotateZ(side * 0.2);
    add(lapel, side * 0.035 * h, 0.75 * h, 0.115 * h);
  }

  // Neck and head.
  add(new THREE.CylinderGeometry(0.037 * h, 0.044 * h, 0.055 * h, 12), 0, 0.862 * h, 0);
  const head = new THREE.SphereGeometry(0.069 * h, 14, 12);
  head.scale(0.92, 1.12, 1);
  add(head, 0, 0.94 * h, 0);
  // Hair, swept back and high, and the jaw below it.
  const hair = new THREE.SphereGeometry(0.073 * h, 14, 12);
  hair.scale(0.98, 0.82, 1.02);
  add(hair, 0, 0.972 * h, -0.006 * h);
  const jaw = new THREE.SphereGeometry(0.05 * h, 10, 8);
  jaw.scale(0.94, 0.8, 0.94);
  add(jaw, 0, 0.9 * h, 0.014 * h);
  // Spectacles. Two rims and a bridge, and they cost almost nothing for how
  // much of the likeness they carry.
  for (const side of [-1, 1] as const) {
    const rim = new THREE.TorusGeometry(0.022 * h, 0.0045 * h, 6, 16);
    add(rim, side * 0.027 * h, 0.944 * h, 0.06 * h);
  }
  add(box(0.022 * h, 0.0045 * h, 0.006 * h), 0, 0.944 * h, 0.062 * h);

  // Left arm: upper arm down the side, forearm across the ribs, holding the
  // Constitution against the chest.
  add(limb(0.035 * h, 0.16 * h, 0.16), -0.15 * h, 0.735 * h, 0);
  add(limb(0.031 * h, 0.17 * h, Math.PI / 2 - 0.3), -0.115 * h, 0.625 * h, 0.075 * h);
  // The book: cover, and pages a shade proud of it on the outer face.
  const cover = box(0.115 * h, 0.16 * h, 0.036 * h);
  cover.rotateZ(0.13);
  cover.rotateY(-0.16);
  add(cover, -0.058 * h, 0.655 * h, 0.128 * h);
  const pages = box(0.1 * h, 0.144 * h, 0.042 * h);
  pages.rotateZ(0.13);
  pages.rotateY(-0.16);
  add(pages, -0.056 * h, 0.655 * h, 0.13 * h);
  // The hand over the lower edge of it.
  const hand = new THREE.SphereGeometry(0.034 * h, 10, 8);
  hand.scale(1, 0.7, 1.2);
  add(hand, -0.052 * h, 0.583 * h, 0.15 * h);

  // Right arm, raised: upper arm out and up, forearm vertical, index finger
  // extended. This is what carries the statue at any distance.
  add(limb(0.036 * h, 0.17 * h, -0.72), 0.168 * h, 0.775 * h, 0);
  add(limb(0.031 * h, 0.19 * h, -0.08), 0.253 * h, 0.945 * h, 0.006 * h);
  const fist = new THREE.SphereGeometry(0.04 * h, 10, 8);
  fist.scale(1, 1.1, 1);
  add(fist, 0.266 * h, 1.055 * h, 0.01 * h);
  add(
    new THREE.CapsuleGeometry(0.012 * h, 0.06 * h, 3, 8),
    0.266 * h,
    1.122 * h,
    0.014 * h,
  );

  return mergeRaw(parts);
}

export function Statue() {
  const m = campusMaterials();

  const bronze = useMemo(() => {
    const g = figure(STATUE.height);
    g.translate(0, HALL.floorY - STATUE.wellDepth + STATUE.pedestalHeight, STATUE.z);
    return g;
  }, []);

  const pedestal = useMemo(() => {
    const base = HALL.floorY - STATUE.wellDepth;
    const w = STATUE.pedestalHalfWidth;
    const h = STATUE.pedestalHeight;
    return mergeRaw([
      // A plinth course, the die, and a cap: the three parts every pedestal has.
      (() => {
        const g = box(w * 2.3, 0.22, w * 2.3);
        g.translate(0, base + 0.11, STATUE.z);
        return g;
      })(),
      (() => {
        const g = box(w * 2, h - 0.42, w * 2);
        g.translate(0, base + 0.22 + (h - 0.42) / 2, STATUE.z);
        return g;
      })(),
      (() => {
        const g = box(w * 2.2, 0.2, w * 2.2);
        g.translate(0, base + h - 0.1, STATUE.z);
        return g;
      })(),
    ]);
  }, []);

  const plaque = useMemo(() => inscription(), []);
  const plaqueMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ map: plaque, transparent: true, toneMapped: false }),
    [plaque],
  );
  useEffect(
    () => () => {
      plaque.dispose();
      plaqueMaterial.dispose();
    },
    [plaque, plaqueMaterial],
  );

  const plaqueY = HALL.floorY - STATUE.wellDepth + STATUE.pedestalHeight * 0.55;

  return (
    <group>
      <mesh geometry={pedestal} material={m.granite} />
      <mesh geometry={bronze} material={m.bronze} />
      {/* The inscription, on the face the entrance looks at. */}
      <mesh
        position={[0, plaqueY, STATUE.z + STATUE.pedestalHalfWidth + 0.02]}
        material={plaqueMaterial}
      >
        <planeGeometry
          args={[STATUE.pedestalHalfWidth * 1.8, STATUE.pedestalHalfWidth * 0.62]}
        />
      </mesh>
    </group>
  );
}

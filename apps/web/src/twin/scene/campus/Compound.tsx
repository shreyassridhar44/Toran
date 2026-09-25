'use client';

/**
 * The compound wall, the main gate, and the gate house with its guard.
 *
 * This is the threshold of the memorial and the first thing the arrival flies
 * through, so it carries the identification: the name in raised gold letters on
 * the wall panel west of the gate, the notice boards under it, and a lion on
 * the coping above.
 *
 * The gate stands open. Both leaves are swung back nearly flat against their
 * piers, which is how they are during visiting hours and, incidentally, the
 * only way the camera gets through.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { COMPOUND, GATEHOUSE, MEMORIAL } from '../../campus';
import { box, mergeParts, type Part } from '../../geometry';
import { campusMaterials } from '../../materials';
import { coped, figure, lion, mergeRaw } from '../world';

const W = COMPOUND.halfWidth;
const H = COMPOUND.wallHeight;
const T = COMPOUND.wallThickness;

/** Where the piers and the wicket sit, derived so nothing overlaps. */
const PIER_INNER = COMPOUND.gateHalfWidth;
const PIER_OUTER = PIER_INNER + COMPOUND.pierHalfWidth * 2;
const WICKET_INNER = PIER_OUTER;
const WICKET_OUTER = WICKET_INNER + COMPOUND.wicketHalfWidth * 2;

/** A run of wall with its coping, along x at a fixed z. */
function run(fromX: number, toX: number, z: number, height: number = H): Part[] {
  const width = toX - fromX;
  if (width <= 0) return [];
  const x = (fromX + toX) / 2;
  return [
    { geometry: box(width, height, T), position: [x, height / 2, z] },
    {
      geometry: coped(width, COMPOUND.copingHeight, T, 0.09),
      position: [x, height + COMPOUND.copingHeight / 2, z],
    },
  ];
}

/** A run of wall along z at a fixed x. */
function runZ(fromZ: number, toZ: number, x: number): Part[] {
  const length = fromZ - toZ;
  const z = (fromZ + toZ) / 2;
  return [
    { geometry: box(T, H, length), position: [x, H / 2, z] },
    {
      geometry: coped(T, COMPOUND.copingHeight, length, 0.09),
      position: [x, H + COMPOUND.copingHeight / 2, z],
    },
  ];
}

/**
 * One leaf of the main gate: a frame of vertical bars under a scrolled head.
 *
 * Built in its own plane and swung about the hinge by the caller, so both
 * leaves are the same geometry mirrored.
 */
function leaf(width: number): THREE.BufferGeometry {
  const h = COMPOUND.gateHeight;
  const parts: THREE.BufferGeometry[] = [];
  const at = (g: THREE.BufferGeometry, x: number, y: number, z = 0) => {
    g.translate(x, y, z);
    parts.push(g);
  };

  // Frame.
  at(box(width, 0.14, 0.12), width / 2, 0.07);
  at(box(width, 0.12, 0.12), width / 2, h * 0.46);
  at(box(width, 0.16, 0.12), width / 2, h - 0.08);
  at(box(0.14, h, 0.13), 0.07, h / 2);
  at(box(0.14, h, 0.13), width - 0.07, h / 2);

  // Balusters, closer together in the lower register as cast gates are.
  const bars = Math.max(4, Math.round(width / 0.42));
  for (let i = 1; i < bars; i++) {
    const x = (i / bars) * width;
    at(box(0.06, h - 0.2, 0.08), x, h / 2);
  }

  // Scrollwork in the upper register, suggested by rings rather than modelled.
  const rings = Math.max(2, Math.round(width / 1.1));
  for (let i = 0; i < rings; i++) {
    const x = ((i + 0.5) / rings) * width;
    const ring = new THREE.TorusGeometry(0.19, 0.035, 6, 14);
    at(ring, x, h * 0.73);
  }

  // Finials along the head.
  for (let i = 0; i <= bars; i += 2) {
    const x = (i / bars) * width;
    at(new THREE.ConeGeometry(0.07, 0.26, 6), x, h + 0.13);
  }

  return mergeRaw(parts);
}

export function Compound() {
  const m = campusMaterials();

  const stone = useMemo(() => {
    const parts: Part[] = [];

    // The front wall, broken by the gate, its piers and the wicket. The name
    // wall is a taller panel to the west, so the run beside it stops short.
    const nameInner = COMPOUND.nameWallCentreX + COMPOUND.nameWallHalfWidth;
    const nameOuter = COMPOUND.nameWallCentreX - COMPOUND.nameWallHalfWidth;

    parts.push(...run(WICKET_OUTER, W, COMPOUND.frontZ));
    parts.push(...run(-WICKET_OUTER, nameInner, COMPOUND.frontZ));
    parts.push(...run(nameOuter, nameInner, COMPOUND.frontZ, COMPOUND.nameWallHeight));
    parts.push(...run(-W, nameOuter, COMPOUND.frontZ));

    // Piers either side of the main leaves, and outside the wicket.
    for (const side of [-1, 1]) {
      for (const [inner, outer] of [
        [PIER_INNER, PIER_OUTER],
        [WICKET_OUTER, WICKET_OUTER + 0.9],
      ] as const) {
        const width = outer - inner;
        const x = side * (inner + width / 2);
        parts.push({
          geometry: box(width, COMPOUND.pierHeight, T + 0.5),
          position: [x, COMPOUND.pierHeight / 2, COMPOUND.frontZ],
        });
        // Pyramidal capstone.
        parts.push({
          geometry: new THREE.ConeGeometry(width * 0.8, 0.5, 4),
          position: [x, COMPOUND.pierHeight + 0.25, COMPOUND.frontZ],
          rotation: [0, Math.PI / 4, 0],
        });
      }
    }

    // The wicket's own head, so the opening reads as a gate rather than a gap.
    for (const side of [-1, 1]) {
      parts.push({
        geometry: box(COMPOUND.wicketHalfWidth * 2, 0.5, T),
        position: [
          side * (WICKET_INNER + COMPOUND.wicketHalfWidth),
          H - 0.25,
          COMPOUND.frontZ,
        ],
      });
    }

    // Side and back walls.
    for (const side of [-1, 1]) {
      parts.push(...runZ(COMPOUND.frontZ, COMPOUND.backZ, side * W));
    }
    parts.push(...run(-W, W, COMPOUND.backZ));

    // The gate house: a small cabin set back inside the wall, and its roof.
    parts.push({
      geometry: box(GATEHOUSE.width, GATEHOUSE.height, GATEHOUSE.depth),
      position: [GATEHOUSE.x, GATEHOUSE.height / 2, GATEHOUSE.z],
    });
    parts.push({
      geometry: box(GATEHOUSE.width + 0.5, 0.22, GATEHOUSE.depth + 0.5),
      position: [GATEHOUSE.x, GATEHOUSE.height + 0.11, GATEHOUSE.z],
    });

    // Two metres per repeat, so the coursing reads on a three metre wall.
    return mergeParts(parts, 2.0);
  }, []);

  const gold = useMemo(() => {
    const parts: Part[] = [];

    // Both main leaves, hinged at their piers and swung back so the gate is
    // open. Eighty degrees, not ninety: a gate flat against its wall reads as
    // a decoration, and the camera still has eleven metres to fly through.
    for (const side of [-1, 1]) {
      parts.push({
        geometry: leaf(COMPOUND.gateHalfWidth),
        position: [side * PIER_INNER, 0, COMPOUND.frontZ],
        rotation: [0, side * (Math.PI / 2 - 0.17), 0],
        scale: [side, 1, 1],
      });
      // The wicket, closed.
      parts.push({
        geometry: leaf(COMPOUND.wicketHalfWidth * 2 * 0.98),
        position: [side * WICKET_INNER, 0, COMPOUND.frontZ],
        scale: [side, 1, 1],
      });
    }

    return mergeRaw(
      parts.map((p) => {
        const g = p.geometry.clone();
        const [rx, ry, rz] = p.rotation ?? [0, 0, 0];
        g.applyMatrix4(
          new THREE.Matrix4().compose(
            new THREE.Vector3(...(p.position ?? [0, 0, 0])),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
            new THREE.Vector3(...(p.scale ?? [1, 1, 1])),
          ),
        );
        return g;
      }),
    );
  }, []);

  // A lion on the coping above the name wall, as on the real gate.
  const capital = useMemo(() => {
    const g = lion();
    g.scale(0.85, 0.85, 0.85);
    g.rotateY(Math.PI);
    g.translate(
      COMPOUND.nameWallCentreX + COMPOUND.nameWallHalfWidth - 1.4,
      COMPOUND.nameWallHeight + COMPOUND.copingHeight,
      COMPOUND.frontZ,
    );
    return g;
  }, []);

  const guard = useMemo(() => {
    const g = figure('seated');
    // Facing the gate, at the cabin's doorway.
    g.rotateY(-Math.PI / 2.4);
    g.translate(GATEHOUSE.x - GATEHOUSE.width / 2 - 0.5, 0.42, GATEHOUSE.z - 0.3);
    // The stool he sits on.
    return mergeRaw([
      g,
      (() => {
        const s = box(0.52, 0.42, 0.46);
        s.translate(GATEHOUSE.x - GATEHOUSE.width / 2 - 0.5, 0.21, GATEHOUSE.z - 0.3);
        return s;
      })(),
    ]);
  }, []);

  return (
    <group>
      <mesh geometry={stone} material={m.ashlar} />
      <mesh geometry={gold} material={m.gold} />
      <mesh geometry={capital} material={m.verdigris} />
      <mesh geometry={guard} material={m.khaki} />

      {/*
        The name, as a decal a few centimetres proud of the stone. Drawn rather
        than modelled: raised metal letters are a bump map's job, and at the
        speed the flight passes the wall nobody reads them in relief.
      */}
      <mesh
        position={[
          COMPOUND.nameWallCentreX,
          COMPOUND.nameWallHeight * 0.58,
          COMPOUND.frontZ + T / 2 + 0.04,
        ]}
        material={m.nameplate}
      >
        <planeGeometry
          args={[COMPOUND.nameWallHalfWidth * 1.85, COMPOUND.nameWallHalfWidth * 0.46]}
        />
      </mesh>

      {/* A lantern on the wall beside the name, as in the photographs. */}
      <mesh
        position={[
          COMPOUND.nameWallCentreX + COMPOUND.nameWallHalfWidth + 0.6,
          COMPOUND.nameWallHeight - 0.5,
          COMPOUND.frontZ + T / 2 + 0.2,
        ]}
        material={m.lampGlow}
      >
        <sphereGeometry args={[0.2, 10, 8]} />
      </mesh>

      {/* The strip of paving inside the gate, before the approach begins. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, MEMORIAL.plinthY * 0.005, COMPOUND.frontZ - 6]}
        material={m.concrete}
      >
        <planeGeometry args={[WICKET_OUTER * 2 + 6, 12]} />
      </mesh>
    </group>
  );
}

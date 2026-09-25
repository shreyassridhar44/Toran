'use client';

/**
 * The Ashoka pillar at the centre of the plaza, on the sightline between the
 * gate and the entrance arch.
 *
 * Anatomy, after the Sarnath original: a stepped plinth, a polished monolithic
 * shaft tapering as it rises, the inverted lotus bell, an abacus carrying the
 * frieze of four animals and twenty-four spoked wheels, and the four lions back
 * to back on top.
 *
 * It stands on a platform shaped as a dharmachakra — twenty-four paved spokes
 * radiating from the plinth with wedges of lawn between them — which is the one
 * element of the memorial's grounds that is legible only from the air, and so
 * the reason the arrival opens on a bird's eye view.
 *
 * The pillar is the pivot the flight turns around and the closest the camera
 * ever comes to a piece of sculpture on the campus, so it gets more geometry
 * than anything else outside the building.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { PILLAR } from '../../campus';
import { box, mergeParts, type Part } from '../../geometry';
import { campusMaterials } from '../../materials';
import { lion, mergeRaw, ring, wedge } from '../world';

/** The inverted lotus bell under the abacus, as a lathe. */
function bell(): THREE.BufferGeometry {
  const profile: THREE.Vector2[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Narrow at the shaft, flaring out and up: the petals of a lotus turned
    // over. A straight cone here read as a lampshade.
    const r =
      PILLAR.shaftTopRadius + (PILLAR.abacusRadius - PILLAR.shaftTopRadius) * t ** 0.62;
    profile.push(new THREE.Vector2(r, t * PILLAR.bellHeight));
  }
  return new THREE.LatheGeometry(profile, 28);
}

export function Pillar() {
  const m = campusMaterials();

  // The wheel platform: paved spokes, and the kerb around the outside.
  const paving = useMemo(() => {
    const parts: Part[] = [];
    const inner = PILLAR.plinthHalfWidth * 1.7;

    for (let i = 0; i < PILLAR.spokes; i++) {
      const a = (i / PILLAR.spokes) * Math.PI * 2;
      parts.push({
        geometry: wedge(
          inner,
          PILLAR.wheelRadius,
          a,
          PILLAR.spokeHalfAngle,
          PILLAR.wheelRise,
        ),
      });
    }
    // The hub the spokes spring from, and the rim they end at.
    parts.push({ geometry: ring(0, inner, 48, PILLAR.wheelRise) });
    parts.push({
      geometry: ring(PILLAR.wheelRadius - 0.55, PILLAR.wheelRadius, 64, PILLAR.wheelRise),
    });
    // The step down to the plaza, so the platform has a thickness.
    parts.push({
      geometry: new THREE.CylinderGeometry(
        PILLAR.wheelRadius,
        PILLAR.wheelRadius + 0.2,
        PILLAR.wheelRise,
        64,
        1,
        true,
      ),
      position: [0, PILLAR.wheelRise / 2, 0],
    });

    return mergeParts(parts, 2.4);
  }, []);

  // The lawn wedges showing between the spokes.
  const grass = useMemo(
    () =>
      ring(
        PILLAR.plinthHalfWidth * 1.7,
        PILLAR.wheelRadius - 0.55,
        64,
        PILLAR.wheelRise - 0.06,
      ),
    [],
  );

  const stone = useMemo(() => {
    const parts: Part[] = [];
    const base = PILLAR.wheelRise;

    // Stepped plinth: three courses, each smaller than the one below.
    for (let i = 0; i < 3; i++) {
      const half = PILLAR.plinthHalfWidth * (1 - i * 0.13);
      const h = PILLAR.plinthHeight / 3;
      parts.push({
        geometry: box(half * 2, h, half * 2),
        position: [0, base + h * (i + 0.5), 0],
      });
    }
    return mergeParts(parts, 1.6);
  }, []);

  const column = useMemo(() => {
    const base = PILLAR.wheelRise + PILLAR.plinthHeight;
    const parts: THREE.BufferGeometry[] = [];

    const shaft = new THREE.CylinderGeometry(
      PILLAR.shaftTopRadius,
      PILLAR.shaftBottomRadius,
      PILLAR.shaftHeight,
      24,
    );
    shaft.translate(0, base + PILLAR.shaftHeight / 2, 0);
    parts.push(shaft);

    const b = bell();
    b.translate(0, base + PILLAR.shaftHeight, 0);
    parts.push(b);

    const abacusY = base + PILLAR.shaftHeight + PILLAR.bellHeight;
    const abacus = new THREE.CylinderGeometry(
      PILLAR.abacusRadius,
      PILLAR.abacusRadius,
      PILLAR.abacusHeight,
      28,
    );
    abacus.translate(0, abacusY + PILLAR.abacusHeight / 2, 0);
    parts.push(abacus);

    // The frieze on the abacus: four wheels at the cardinal points, with an
    // animal between each pair. Suggested with torus and block, because at the
    // height of a lion capital nothing finer survives the distance.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const t = new THREE.TorusGeometry(0.17, 0.026, 6, 16);
      t.rotateY(Math.PI / 2 - a);
      t.translate(
        Math.sin(a) * PILLAR.abacusRadius,
        abacusY + PILLAR.abacusHeight / 2,
        Math.cos(a) * PILLAR.abacusRadius,
      );
      parts.push(t);

      const between = a + Math.PI / 4;
      const beast = box(0.34, 0.2, 0.08);
      beast.rotateY(-between);
      beast.translate(
        Math.sin(between) * PILLAR.abacusRadius,
        abacusY + PILLAR.abacusHeight / 2,
        Math.cos(between) * PILLAR.abacusRadius,
      );
      parts.push(beast);
    }

    // The four lions, back to back, each facing outward.
    //
    // Set well apart. At a 0.42 m offset their manes overlapped and the capital
    // read as one dark lump from the plaza, which is the only place anybody
    // looks at it from. The gap between them is what says there are four.
    const lionY = abacusY + PILLAR.abacusHeight;
    const scale = PILLAR.lionHeight / 1.4;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const l = lion();
      l.scale(scale, scale, scale);
      l.rotateY(a);
      l.translate(Math.sin(a) * 0.68, lionY, Math.cos(a) * 0.68);
      parts.push(l);
    }

    return mergeRaw(parts);
  }, []);

  return (
    <group position={[PILLAR.x, 0, PILLAR.z]}>
      <mesh geometry={grass} material={m.lawn} />
      <mesh geometry={paving} material={m.pavingLight} />
      <mesh geometry={stone} material={m.ashlar} />
      {/*
        Shaft, bell, abacus and lions in one polished dark stone. The Sarnath
        capital is sandstone, but the memorial's pillar reads almost black
        against the sky in every photograph of it, and that silhouette is what
        the arrival turns around.
      */}
      <mesh geometry={column} material={m.granite} />
    </group>
  );
}

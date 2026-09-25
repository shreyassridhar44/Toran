'use client';

/**
 * The atrium: the domed space inside the rotunda, and the first thing a visitor
 * sees through the arch.
 *
 * From image8 — a dark, almost black room with a perforated coffered ceiling
 * vaulting overhead, polished granite underfoot, and the bronze statue standing
 * in a sunken well behind a glass balustrade. The one colour in it is a
 * cyan wash thrown up the statue from below, which is the signature light of the
 * whole interior and the reason the hall reads as a memorial rather than as a
 * foyer.
 *
 * The drum outside and this shell inside are two different pieces of geometry:
 * the exterior is culled the moment the visitor is in here, so the room needs
 * its own walls. They are modelled as back faces of a cylinder and a dome, which
 * costs two draw calls and no double-sided materials.
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MEMORIAL } from '../../campus';
import { HALL, STATUE } from '../../layout';
import { campusMaterials } from '../../materials';
import { coffer } from '../../textures';
import { mergeRaw, ring } from '../world';

/** A little inside the drum, so the two shells never z-fight. */
const R = MEMORIAL.rotundaRadius - 0.35;

export function Atrium() {
  const m = campusMaterials();

  const ceiling = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // The drum's inner face, from the top of the doorway to the springing of
    // the dome. Open ended and inside out: we only ever see it from within.
    const wallTop = MEMORIAL.drumHeight;
    const wall = new THREE.CylinderGeometry(R, R, wallTop - HALL.floorY, 48, 1, true);
    wall.translate(0, HALL.floorY + (wallTop - HALL.floorY) / 2, MEMORIAL.rotundaZ);
    parts.push(wall);

    // The dome over it.
    const dome = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(R, MEMORIAL.domeHeight - 0.6, R);
    dome.translate(0, wallTop, MEMORIAL.rotundaZ);
    parts.push(dome);

    const g = mergeRaw(parts);
    // Flip the winding so the faces point inward, which is the only direction
    // anyone stands in.
    const index = g.getIndex();
    if (index !== null) {
      const a = index.array as Uint32Array | Uint16Array;
      for (let i = 0; i < a.length; i += 3) {
        const t = a[i] as number;
        a[i] = a[i + 2] as number;
        a[i + 2] = t;
      }
      index.needsUpdate = true;
    }
    g.scale(-1, 1, 1);
    g.computeVertexNormals();
    return g;
  }, []);

  const cofferMap = useMemo(() => {
    const t = coffer(256);
    // Panels about two and a half metres across, which is the grain of the
    // ceiling in image8. At a sixth of that they read as blobs, not coffers.
    t.repeat.set(11, 5);
    return t;
  }, []);
  const shell = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cofferMap,
        emissiveMap: cofferMap,
        emissive: new THREE.Color('#ffd9a4'),
        // The downlights in the map are what glow; the panels around them are
        // nearly black and stay that way. Strong enough to carry the room on
        // their own, because nothing else up there is lit.
        emissiveIntensity: 0.9,
        roughness: 0.82,
        metalness: 0.05,
      }),
    [cofferMap],
  );
  useEffect(
    () => () => {
      cofferMap.dispose();
      shell.dispose();
    },
    [cofferMap, shell],
  );

  /** The well the statue stands in: its floor, its wall, and the steps down. */
  const well = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const base = HALL.floorY - STATUE.wellDepth;

    const floor = ring(0, STATUE.wellRadius, 48, base);
    floor.translate(0, 0, STATUE.z);
    parts.push(floor);

    const wall = new THREE.CylinderGeometry(
      STATUE.wellRadius,
      STATUE.wellRadius,
      STATUE.wellDepth,
      48,
      1,
      true,
    );
    wall.translate(0, base + STATUE.wellDepth / 2, STATUE.z);
    parts.push(wall);

    // Three steps down on the entrance side, cut as arcs of the well's rim.
    const rise = STATUE.wellDepth / 3;
    for (let i = 0; i < 3; i++) {
      const r = STATUE.wellRadius - (i + 1) * 0.75;
      const tread = new THREE.CylinderGeometry(r, r, rise, 36, 1, false, -0.7, 1.4);
      tread.translate(0, base + rise * (i + 0.5), STATUE.z);
      parts.push(tread);
    }

    return mergeRaw(parts);
  }, []);

  /** The glass balustrade around the rim, and its steel handrail. */
  const balustrade = useMemo(() => {
    const glass = new THREE.CylinderGeometry(
      STATUE.wellRadius + 0.12,
      STATUE.wellRadius + 0.12,
      1.05,
      56,
      1,
      true,
      0.72,
      Math.PI * 2 - 1.44,
    );
    glass.translate(0, HALL.floorY + 0.525, STATUE.z);
    return glass;
  }, []);

  const handrail = useMemo(() => {
    const rail = new THREE.TorusGeometry(
      STATUE.wellRadius + 0.12,
      0.035,
      8,
      64,
      Math.PI * 2 - 1.44,
    );
    rail.rotateX(Math.PI / 2);
    rail.rotateY(-0.72);
    rail.translate(0, HALL.floorY + 1.07, STATUE.z);
    return rail;
  }, []);

  return (
    <group>
      <mesh geometry={ceiling} material={shell} />
      <mesh geometry={well} material={m.granite} />
      <mesh geometry={balustrade} material={m.glazing} />
      <mesh geometry={handrail} material={m.steel} />

      {/*
        The cyan wash. Two lights from inside the well throwing colour up the
        statue's front and back — the whole look of image8, and the one piece of
        colour in an otherwise black room. They are strong: the room around them
        is near black, and a wash that does not carry the full height of a
        five metre bronze reads as a shadow rather than as lighting.
      */}
      <pointLight
        position={[0, HALL.floorY - STATUE.wellDepth + 0.7, STATUE.z + 3.0]}
        intensity={240}
        distance={22}
        decay={2}
        color="#5fe0d8"
      />
      <pointLight
        position={[0, HALL.floorY - STATUE.wellDepth + 0.7, STATUE.z - 3.2]}
        intensity={150}
        distance={22}
        decay={2}
        color="#3fa8c4"
      />
      {/* A warm key down the dome, so the bronze is modelled and not only tinted. */}
      <spotLight
        position={[0, MEMORIAL.drumHeight, MEMORIAL.rotundaZ + 4]}
        angle={0.55}
        penumbra={0.9}
        intensity={620}
        distance={34}
        decay={2}
        color="#ffdcae"
      />
    </group>
  );
}

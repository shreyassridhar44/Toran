'use client';

/**
 * The hall floor. On the high tier it is a blurred reflector, which is what
 * makes a dark stone floor read as polished; that renders the scene a second
 * time, so the low tier falls back to a plain material and relies on the
 * roughness map for its sheen.
 *
 * Cut with a hole where the statue's well drops away. A plain rectangle simply
 * covered the well over, and the statue stood in a pit nobody could see.
 */

import { MeshReflectorMaterial } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { HALL, STATUE } from '../layout';
import { hallMaterials } from '../materials';
import { useTier } from '../quality';

/** One texture repeat every eight metres, which is four two-metre slabs. */
const METRES_PER_REPEAT = 8;

export function Floor() {
  const tier = useTier();
  const m = hallMaterials();

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = HALL.halfWidth;
    shape.moveTo(-w, HALL.back);
    shape.lineTo(w, HALL.back);
    shape.lineTo(w, HALL.front);
    shape.lineTo(-w, HALL.front);
    shape.closePath();

    // The well, as a hole. Wound the opposite way round from the outline, which
    // is what three.js triangulation needs to read it as a hole rather than as
    // a second island.
    const hole = new THREE.Path();
    hole.absarc(0, STATUE.z, STATUE.wellRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const g = new THREE.ShapeGeometry(shape, 48);
    // ShapeGeometry lays UVs out in the shape's own units, which here are
    // metres, so the map would repeat once across the whole hall. Bring it back
    // to one repeat per slab group.
    const uv = g.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) / METRES_PER_REPEAT, uv.getY(i) / METRES_PER_REPEAT);
    }
    uv.needsUpdate = true;
    // Built in the XY plane; lay it down.
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  return (
    <mesh geometry={geometry}>
      {tier === 'high' ? (
        <MeshReflectorMaterial
          map={m.floor.map}
          roughnessMap={m.floor.roughnessMap}
          roughness={0.45}
          metalness={0.1}
          color="#36322d"
          envMapIntensity={0.12}
          resolution={512}
          mirror={0.75}
          mixBlur={0.8}
          mixStrength={5}
          mixContrast={1.15}
          blur={[320, 90]}
          depthScale={0.9}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
        />
      ) : (
        <primitive object={m.floor} attach="material" />
      )}
    </mesh>
  );
}

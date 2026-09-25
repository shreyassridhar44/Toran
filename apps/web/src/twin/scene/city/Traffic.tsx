'use client';

/**
 * Traffic on Alipur Road: cars, autorickshaws and a bus, running both ways.
 *
 * Movement is what sells a city. A road with vehicles parked on it is a car
 * park; the same road with them moving is Delhi. This is the only thing on the
 * whole campus that animates, and it costs one matrix update per vehicle per
 * frame across three instanced meshes.
 *
 * Each vehicle keeps a distance along the road and wraps when it runs off the
 * end, so the road is endless without any of it ever being rebuilt. Speeds are
 * seeded and differ slightly, so the traffic does not move as a block.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROAD, zoneAt } from '../../campus';
import { campusMaterials } from '../../materials';
import { mulberry32 } from '../../random';
import { mergeRaw } from '../world';

type Kind = 'car' | 'auto' | 'bus';

interface Vehicle {
  kind: Kind;
  /** Distance along the road, wrapped into [-extent, extent]. */
  at: number;
  lane: number;
  /** Metres per second, signed by the direction of the lane. */
  speed: number;
}

/** A saloon car: body, cabin, and four wheels. */
function car(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(4.1, 0.78, 1.72);
  body.translate(0, 0.62, 0);
  parts.push(body);
  const cabin = new THREE.BoxGeometry(2.1, 0.62, 1.56);
  cabin.translate(-0.15, 1.3, 0);
  parts.push(cabin);
  for (const dx of [-1.32, 1.32]) {
    for (const dz of [-0.82, 0.82]) {
      const w = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 8);
      w.rotateX(Math.PI / 2);
      w.translate(dx, 0.32, dz);
      parts.push(w);
    }
  }
  return mergeRaw(parts);
}

/** An autorickshaw: the three-wheeler that is most of the traffic here. */
function auto(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const cab = new THREE.BoxGeometry(2.4, 1.15, 1.35);
  cab.translate(0, 0.85, 0);
  parts.push(cab);
  // The canopy, rounded over the passenger bench.
  const hood = new THREE.CylinderGeometry(0.68, 0.68, 1.3, 10, 1, false, 0, Math.PI);
  hood.rotateZ(Math.PI / 2);
  hood.rotateY(Math.PI / 2);
  hood.translate(-0.35, 1.42, 0);
  parts.push(hood);
  const front = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
  front.rotateX(Math.PI / 2);
  front.translate(1.1, 0.3, 0);
  parts.push(front);
  for (const dz of [-0.62, 0.62]) {
    const w = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    w.rotateX(Math.PI / 2);
    w.translate(-0.85, 0.3, dz);
    parts.push(w);
  }
  return mergeRaw(parts);
}

/** A city bus. One of these on the road does more for scale than ten cars. */
function bus(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(10.5, 2.7, 2.5);
  body.translate(0, 1.75, 0);
  parts.push(body);
  const roof = new THREE.BoxGeometry(10.1, 0.18, 2.3);
  roof.translate(0, 3.14, 0);
  parts.push(roof);
  for (const dx of [-3.6, 3.4]) {
    for (const dz of [-1.12, 1.12]) {
      const w = new THREE.CylinderGeometry(0.46, 0.46, 0.3, 8);
      w.rotateX(Math.PI / 2);
      w.translate(dx, 0.46, dz);
      parts.push(w);
    }
  }
  return mergeRaw(parts);
}

function Fleet({
  kind,
  geometry,
  material,
  vehicles,
}: {
  kind: Kind;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  vehicles: readonly Vehicle[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const last = useRef(performance.now());
  const mine = useMemo(() => vehicles.filter((v) => v.kind === kind), [vehicles, kind]);
  const state = useMemo(() => mine.map((v) => ({ ...v })), [mine]);

  const scratch = useMemo(
    () => ({
      mtx: new THREE.Matrix4(),
      pos: new THREE.Vector3(),
      one: new THREE.Vector3(1, 1, 1),
      // The two headings a vehicle can have. Built once: allocating a quaternion
      // and an axis per vehicle per frame is sixty allocations a frame for
      // something that only ever takes one of two values.
      facing: [
        new THREE.Quaternion(),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
      ],
    }),
    [],
  );

  useFrame(({ camera }) => {
    const mesh = ref.current;
    if (mesh === null) return;
    // Visibility stops the group being drawn, but it does not stop this hook
    // running. Without the zone check the traffic keeps composing matrices and
    // re-uploading three instance buffers every frame while the visitor stands
    // inside the hall looking at a manuscript.
    if (zoneAt(camera.position.z) !== 'campus') return;

    // A long first frame, or a tab returning from the background, must not
    // teleport the whole fleet down the road. Measured here rather than taken
    // from the frame delta for the same reason.
    const now = performance.now();
    const step = Math.min((now - last.current) / 1000, 0.1);
    last.current = now;

    const { mtx, pos, one, facing } = scratch;
    for (let i = 0; i < state.length; i++) {
      const v = state[i]!;
      v.at += v.speed * step;
      if (v.at > ROAD.extent) v.at -= ROAD.extent * 2;
      if (v.at < -ROAD.extent) v.at += ROAD.extent * 2;
      pos.set(v.at, 0, ROAD.centreZ + v.lane);
      mtx.compose(pos, v.speed > 0 ? facing[0]! : facing[1]!, one);
      mesh.setMatrixAt(i, mtx);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (state.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, state.length]}
      frustumCulled={false}
      raycast={() => {}}
    />
  );
}

export function Traffic() {
  const m = campusMaterials();

  const vehicles = useMemo<Vehicle[]>(() => {
    const rand = mulberry32(1956);
    const out: Vehicle[] = [];
    // Both lanes, running opposite ways. Lane offsets are signed, so the sign
    // of the offset also gives the direction of travel.
    for (const lane of ROAD.laneOffsets) {
      const direction = lane > 0 ? 1 : -1;
      let at = -ROAD.extent + rand() * 30;
      while (at < ROAD.extent) {
        const roll = rand();
        const kind: Kind = roll < 0.48 ? 'car' : roll < 0.86 ? 'auto' : 'bus';
        // Autos are slower than cars, buses slower still.
        const base = kind === 'car' ? 13 : kind === 'auto' ? 9 : 8;
        out.push({
          kind,
          at,
          lane: lane + (rand() - 0.5) * 0.8,
          speed: direction * (base + rand() * 4),
        });
        // A gap that varies, so the traffic is not a conveyor belt.
        at += 16 + rand() * 46;
      }
    }
    return out;
  }, []);

  const geometry = useMemo(() => ({ car: car(), auto: auto(), bus: bus() }), []);

  return (
    <group>
      <Fleet
        kind="car"
        geometry={geometry.car}
        material={m.paintwork}
        vehicles={vehicles}
      />
      <Fleet
        kind="auto"
        geometry={geometry.auto}
        material={m.autoGreen}
        vehicles={vehicles}
      />
      <Fleet kind="bus" geometry={geometry.bus} material={m.busRed} vehicles={vehicles} />
    </group>
  );
}

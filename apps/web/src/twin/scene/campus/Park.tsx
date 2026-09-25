'use client';

/**
 * The grounds: lawn, trees, lamp standards, the two fountains, the water
 * channel, and the clipped hedges along the approach.
 *
 * Everything repeated is instanced. Sixty-odd trees drawn one mesh each would
 * cost more draw calls than the memorial, the plaza and the compound put
 * together; as two instanced meshes they cost two. The same goes for the lamps
 * and the hedges.
 *
 * Placement is seeded, so the park is identical on every load and a screenshot
 * taken today can be compared with one taken tomorrow.
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CHANNEL, COMPOUND, FOUNTAINS, MEMORIAL, PLANTING, PLAZA } from '../../campus';
import { box, mergeParts, type Part } from '../../geometry';
import { campusMaterials } from '../../materials';
import { mulberry32 } from '../../random';
import { arcBand, lamp, mergeRaw, tree } from '../world';

interface Placed {
  x: number;
  z: number;
  scale: number;
  turn: number;
}

/** Instanced copies of one geometry at many placements. */
function Scatter({
  geometry,
  material,
  at,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  at: readonly Placed[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (mesh === null) return;
    const mtx = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    at.forEach((p, i) => {
      q.setFromEuler(new THREE.Euler(0, p.turn, 0));
      mtx.compose(v.set(p.x, 0, p.z), q, new THREE.Vector3(p.scale, p.scale, p.scale));
      mesh.setMatrixAt(i, mtx);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    // Scenery, and a great deal of it. Nothing out here is ever clicked, and
    // raycasting sixty trees on every pointer move is pure waste.
    mesh.raycast = () => {};
  }, [at]);
  return <instancedMesh ref={ref} args={[geometry, material, at.length]} frustumCulled />;
}

export function Park() {
  const m = campusMaterials();

  /** Where the trees stand: inside the wall on all four sides. */
  const trees = useMemo(() => {
    const rand = mulberry32(1891);
    const out: Placed[] = [];
    const inset = PLANTING.perimeterInset;
    const x0 = COMPOUND.halfWidth - inset;
    const z0 = COMPOUND.frontZ - inset;
    const z1 = COMPOUND.backZ + inset;

    const jitter = () => (rand() - 0.5) * 3.2;
    const place = (x: number, z: number) => {
      out.push({
        x: x + jitter(),
        z: z + jitter(),
        scale: 0.78 + rand() * 0.55,
        turn: rand() * Math.PI * 2,
      });
    };

    for (let z = z1; z <= z0; z += PLANTING.spacing) {
      place(-x0, z);
      place(x0, z);
    }
    for (let x = -x0; x <= x0; x += PLANTING.spacing) {
      place(x, z0);
      place(x, z1);
    }
    // A second, looser rank behind the front row, so the boundary reads as
    // planting rather than as a line of lollipops.
    for (let x = -x0 + 8; x <= x0 - 8; x += PLANTING.spacing * 1.7) {
      place(x, z0 - 9);
    }
    return out;
  }, []);

  /** Lamp standards: around the plaza, and along the approach to the gate. */
  const lamps = useMemo(() => {
    const out: Placed[] = [];
    const r = PLAZA.outerRadius + 2.4;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      out.push({
        x: PLAZA.centreX + Math.sin(a) * r,
        z: PLAZA.centreZ + Math.cos(a) * r,
        scale: 1,
        turn: 0,
      });
    }
    for (
      let z = PLAZA.centreZ + PLAZA.outerRadius + PLANTING.lampSpacing;
      z < COMPOUND.frontZ - 6;
      z += PLANTING.lampSpacing
    ) {
      out.push({ x: -PLAZA.approachHalfWidth - 2, z, scale: 1, turn: 0 });
      out.push({ x: PLAZA.approachHalfWidth + 2, z, scale: 1, turn: 0 });
    }
    return out;
  }, []);

  /** Clipped shrubs in pots, lining the approach and the forecourt railing. */
  const shrubs = useMemo(() => {
    const out: Placed[] = [];
    const innerZ = PLAZA.centreZ - PLAZA.outerRadius;
    for (let z = MEMORIAL.stepsFrontZ + 2; z < innerZ; z += 3.4) {
      for (const side of [-1, 1]) {
        out.push({
          x: side * (PLAZA.approachHalfWidth + 1.2),
          z,
          scale: 0.9,
          turn: 0,
        });
      }
    }
    return out;
  }, []);

  const treeGeo = useMemo(() => tree(8.5, 3.6), []);
  const lampGeo = useMemo(() => lamp(PLANTING.lampHeight), []);

  const shrubGeo = useMemo(() => {
    // A conical shrub in a terracotta pot, as along the memorial's forecourt.
    const pot = new THREE.CylinderGeometry(0.34, 0.26, 0.5, 10);
    pot.translate(0, 0.25, 0);
    const cone = new THREE.ConeGeometry(0.42, 1.5, 9);
    cone.translate(0, 1.25, 0);
    return { pot, cone };
  }, []);

  /** The lawn, the fountain basins and the water channel's kerb. */
  const ground = useMemo(() => {
    // One large lawn under the whole compound. The plaza, the approach and the
    // building's plinth are drawn on top of it.
    const g = box(COMPOUND.halfWidth * 2, 0.04, COMPOUND.frontZ - COMPOUND.backZ);
    g.translate(0, -0.03, (COMPOUND.frontZ + COMPOUND.backZ) / 2);
    return g;
  }, []);

  const basins = useMemo(() => {
    const parts: Part[] = [];
    for (const f of FOUNTAINS) {
      // Kerb, and the step the basin sits in.
      parts.push({
        geometry: new THREE.CylinderGeometry(f.radius, f.radius, 0.55, 32, 1, true),
        position: [f.x, 0.275, f.z],
      });
      parts.push({
        geometry: new THREE.CylinderGeometry(f.radius + 0.3, f.radius + 0.3, 0.2, 32),
        position: [f.x, 0.1, f.z],
      });
      // The jet's pedestal at the centre.
      parts.push({
        geometry: new THREE.CylinderGeometry(0.5, 0.7, 0.9, 12),
        position: [f.x, 0.45, f.z],
      });
    }
    // The channel's kerb, an arc around the east of the site.
    for (const offset of [-CHANNEL.width / 2, CHANNEL.width / 2]) {
      parts.push({
        geometry: arcBand({
          ax: CHANNEL.radius + offset,
          az: CHANNEL.radius + offset,
          startAngle: CHANNEL.startAngle,
          endAngle: CHANNEL.endAngle,
          segments: 44,
          width: 0.5,
          height: 0.45,
          y: 0.16,
          centreZ: CHANNEL.centreZ,
        }),
      });
    }
    return mergeParts(parts, 2.2);
  }, []);

  /** Standing water: the fountain basins and the channel. */
  const water = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const f of FOUNTAINS) {
      const disc = new THREE.CircleGeometry(f.radius - 0.05, 32);
      disc.rotateX(-Math.PI / 2);
      disc.translate(f.x, 0.4, f.z);
      parts.push(disc);
    }
    parts.push(
      arcBand({
        ax: CHANNEL.radius,
        az: CHANNEL.radius,
        startAngle: CHANNEL.startAngle,
        endAngle: CHANNEL.endAngle,
        segments: 44,
        width: CHANNEL.width - 0.4,
        height: 0.06,
        y: 0.24,
        centreZ: CHANNEL.centreZ,
      }),
    );
    return mergeRaw(parts);
  }, []);

  /**
   * The plume of each jet, as crossed additive sheets.
   *
   * The same trick the hall's light shafts use. Real spray is particles and a
   * depth-sorted transparent pass, and neither is worth it for two fountains
   * the camera passes in a second and a half.
   */
  const spray = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const f of FOUNTAINS) {
      for (const turn of [0, Math.PI / 2]) {
        const sheet = new THREE.PlaneGeometry(2.6, 4.2);
        sheet.rotateY(turn);
        sheet.translate(f.x, 3.0, f.z);
        parts.push(sheet);
      }
    }
    return mergeRaw(parts);
  }, []);

  return (
    <group>
      <mesh geometry={ground} material={m.lawn} />
      <mesh geometry={basins} material={m.ashlar} />
      <mesh geometry={water} material={m.water} />
      <mesh geometry={spray} material={m.spray} renderOrder={2} />

      <Scatter geometry={treeGeo.trunk} material={m.bark} at={trees} />
      <Scatter geometry={treeGeo.canopy} material={m.foliage} at={trees} />
      <Scatter geometry={lampGeo.post} material={m.granite} at={lamps} />
      <Scatter geometry={lampGeo.lantern} material={m.lampGlow} at={lamps} />
      <Scatter geometry={shrubGeo.pot} material={m.ashlar} at={shrubs} />
      <Scatter geometry={shrubGeo.cone} material={m.foliage} at={shrubs} />
    </group>
  );
}

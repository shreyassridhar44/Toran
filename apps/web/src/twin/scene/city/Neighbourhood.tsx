'use client';

/**
 * The blocks around the memorial, and the market row across the road.
 *
 * From image11, over the mudra wall: white-rendered flats of three to five
 * storeys with parapets, balconies and water tanks on the roof. They stand on
 * all four sides, because the memorial is enclosed on all four sides and a
 * campus that ends in empty haze the moment the camera turns is worse than no
 * neighbourhood at all.
 *
 * Merged rather than instanced, which is the opposite of the park's trees and
 * for a reason: the facade texture tiles one repeat per storey, so its UVs
 * depend on how big each block is. Instancing shares one geometry and would
 * stretch the same windows over every height, giving each building its own
 * window scale — the single thing that makes a row read as wallpaper. Merged,
 * forty blocks with correct windows cost three draw calls, one per tint.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { CITY, COMPOUND, ROAD } from '../../campus';
import { boxProjectUVs, mergeParts, type Part } from '../../geometry';
import { campusMaterials } from '../../materials';
import { mulberry32 } from '../../random';
import { mergeRaw } from '../world';

interface Block {
  x: number;
  z: number;
  width: number;
  depth: number;
  storeys: number;
  turn: number;
  /** Which of the three render tints this block is painted in. */
  tone: 0 | 1 | 2;
}

export function Neighbourhood() {
  const m = campusMaterials();

  const blocks = useMemo<Block[]>(() => {
    const rand = mulberry32(1990);
    const out: Block[] = [];

    const push = (x: number, z: number, along: 'x' | 'z', depth: number) => {
      const width = 11 + rand() * 9;
      out.push({
        x,
        z,
        width,
        depth,
        storeys:
          CITY.minStoreys + Math.floor(rand() * (CITY.maxStoreys - CITY.minStoreys + 1)),
        turn: along === 'x' ? 0 : Math.PI / 2,
        tone: Math.floor(rand() * 3) as 0 | 1 | 2,
      });
      return width;
    };

    // The row across the road, which is the one the arrival looks straight at.
    for (let x = -CITY.blockExtent; x < CITY.blockExtent;) {
      const w = push(x, CITY.blockRowZ + rand() * 6, 'x', CITY.blockDepth);
      x += w + 3 + rand() * 7;
    }
    // A second, deeper rank behind it, so the city has thickness.
    for (let x = -CITY.blockExtent; x < CITY.blockExtent;) {
      const w = push(x + 10, CITY.blockRowZ + 30 + rand() * 12, 'x', CITY.blockDepth);
      x += w + 10 + rand() * 20;
    }
    // Either side of the compound.
    for (const side of [-1, 1]) {
      const x = side * (COMPOUND.halfWidth + CITY.sideOffset);
      for (let z = COMPOUND.backZ - 20; z < COMPOUND.frontZ + 10;) {
        const w = push(x + side * rand() * 8, z, 'z', CITY.blockDepth);
        z += w + 4 + rand() * 10;
      }
    }
    // And behind it.
    for (let x = -CITY.blockExtent * 0.7; x < CITY.blockExtent * 0.7;) {
      const w = push(
        x,
        COMPOUND.backZ - CITY.backOffset - rand() * 14,
        'x',
        CITY.blockDepth,
      );
      x += w + 5 + rand() * 12;
    }
    return out;
  }, []);

  /**
   * Walls, with UVs projected so one repeat is one storey on every block, and
   * split into three by tint. Three draw calls rather than one, which buys a
   * street that is not all the same colour.
   */
  const walls = useMemo(() => {
    const groups: THREE.BufferGeometry[][] = [[], [], []];
    for (const b of blocks) {
      const height = b.storeys * CITY.storeyHeight;
      const g = new THREE.BoxGeometry(b.width, height, b.depth);
      // Projected before the block is placed, so the tiling follows the box's
      // own size rather than its position on the site.
      boxProjectUVs(g, CITY.storeyHeight);
      g.rotateY(b.turn);
      g.translate(b.x, height / 2, b.z);
      groups[b.tone]!.push(g);
    }
    return groups.map((g) => mergeRaw(g));
  }, [blocks]);

  /** Parapets, roof slabs, water tanks and stair huts. */
  const roofs = useMemo(() => {
    const parts: Part[] = [];
    const rand = mulberry32(2024);
    for (const b of blocks) {
      const height = b.storeys * CITY.storeyHeight;
      const w = b.turn === 0 ? b.width : b.depth;
      const d = b.turn === 0 ? b.depth : b.width;

      parts.push({
        geometry: new THREE.BoxGeometry(w + 0.4, 0.75, d + 0.4),
        position: [b.x, height + 0.2, b.z],
      });
      // The stair hut, always in a corner.
      parts.push({
        geometry: new THREE.BoxGeometry(2.6, 2.4, 2.4),
        position: [
          b.x + (rand() - 0.5) * (w - 4),
          height + 1.6,
          b.z + (rand() - 0.5) * (d - 3),
        ],
      });
      // Water tanks. Every roof in Delhi has one, usually two.
      const tanks = 1 + Math.floor(rand() * 2);
      for (let i = 0; i < tanks; i++) {
        const tank = new THREE.CylinderGeometry(0.62, 0.72, 1.1, 10);
        parts.push({
          geometry: tank,
          position: [
            b.x + (rand() - 0.5) * (w - 2),
            height + 1.15,
            b.z + (rand() - 0.5) * (d - 2),
          ],
        });
      }
    }
    return mergeParts(parts, 4);
  }, [blocks]);

  /**
   * The market row: shopfronts under awnings on the far footpath, with
   * hoardings above them.
   */
  const market = useMemo(() => {
    const rand = mulberry32(1947);
    const shops: Part[] = [];
    const awnings: Part[] = [];
    const z = CITY.marketZ;

    const fronts: Part[] = [];
    const face = z - CITY.marketDepth / 2;

    for (let x = -120; x < 120;) {
      const w = 5 + rand() * 4;
      const cx = x + w / 2;
      const h = 3.4 + rand() * 0.8;

      shops.push({
        geometry: new THREE.BoxGeometry(w, h, CITY.marketDepth),
        position: [cx, h / 2, z],
      });
      // The shopfront itself: a dark glazed opening under a sign band. Without
      // one the row is a line of blank boxes, which is the one thing a market
      // is not.
      fronts.push({
        geometry: new THREE.BoxGeometry(w * 0.86, h * 0.58, 0.12),
        position: [cx, h * 0.34, face - 0.07],
      });
      shops.push({
        geometry: new THREE.BoxGeometry(w * 0.9, 0.5, 0.2),
        position: [cx, h * 0.74, face - 0.1],
      });
      // A hoarding over the parapet, which every shop row here carries.
      shops.push({
        geometry: new THREE.BoxGeometry(w * 0.86, 1.0, 0.16),
        position: [cx, h + 0.5, face - 0.05],
      });
      // The awning, sloping out over the footpath.
      awnings.push({
        geometry: new THREE.BoxGeometry(w * 0.96, 0.1, 2.4),
        position: [cx, h * 0.66, face - 1.1],
        rotation: [0.19, 0, 0],
      });
      x += w + 0.4 + rand() * 1.8;
    }
    return {
      shops: mergeParts(shops, 3),
      fronts: mergeParts(fronts, 3),
      awnings: mergeParts(awnings, 3),
    };
  }, []);

  /**
   * The skyline: a low ridge of silhouettes far enough back that the haze does
   * most of the work. It exists to stop the horizon being a clean line between
   * ground and sky, which is the tell of an empty scene.
   */
  const skyline = useMemo(() => {
    const rand = mulberry32(1891);
    const parts: Part[] = [];
    for (const [z, spread] of [
      [CITY.skylineZ, 1],
      [-CITY.skylineZ, 1],
    ] as const) {
      for (let x = -420; x < 420;) {
        const w = 18 + rand() * 40;
        const h = 9 + rand() * 26;
        parts.push({
          geometry: new THREE.BoxGeometry(w, h, 22),
          position: [x + w / 2, h / 2, z * spread + (rand() - 0.5) * 60],
        });
        x += w + rand() * 26;
      }
    }
    for (const side of [-1, 1]) {
      for (let z = -380; z < 380;) {
        const w = 18 + rand() * 40;
        const h = 9 + rand() * 26;
        parts.push({
          geometry: new THREE.BoxGeometry(22, h, w),
          position: [side * CITY.skylineZ + (rand() - 0.5) * 60, h / 2, z + w / 2],
        });
        z += w + rand() * 26;
      }
    }
    return mergeParts(parts, 8);
  }, []);

  return (
    <group>
      <mesh geometry={walls[0]!} material={m.facade} />
      <mesh geometry={walls[1]!} material={m.facadeWarm} />
      <mesh geometry={walls[2]!} material={m.facadeCool} />
      <mesh geometry={roofs} material={m.concrete} />
      <mesh geometry={market.shops} material={m.facadeWarm} />
      <mesh geometry={market.fronts} material={m.shopfront} />
      <mesh geometry={market.awnings} material={m.awning} />
      <mesh geometry={skyline} material={m.distant} />

      {/* The footpath the market stands on, on the far side of the road. */}
      <mesh
        position={[0, 0.07, ROAD.centreZ + ROAD.halfWidth + ROAD.footpathHalfWidth]}
        material={m.concrete}
      >
        <boxGeometry args={[ROAD.extent * 2, 0.14, ROAD.footpathHalfWidth * 2]} />
      </mesh>
    </group>
  );
}

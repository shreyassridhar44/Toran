'use client';

/**
 * The four exhibit sections down the sides of the nave, and the stanchions that
 * fence them off.
 *
 * From the photographs: a backlit wall of archive photographs with the timeline
 * panels set into it (image5), the recreated study behind its rope (image7,
 * image12, image16), the banyan tableau with its painted backdrop and built-out
 * foreground (image6, image13), and lit cases of manuscripts.
 *
 * Everything sits **along the walls**. The centre aisle stays clear from the
 * atrium to the Preamble, which is the rule the interior was composed around
 * before this pass and still is: a visitor standing under the dome can see the
 * Constitution at the far end, and every kiosk stands beside that line rather
 * than on it.
 *
 * All four sections merge by material into a handful of draw calls. The section
 * that costs the most is the study, because a desk with a typewriter, a fan and
 * a telephone on it is thirty small objects — and they are thirty objects a
 * visitor recognises, which is the whole reason the room reads as somebody's.
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { HALL, SECTIONS } from '../../layout';
import { box, mergeParts, type Part } from '../../geometry';
import { campusMaterials, hallMaterials } from '../../materials';
import { forest, mural } from '../../textures';
import { figure } from '../world';

const WALL_X = HALL.halfWidth - 0.25;

/**
 * Stanchions and a belt along a run, a metre out from whatever they protect.
 *
 * Every tableau in the building is roped off and photographed from behind the
 * rope, so the rope is part of how the room looks, not an afterthought.
 */
function rope(side: -1 | 1, fromZ: number, toZ: number, inset: number) {
  const posts: Part[] = [];
  const belts: Part[] = [];
  const x = side * (WALL_X - inset);
  const span = fromZ - toZ;
  const count = Math.max(2, Math.round(span / 2.6));

  for (let i = 0; i <= count; i++) {
    const z = fromZ - (span * i) / count;
    posts.push({
      geometry: new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8),
      position: [x, 0.475, z],
    });
    posts.push({
      geometry: new THREE.CylinderGeometry(0.15, 0.17, 0.05, 12),
      position: [x, 0.025, z],
    });
    if (i < count) {
      const seg = span / count;
      belts.push({
        geometry: box(0.02, 0.05, seg),
        position: [x, 0.9, z - seg / 2],
      });
    }
  }
  return { posts, belts };
}

/** The photograph wall: lit panels the height of the room, down one side. */
function MuralWall() {
  const s = SECTIONS.mural;
  const map = useMemo(() => {
    const t = mural(512);
    // Three panels per repeat, one repeat every nine metres.
    t.repeat.set((s.fromZ - s.toZ) / 9, 1);
    return t;
  }, [s]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map,
        emissiveMap: map,
        emissive: new THREE.Color('#ffffff'),
        // Backlit, which is why it is the brightest thing in a dark room and
        // why the floor in image5 mirrors it.
        emissiveIntensity: 0.62,
        roughness: 0.92,
      }),
    [map],
  );
  useEffect(
    () => () => {
      map.dispose();
      material.dispose();
    },
    [map, material],
  );

  const length = s.fromZ - s.toZ;
  const centreZ = (s.fromZ + s.toZ) / 2;

  return (
    <mesh
      position={[s.x * (WALL_X - 0.02), 3.1, centreZ]}
      // Negated: a plane's normal is +z, and rotating by +90 degrees about Y
      // for a section on the left wall turns it to face the wall behind it.
      // Both this and the banyan backdrop were mounted facing outward, and
      // neither appeared in the room at all.
      rotation={[0, -s.x * (Math.PI / 2), 0]}
      material={material}
    >
      <planeGeometry args={[length, 5.4]} />
    </mesh>
  );
}

/**
 * The study: the desk, the man at it, and everything on and around it.
 *
 * The objects are the point. A desk on its own is furniture; a desk with a
 * typewriter, a pedestal fan, a rotary telephone and a pile of books on it is
 * the room in image7, and a visitor knows whose it is without being told.
 */
function Study() {
  const m = hallMaterials();
  const c = campusMaterials();
  const s = SECTIONS.study;
  const x = s.x * (WALL_X - 3.2);
  const z = (s.fromZ + s.toZ) / 2;

  const { wood, dark, metal, paper } = useMemo(() => {
    const wood: Part[] = [];
    const dark: Part[] = [];
    const metal: Part[] = [];
    const paper: Part[] = [];

    // The desk: top, apron, and four turned legs.
    wood.push({ geometry: box(2.6, 0.09, 1.3), position: [x, 0.78, z] });
    wood.push({ geometry: box(2.4, 0.22, 1.1), position: [x, 0.66, z] });
    for (const dx of [-1.15, 1.15]) {
      for (const dz of [-0.52, 0.52]) {
        wood.push({
          geometry: new THREE.CylinderGeometry(0.06, 0.07, 0.74, 8),
          position: [x + dx, 0.37, z + dz],
        });
      }
    }
    // Its leather writing surface, inset from the edge.
    dark.push({ geometry: box(2.2, 0.012, 1.0), position: [x, 0.83, z] });

    // The chair behind it, and two caned chairs in front.
    wood.push({ geometry: box(0.6, 0.08, 0.6), position: [x, 0.48, z - 1.0] });
    dark.push({ geometry: box(0.62, 0.9, 0.1), position: [x, 0.95, z - 1.28] });
    for (const dx of [-0.95, 0.95]) {
      wood.push({ geometry: box(0.5, 0.06, 0.5), position: [x + dx, 0.46, z + 1.1] });
      wood.push({ geometry: box(0.5, 0.7, 0.07), position: [x + dx, 0.84, z + 1.33] });
      for (const [lx, lz] of [
        [-0.2, -0.2],
        [0.2, -0.2],
        [-0.2, 0.2],
        [0.2, 0.2],
      ] as const) {
        wood.push({
          geometry: box(0.05, 0.46, 0.05),
          position: [x + dx + lx, 0.23, z + 1.1 + lz],
        });
      }
    }

    // On the desk. A typewriter: platen, body, and the bank of keys.
    dark.push({ geometry: box(0.42, 0.2, 0.36), position: [x + 0.72, 0.94, z + 0.1] });
    metal.push({
      geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.44, 10),
      position: [x + 0.72, 1.06, z - 0.02],
      rotation: [0, 0, Math.PI / 2],
    });
    dark.push({
      geometry: box(0.36, 0.05, 0.16),
      position: [x + 0.72, 0.87, z + 0.26],
      rotation: [-0.24, 0, 0],
    });
    paper.push({ geometry: box(0.3, 0.005, 0.42), position: [x + 0.72, 1.14, z - 0.06] });

    // The rotary telephone: base, handset, and the dial on its face.
    dark.push({ geometry: box(0.26, 0.11, 0.2), position: [x - 0.62, 0.9, z - 0.14] });
    dark.push({ geometry: box(0.3, 0.08, 0.09), position: [x - 0.62, 1.0, z - 0.14] });
    metal.push({
      geometry: new THREE.TorusGeometry(0.065, 0.012, 6, 16),
      position: [x - 0.62, 0.92, z - 0.02],
      rotation: [Math.PI / 2.4, 0, 0],
    });

    // Books and papers, in the drifts a working desk accumulates.
    for (let i = 0; i < 7; i++) {
      const h = 0.04 + (i % 3) * 0.018;
      dark.push({
        geometry: box(0.26, h, 0.34),
        position: [
          x - 1.02 + (i % 2) * 0.06,
          0.845 + i * 0.045,
          z + 0.3 - (i % 3) * 0.05,
        ],
        rotation: [0, (i % 4) * 0.08, 0],
      });
    }
    paper.push({
      geometry: box(0.34, 0.01, 0.46),
      position: [x + 0.06, 0.845, z + 0.16],
    });
    paper.push({
      geometry: box(0.3, 0.008, 0.42),
      position: [x - 0.18, 0.845, z + 0.02],
      rotation: [0, 0.16, 0],
    });

    // The pedestal fan: base, column, cage and blades.
    metal.push({
      geometry: new THREE.CylinderGeometry(0.2, 0.24, 0.06, 12),
      position: [x + 1.7, 0.03, z + 0.5],
    });
    metal.push({
      geometry: new THREE.CylinderGeometry(0.035, 0.045, 1.1, 8),
      position: [x + 1.7, 0.58, z + 0.5],
    });
    metal.push({
      geometry: new THREE.CylinderGeometry(0.3, 0.3, 0.1, 18, 1, true),
      position: [x + 1.7, 1.24, z + 0.5],
      rotation: [Math.PI / 2, 0, 0],
    });
    for (let i = 0; i < 4; i++) {
      metal.push({
        geometry: box(0.24, 0.02, 0.09),
        position: [x + 1.7, 1.24, z + 0.5],
        rotation: [0, 0, (i / 4) * Math.PI * 2],
      });
    }

    // The pendant lamp over the desk: flex and a conical shade.
    dark.push({ geometry: box(0.02, 1.5, 0.02), position: [x, 2.7, z] });
    dark.push({
      geometry: new THREE.ConeGeometry(0.34, 0.34, 14, 1, true),
      position: [x, 1.86, z],
    });

    // A hat stand, and a walking stick against it.
    wood.push({
      geometry: new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8),
      position: [x - 1.9, 0.85, z - 0.7],
    });
    wood.push({
      geometry: new THREE.CylinderGeometry(0.22, 0.22, 0.04, 10),
      position: [x - 1.9, 0.02, z - 0.7],
    });
    wood.push({
      geometry: new THREE.CylinderGeometry(0.018, 0.018, 0.95, 6),
      position: [x - 1.76, 0.48, z - 0.62],
      rotation: [0, 0, 0.12],
    });

    return {
      wood: mergeParts(wood, 2),
      dark: mergeParts(dark, 2),
      metal: mergeParts(metal, 2),
      paper: mergeParts(paper, 2),
    };
  }, [x, z]);

  // The seated figure at the desk, in a pale suit.
  const seated = useMemo(() => {
    const g = figure('seated');
    g.scale(1.06, 1.06, 1.06);
    g.rotateY(Math.PI);
    g.translate(x, 0.5, z - 0.92);
    return g;
  }, [x, z]);

  // The Buddha panel on the wall behind, gold on black, as in image12.
  const buddha = useMemo(() => {
    const parts: Part[] = [];
    parts.push({ geometry: box(1.5, 2.2, 0.08), position: [0, 0, 0] });
    // A head and shoulders in relief, which at this distance is all that reads.
    parts.push({
      geometry: (() => {
        const head = new THREE.SphereGeometry(0.34, 14, 12);
        head.scale(0.88, 1.12, 0.5);
        return head;
      })(),
      position: [0, 0.48, 0.08],
    });
    parts.push({
      geometry: (() => {
        const body = new THREE.CylinderGeometry(0.46, 0.62, 0.9, 14, 1, true);
        return body;
      })(),
      position: [0, -0.4, 0.05],
    });
    return mergeParts(parts, 2);
  }, []);

  const fence = useMemo(() => rope(1, s.fromZ, s.toZ, 4.9), [s]);

  return (
    <group>
      <mesh geometry={wood} material={c.bark} />
      <mesh geometry={dark} material={m.ceiling} />
      <mesh geometry={metal} material={c.steel} />
      <mesh geometry={paper} material={m.paper} />
      <mesh geometry={seated} material={m.paper} />
      <group
        position={[s.x * (WALL_X - 0.2), 2.4, z - 2.4]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <mesh geometry={buddha} material={c.gold} />
      </group>
      <mesh geometry={mergeParts(fence.posts, 2)} material={c.steel} />
      <mesh geometry={mergeParts(fence.belts, 2)} material={c.navy} />
      {/* A warm lamp over the desk, which is the light in every photograph of
          this room. */}
      <pointLight
        position={[x, 1.75, z]}
        intensity={150}
        distance={14}
        decay={2}
        color="#ffd9a0"
      />
    </group>
  );
}

/** The banyan tableau: painted backdrop, built-out foreground, seated figure. */
function Banyan() {
  const m = hallMaterials();
  const c = campusMaterials();
  const s = SECTIONS.banyan;
  const z = (s.fromZ + s.toZ) / 2;
  const length = s.fromZ - s.toZ;

  const backdrop = useMemo(() => forest(384), []);
  const painted = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: backdrop,
        emissiveMap: backdrop,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.3,
        roughness: 0.95,
      }),
    [backdrop],
  );
  useEffect(
    () => () => {
      backdrop.dispose();
      painted.dispose();
    },
    [backdrop, painted],
  );

  // The foreground: root buttresses, mossy ground and a timber fence, built out
  // in front of the painting so the tableau has depth.
  const { roots, ground, timber } = useMemo(() => {
    const roots: Part[] = [];
    const ground: Part[] = [];
    const timber: Part[] = [];
    const x = s.x * (WALL_X - 1.6);

    ground.push({
      geometry: box(3.2, 0.12, length - 1),
      position: [x, 0.06, z],
    });

    // Buttress roots spreading from the painted trunk onto the floor.
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      const rz = s.fromZ - 1 - (length - 2) * t;
      const lean = 0.5 + (i % 3) * 0.28;
      roots.push({
        geometry: new THREE.CylinderGeometry(0.1, 0.34, 1.5 + (i % 2) * 0.7, 8),
        position: [x + 0.7, 0.75, rz],
        rotation: [0, 0, -lean],
      });
    }
    // The trunk the roots run down from, flattened against the backdrop.
    roots.push({
      geometry: new THREE.CylinderGeometry(0.62, 0.92, 4.4, 12),
      position: [x + 0.2, 2.2, z + 0.4],
      scale: [1, 1, 0.55],
    });

    // A rustic fence along the front of the tableau.
    for (let i = 0; i <= 7; i++) {
      const rz = s.fromZ - 0.6 - ((length - 1.6) * i) / 7;
      timber.push({
        geometry: new THREE.CylinderGeometry(0.06, 0.07, 1.0, 6),
        position: [x + 1.5, 0.5, rz],
      });
    }
    timber.push({
      geometry: box(0.07, 0.07, length - 1.6),
      position: [x + 1.5, 0.82, z],
    });

    return {
      roots: mergeParts(roots, 2),
      ground: mergeParts(ground, 2),
      timber: mergeParts(timber, 2),
    };
  }, [s, z, length]);

  // The young Ambedkar, seated at the foot of the tree, head on his hand.
  const seated = useMemo(() => {
    const g = figure('seated');
    g.scale(1.02, 1.02, 1.02);
    g.rotateY(-Math.PI / 2 - 0.4);
    g.translate(s.x * (WALL_X - 2.1), 0.12, z - 1.2);
    return g;
  }, [s, z]);

  const fence = useMemo(() => rope(-1, s.fromZ, s.toZ, 3.4), [s]);

  return (
    <group>
      <mesh
        position={[s.x * (WALL_X - 0.05), 3.0, z]}
        rotation={[0, -s.x * (Math.PI / 2), 0]}
        material={painted}
      >
        <planeGeometry args={[length, 6]} />
      </mesh>
      <mesh geometry={ground} material={c.foliage} />
      <mesh geometry={roots} material={c.bark} />
      <mesh geometry={timber} material={c.bark} />
      <mesh geometry={seated} material={m.ceiling} />
      <mesh geometry={mergeParts(fence.posts, 2)} material={c.steel} />
      <mesh geometry={mergeParts(fence.belts, 2)} material={c.navy} />
      <spotLight
        position={[s.x * 4, 7.4, z]}
        angle={0.7}
        penumbra={0.9}
        intensity={420}
        distance={18}
        decay={2}
        color="#cfe0b0"
      />
    </group>
  );
}

/** Manuscript cases: lit vitrines with folios laid open in them. */
function Vitrines() {
  const m = hallMaterials();
  const c = campusMaterials();
  const s = SECTIONS.vitrines;
  const x = s.x * (WALL_X - 1.9);
  const length = s.fromZ - s.toZ;
  const cases = 4;

  // A case is lit from inside, so the folio is the light source. Emissive
  // rather than a lamp per case: two more lights would shade every fragment in
  // a twenty-eight metre room to illuminate four glass boxes.
  const lit = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f4efe6',
        emissive: new THREE.Color('#ffeccb'),
        emissiveIntensity: 0.85,
        roughness: 0.9,
      }),
    [],
  );
  useEffect(() => () => lit.dispose(), [lit]);

  const { frame, glass, folios } = useMemo(() => {
    const frame: Part[] = [];
    const glass: Part[] = [];
    const folios: Part[] = [];

    for (let i = 0; i < cases; i++) {
      const z = s.fromZ - 0.9 - ((length - 1.8) * i) / (cases - 1);
      // A plinth, a sloping top, and the glass over it.
      frame.push({ geometry: box(1.5, 0.95, 1.9), position: [x, 0.475, z] });
      frame.push({ geometry: box(1.6, 0.06, 2.0), position: [x, 0.98, z] });
      glass.push({
        geometry: box(1.44, 0.5, 1.84),
        position: [x, 1.26, z],
      });
      frame.push({ geometry: box(1.6, 0.05, 2.0), position: [x, 1.53, z] });
      // The folio inside, laid open and tilted toward the visitor.
      folios.push({
        geometry: box(1.0, 0.03, 1.2),
        position: [x, 1.08, z],
        rotation: [0.12, 0, 0],
      });
    }
    return {
      frame: mergeParts(frame, 2),
      glass: mergeParts(glass, 2),
      folios: mergeParts(folios, 2),
    };
  }, [s, x, length]);

  return (
    <group>
      <mesh geometry={frame} material={m.ceiling} />
      <mesh geometry={folios} material={lit} />
      <mesh geometry={glass} material={c.glazing} />
    </group>
  );
}

export function Galleries() {
  return (
    <group>
      <MuralWall />
      <Study />
      <Banyan />
      <Vitrines />
    </group>
  );
}

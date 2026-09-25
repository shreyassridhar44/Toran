'use client';

/**
 * The Dr. Ambedkar National Memorial: an open book, eighty metres across.
 *
 * The anatomy, from the ground up. A sandstone plinth in the shape of the
 * building's footprint. Two wings, each a steep wall of twelve curved louvre
 * fins — the cut edges of a thousand fanned pages — leaning outward as they
 * climb until they overhang the plinth by six metres. Above each wall, a broad
 * cream page face carrying the Preamble, which is what the building *is* seen
 * from the air. Between the two pages, a red sandstone spine, swelling at the
 * front into a drum with the entrance arch recessed into it, and steps up from
 * the plaza.
 *
 * Three things make it a book rather than a bowl, and all three were got wrong
 * before they were got right:
 *
 * - **The stack leans out as it rises.** Built narrowing, the memorial becomes
 *   a pair of splayed ramps with a pot between them.
 * - **The page is the dominant surface**, four fifths of the half width. A
 *   strip of paper on a broad bank of glass is a grandstand.
 * - **The plan is a superellipse, not an ellipse.** A true ellipse gave a
 *   circular dish that read as a bathtub; a book has long straightish edges.
 *
 * Costs six draw calls: sandstone, glass, metal edges, pages, steps, and the
 * sky. Every fin in both wings merges into a single geometry per material,
 * which is the only way twenty-four curved stacks fit the budget.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { COMPOUND, MEMORIAL, PAGE, WING, wingBand } from '../campus';
import { box, mergeParts, type Part } from '../geometry';
import { campusMaterials } from '../materials';
import { arcBand, mergeRaw, superPoint } from './world';

/**
 * The building's footprint as a closed outline, traced from the lowest band of
 * each wing and closed across the front and the back.
 *
 * Returned in the shape plane, where u maps to world x and v to **negative**
 * world z: ExtrudeGeometry pushes along +Z, and after the -90 degree turn about
 * X that makes the extrusion vertical, the shape's own +Y has become -Z.
 */
function footprint(margin: number): THREE.Shape {
  const base = wingBand(0);
  const ax = base.ax + margin;
  const az = base.az + margin;
  const steps = 56;

  const side: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = base.startAngle + (base.endAngle - base.startAngle) * (i / steps);
    const p = superPoint(ax, az, a, WING.squareness);
    side.push([p.x, -(WING.centreZ + p.z)]);
  }

  const s = new THREE.Shape();
  const first = side[0] as [number, number];
  s.moveTo(first[0], first[1]);
  for (const [u, v] of side) s.lineTo(u, v);
  // Back across the building, then the mirrored wing, then closed at the front.
  for (let i = side.length - 1; i >= 0; i--) {
    const p = side[i] as [number, number];
    s.lineTo(-p[0], p[1]);
  }
  s.closePath();
  return s;
}

/**
 * The plinth: the footprint of the lowest band, extruded up from the ground,
 * plus a drum under the rotunda.
 *
 * Traced from the **base** of the stack, which is ten metres narrower than its
 * top. The building overhangs its own plinth, which is the profile of image4
 * and the reason the sandstone reads as a base rather than as an apron.
 *
 * The wings' footprint stops short of the rotunda, so the drum needs its own
 * ground to stand on or the entrance steps climb to nothing.
 */
function plinth(): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(footprint(2.4), {
    depth: MEMORIAL.plinthY,
    bevelEnabled: false,
    curveSegments: 4,
  });
  g.rotateX(-Math.PI / 2);

  const drum = new THREE.CylinderGeometry(
    MEMORIAL.rotundaRadius + 1.6,
    MEMORIAL.rotundaRadius + 2.2,
    MEMORIAL.plinthY,
    40,
  );
  drum.translate(0, MEMORIAL.plinthY / 2, MEMORIAL.rotundaZ);

  return mergeRaw([g, drum]);
}

/**
 * One wing's louvre stack: projecting fins, with glazing recessed behind them.
 *
 * The stack is a steep wall that leans outward as it climbs, not a staircase.
 * Each band is a horizontal fin projecting from the face — the pale metal edge
 * that catches the light in every photograph of the building — and between one
 * fin and the next the glazing is set back in shadow. Twelve of those, each a
 * little further out than the one below, give the overhanging fanned edge of
 * image4.
 *
 * Fins are wider than the step between them, so consecutive fins overlap in
 * plan and the wall is closed when seen from above. The overlap disappears
 * inside the stack; a shortfall would be a slot of sky. The glazing likewise
 * runs slightly taller than the gap it fills.
 */
function wing(mirror: boolean): { glass: Part[]; edge: Part[] } {
  const glass: Part[] = [];
  const edge: Part[] = [];

  const fin = (b: ReturnType<typeof wingBand>, y: number) =>
    arcBand({
      ax: b.ax,
      az: b.az,
      startAngle: b.startAngle,
      endAngle: b.endAngle,
      segments: WING.segments,
      squareness: WING.squareness,
      // Nearly twice the step out, so neighbouring fins lap each other.
      width: 1.9,
      height: WING.bandThickness * 0.34,
      y,
      centreZ: WING.centreZ,
      mirror,
    });

  for (let i = 0; i < WING.bands; i++) {
    const b = wingBand(i);
    edge.push({ geometry: fin(b, b.y) });

    // The glazing between this fin and the one above, set back behind both.
    const above = i === WING.bands - 1 ? null : wingBand(i + 1);
    const outward = above === null ? 0 : (above.ax - b.ax) / 2;
    glass.push({
      geometry: arcBand({
        ax: b.ax + outward - WING.edgeDepth,
        az: b.az + (above === null ? 0 : (above.az - b.az) / 2) - WING.edgeDepth,
        startAngle: b.startAngle,
        endAngle: b.endAngle,
        segments: WING.segments,
        squareness: WING.squareness,
        width: 0.7,
        height: WING.bandRise * 1.16,
        y: b.y + WING.bandRise / 2,
        centreZ: WING.centreZ,
        mirror,
      }),
    });
  }

  // The parapet the page lands on, one step above the topmost fin.
  const top = wingBand(WING.bands - 1);
  edge.push({ geometry: fin(top, PAGE.outerY) });

  return { glass, edge };
}

/**
 * One page face: the upper, inner part of a wing's slope, from the spine down
 * to the top band of the stack.
 *
 * A grid rather than a quad, so the page can bow the way the leaves of an open
 * book do. Flat, it read as a folded card.
 */
function page(mirror: boolean): THREE.BufferGeometry {
  const across = 10;
  const along = 36;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const sx = mirror ? -1 : 1;
  const top = wingBand(WING.bands - 1);

  // The page fans from a straight edge along the spine out to the curved
  // fore-edge of the topmost band. Running both edges along the arc instead
  // made a lens that pinched to a point front and back; a page is held the
  // whole length of its gutter and only its outer edge is curved.
  const spineFrontZ =
    WING.centreZ + superPoint(top.ax, top.az, top.startAngle, WING.squareness).z;
  const spineBackZ =
    WING.centreZ + superPoint(top.ax, top.az, top.endAngle, WING.squareness).z;

  for (let j = 0; j <= along; j++) {
    const t = j / along;
    const a = top.startAngle + (top.endAngle - top.startAngle) * t;
    const edge = superPoint(top.ax, top.az, a, WING.squareness);
    const outerX = edge.x;
    const outerZ = WING.centreZ + edge.z;
    const innerZ = spineFrontZ + (spineBackZ - spineFrontZ) * t;
    // The bow is greatest at the middle of the page's length and dies at both
    // ends, where the page is held by the rotunda and the back wall.
    const bow = Math.sin(t * Math.PI) * PAGE.sag;
    for (let i = 0; i <= across; i++) {
      const u = i / across;
      const x = PAGE.innerX + (outerX - PAGE.innerX) * u;
      const z = innerZ + (outerZ - innerZ) * u;
      const y = PAGE.innerY + (PAGE.outerY - PAGE.innerY) * u - bow * (1 - u * 0.4);
      positions.push(sx * x, y, z);
      uvs.push(u, t);
    }
  }

  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * (across + 1) + i;
      const b = a + 1;
      const c = a + across + 1;
      const d = c + 1;
      // Wound so the page faces up on both wings.
      if (mirror) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/**
 * The portal: the flat panel that closes the gap left in the drum, with the
 * entrance arch cut out of it.
 *
 * Its ends meet the drum's cut edges exactly and its centre sits back inside
 * the curve, so the entrance is recessed a metre and a half into the building
 * without a single extra piece of geometry.
 */
function portal(): THREE.BufferGeometry {
  const R = MEMORIAL.rotundaRadius;
  const halfWidth = R * Math.sin(MEMORIAL.portalHalfAngle);
  const aw = MEMORIAL.archHalfWidth;
  const spring = MEMORIAL.archHeight - aw;
  const depth = 2.6;

  const face = new THREE.Shape();
  face.moveTo(-halfWidth, 0);
  face.lineTo(halfWidth, 0);
  face.lineTo(halfWidth, MEMORIAL.drumHeight);
  face.lineTo(-halfWidth, MEMORIAL.drumHeight);
  face.closePath();

  const opening = new THREE.Path();
  opening.moveTo(-aw, 0);
  opening.lineTo(-aw, spring);
  opening.absarc(0, spring, aw, Math.PI, 0, true);
  opening.lineTo(aw, 0);
  opening.closePath();
  face.holes.push(opening);

  const g = new THREE.ExtrudeGeometry(face, {
    depth,
    bevelEnabled: false,
    curveSegments: 24,
  });
  // The front face lands on the chord of the gap; the extrusion runs back into
  // the drum and becomes the reveal of the doorway.
  g.translate(0, 0, R * Math.cos(MEMORIAL.portalHalfAngle) - depth);
  return g;
}

/** The drum, its dome, the spine ridge behind it, and the wall closing the back. */
function spine(): THREE.BufferGeometry {
  const R = MEMORIAL.rotundaRadius;
  const gap = MEMORIAL.portalHalfAngle;

  // The drum, with the gap at the front that the portal closes. Theta runs
  // from +z in three.js, so leaving out the span either side of zero puts the
  // opening on the approach axis.
  const drum = new THREE.CylinderGeometry(
    R,
    R,
    MEMORIAL.drumHeight,
    48,
    1,
    true,
    gap,
    Math.PI * 2 - gap * 2,
  );
  drum.translate(0, MEMORIAL.drumHeight / 2, MEMORIAL.rotundaZ);

  const dome = new THREE.SphereGeometry(1, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(R, MEMORIAL.domeHeight, R);
  dome.translate(0, MEMORIAL.drumHeight, MEMORIAL.rotundaZ);

  const ridgeLength = MEMORIAL.rotundaZ - MEMORIAL.spineBackZ;
  const ridgeHeight = MEMORIAL.spineHeight - MEMORIAL.spineBaseY;
  const ridge = box(MEMORIAL.spineHalfWidth * 2, ridgeHeight, ridgeLength);
  ridge.translate(
    0,
    MEMORIAL.spineBaseY + ridgeHeight / 2,
    MEMORIAL.rotundaZ - ridgeLength / 2,
  );

  // A cap along the top of the ridge, so the spine has an edge against the sky.
  const cap = box(MEMORIAL.spineHalfWidth * 2 + 0.8, 0.5, ridgeLength);
  cap.translate(0, MEMORIAL.spineHeight, MEMORIAL.rotundaZ - ridgeLength / 2);

  // The back of the building, closing what the wings and pages leave open.
  //
  // Kept below the page line and inside the base of the stack, so it does the
  // structural job without being seen. At full spine height and the width of
  // the top band it stood up behind the book like a billboard, which is not
  // something the memorial has.
  const backWidth = wingBand(0).ax * 2;
  const backHeight = PAGE.outerY - MEMORIAL.plinthY;
  const backWall = box(backWidth, backHeight, 1.2);
  backWall.translate(0, MEMORIAL.plinthY + backHeight / 2, MEMORIAL.spineBackZ + 5);

  return mergeRaw([drum, dome, ridge, cap, backWall, portal()]);
}

/** The flight up from the plaza, and the ramp beside it. */
function approach(): Part[] {
  const parts: Part[] = [];
  const run = (MEMORIAL.stepsFrontZ - MEMORIAL.stepsBackZ) / MEMORIAL.stepCount;
  const rise = MEMORIAL.plinthY / MEMORIAL.stepCount;

  for (let i = 0; i < MEMORIAL.stepCount; i++) {
    // Each tread runs back under the one above it, so a step seen from the side
    // is solid rather than a floating slab.
    const depth = run * 2.2;
    parts.push({
      geometry: box(MEMORIAL.stepsHalfWidth * 2, rise, depth),
      position: [0, rise * (i + 0.5), MEMORIAL.stepsFrontZ - run * i - depth / 2],
    });
  }

  // A ramp either side, at the gradient the steps climb.
  const length = MEMORIAL.stepsFrontZ - MEMORIAL.stepsBackZ;
  const slope = Math.atan2(MEMORIAL.plinthY, length);
  for (const side of [-1, 1]) {
    parts.push({
      geometry: box(
        MEMORIAL.rampHalfWidth * 2,
        0.35,
        Math.hypot(length, MEMORIAL.plinthY),
      ),
      position: [
        side * MEMORIAL.rampOffsetX,
        MEMORIAL.plinthY / 2,
        (MEMORIAL.stepsFrontZ + MEMORIAL.stepsBackZ) / 2,
      ],
      rotation: [slope, 0, 0],
    });
  }

  return parts;
}

/**
 * The sky, kept centred on the camera.
 *
 * A fixed dome has to be larger than the whole site, and the arrival starts
 *168 m out on the road: the far side of a dome big enough to contain that is
 * further away than the camera's far plane, and it gets clipped into a black
 * disc across the middle of the establishing shot. Moving the dome with the
 * camera means it only ever has to be bigger than the near distance, and it
 * cannot be clipped at all.
 */
function SkyDome() {
  const m = campusMaterials();
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (ref.current !== null) ref.current.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} material={m.daylight} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  );
}

export function Memorial() {
  const m = campusMaterials();

  const g = useMemo(() => {
    const stone: Part[] = [{ geometry: plinth() }, ...approach()];
    const glass: Part[] = [];
    const edge: Part[] = [];

    for (const mirror of [false, true]) {
      const w = wing(mirror);
      glass.push(...w.glass);
      edge.push(...w.edge);
    }

    return {
      // Three metres per repeat: the coursing reads at the plinth without
      // turning the eighty metre elevation into wallpaper.
      stone: mergeParts(stone, 3.0),
      spine: mergeParts([{ geometry: spine() }], 3.0),
      glass: mergeRaw(glass.map((p) => p.geometry)),
      edge: mergeRaw(edge.map((p) => p.geometry)),
      pages: mergeRaw([page(false), page(true)]),
    };
  }, []);

  return (
    <group>
      <mesh geometry={g.stone} material={m.ashlar} />
      <mesh geometry={g.spine} material={m.ashlar} />
      <mesh geometry={g.glass} material={m.louvre} />
      <mesh geometry={g.edge} material={m.louvreEdge} />
      <mesh geometry={g.pages} material={m.page} />

      {/*
        The ground the campus does not cover: everything beyond the compound
        wall, out to where the haze closes the distance. Inside the wall it is
        hidden under the park's lawn and the plaza. The road, the footpaths and
        the neighbourhood are drawn on top of it.
      */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.06, 0]}
        material={m.concrete}
      >
        <planeGeometry args={[COMPOUND.halfWidth * 14, COMPOUND.halfWidth * 14]} />
      </mesh>

      <SkyDome />

      {/*
        Daylight, and it lives here rather than in Lights so that it is culled
        with the rest of the exterior. A light inside a hidden group is skipped
        entirely, so the hall keeps the six carefully chosen lights it was built
        around and does not get a sun through its ceiling.
      */}
      <hemisphereLight args={['#c4d2dd', '#6b5a42', 2.1]} />
      <directionalLight position={[70, 95, 130]} intensity={2.4} color="#fff2dc" />
      {/* A cool bounce from the opposite side, so the shaded wing is not black. */}
      <directionalLight position={[-90, 40, -60]} intensity={0.5} color="#9fb4c8" />
    </group>
  );
}

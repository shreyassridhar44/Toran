/**
 * Geometry the campus is built from.
 *
 * Four shapes account for most of the site: a band that follows a curve in
 * plan, a ring of paving, a tree, and a seated or standing figure. Each is
 * built once here and placed many times, so the grounds cost draw calls in the
 * single digits rather than one per object.
 *
 * Everything returns a plain BufferGeometry in local space, ready for `Part`
 * and `mergeParts` in `../geometry`.
 */

import * as THREE from 'three';
import { box } from '../geometry';

/**
 * A rectangular section swept along an elliptical arc in the XZ plane.
 *
 * This is the workhorse of the exterior. The louvre bands of the wings, the
 * mudra walls, the compound wall's curve at the gate and the kerb of the water
 * channel are all the same operation: a bar of constant cross-section bent
 * along a curve on the ground.
 *
 * Built directly as a triangle strip of quads rather than with ExtrudeGeometry
 * along a path. ExtrudeGeometry carries a rotation-minimising frame that flips
 * unpredictably on a flat curve, which put a half-twist in the first version of
 * the louvres; a band that is always upright cannot twist.
 */
export function arcBand(options: {
  /** Semi-axes of the arc, across x and along z. */
  ax: number;
  az: number;
  startAngle: number;
  endAngle: number;
  segments: number;
  /** Cross-section of the bar. */
  width: number;
  height: number;
  /** Height of the bar's centre above the local origin. */
  y: number;
  centreZ?: number;
  centreX?: number;
  /** Mirror across x = 0, for the other wing. */
  mirror?: boolean;
}): THREE.BufferGeometry {
  const {
    ax,
    az,
    startAngle,
    endAngle,
    segments,
    width,
    height,
    y,
    centreZ = 0,
    centreX = 0,
    mirror = false,
  } = options;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const sx = mirror ? -1 : 1;
  const halfW = width / 2;
  const top = y + height / 2;
  const bottom = y - height / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = startAngle + (endAngle - startAngle) * t;
    const ca = Math.cos(a);
    const sa = Math.sin(a);

    // Point on the arc, and the outward normal of the ellipse there. The
    // normal of an ellipse is not the radius vector: it is scaled by the
    // reciprocal of each semi-axis, which matters once ax and az differ much.
    const px = centreX + sx * ax * sa;
    const pz = centreZ + az * ca;
    const nx = sx * (sa / ax);
    const nz = ca / az;
    const nl = Math.hypot(nx, nz) || 1;
    const ox = (nx / nl) * halfW;
    const oz = (nz / nl) * halfW;

    // Four corners of the section: inner-bottom, outer-bottom, outer-top,
    // inner-top, in that order, so faces wind consistently along the sweep.
    positions.push(
      px - ox,
      bottom,
      pz - oz,
      px + ox,
      bottom,
      pz + oz,
      px + ox,
      top,
      pz + oz,
      px - ox,
      top,
      pz - oz,
    );
    const un = nx / nl;
    const uz = nz / nl;
    normals.push(-un, 0, -uz, un, 0, uz, un, 0, uz, -un, 0, -uz);
  }

  // Skin the four faces between consecutive sections.
  for (let i = 0; i < segments; i++) {
    const a = i * 4;
    const b = (i + 1) * 4;
    const quad = (p: number, q: number, r: number, s: number) => {
      indices.push(p, q, r, p, r, s);
    };
    quad(a + 0, b + 0, b + 1, a + 1); // underside
    quad(a + 1, b + 1, b + 2, a + 2); // outer face
    quad(a + 2, b + 2, b + 3, a + 3); // top
    quad(a + 3, b + 3, b + 0, a + 0); // inner face
  }

  // Caps at both ends, so a band seen end-on is solid.
  const last = segments * 4;
  indices.push(0, 2, 1, 0, 3, 2);
  indices.push(last + 0, last + 1, last + 2, last + 0, last + 2, last + 3);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/**
 * One ring of the plaza paving: a flat annulus at a given height.
 *
 * Drawn as a ring rather than a textured disc because the bands alternate in
 * colour and must be crisp. A texture at this scale would have to be enormous
 * to keep the ring edges sharp from a bird's-eye view, and texture memory is
 * the tighter budget.
 */
export function ring(
  inner: number,
  outer: number,
  segments = 96,
  y = 0,
): THREE.BufferGeometry {
  const g = new THREE.RingGeometry(inner, outer, segments);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/**
 * A wedge of the dharmachakra platform under the Ashoka pillar: the paved
 * spoke, cut from an annulus.
 */
export function wedge(
  inner: number,
  outer: number,
  centreAngle: number,
  halfAngle: number,
  y = 0,
): THREE.BufferGeometry {
  const g = new THREE.RingGeometry(
    inner,
    outer,
    Math.max(3, Math.ceil(halfAngle * 24)),
    1,
    centreAngle - halfAngle,
    halfAngle * 2,
  );
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/**
 * A tree, as trunk and two overlapping canopy spheres.
 *
 * Deliberately crude. There are upwards of sixty of these around the perimeter
 * and along the road, they are only ever seen at a distance or in motion, and
 * they exist to close the site in rather than to be looked at. Low segment
 * counts here are the difference between a perimeter that costs two thousand
 * triangles and one that costs forty thousand.
 */
export function tree(
  height = 7,
  spread = 3.2,
): {
  trunk: THREE.BufferGeometry;
  canopy: THREE.BufferGeometry;
} {
  const trunkH = height * 0.42;
  const trunk = new THREE.CylinderGeometry(height * 0.05, height * 0.075, trunkH, 6);
  trunk.translate(0, trunkH / 2, 0);

  const lower = new THREE.SphereGeometry(spread, 8, 6);
  lower.scale(1, 0.78, 1);
  lower.translate(0, trunkH + spread * 0.55, 0);
  const upper = new THREE.SphereGeometry(spread * 0.72, 8, 6);
  upper.scale(1, 0.82, 1);
  upper.translate(spread * 0.22, trunkH + spread * 1.25, -spread * 0.16);

  return {
    trunk,
    canopy: mergeRaw([lower, upper]),
  };
}

/**
 * A human figure, standing or seated, from eight primitives.
 *
 * The guard at the gate and the figures in the interior tableaux are the same
 * geometry at different poses. Nobody in this scene is closer to the camera
 * than a few metres, and a silhouette that reads as a person at that distance
 * is the whole requirement. A detailed mesh would cost more than the gate it
 * sits beside.
 */
export function figure(pose: 'standing' | 'seated'): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0) => {
    if (rx !== 0) g.rotateX(rx);
    g.translate(x, y, z);
    parts.push(g);
  };

  const seated = pose === 'seated';
  const hipY = seated ? 0.46 : 0.88;

  // Head and neck.
  add(new THREE.SphereGeometry(0.115, 8, 6), 0, hipY + 0.78, 0);
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.09, 6), 0, hipY + 0.64, 0);
  // Torso, tapering to the shoulders.
  add(new THREE.CylinderGeometry(0.19, 0.155, 0.56, 8), 0, hipY + 0.31, 0);
  // Arms, hanging or resting.
  for (const side of [-1, 1]) {
    const arm = new THREE.CapsuleGeometry(0.052, seated ? 0.3 : 0.42, 3, 6);
    if (seated) arm.rotateX(-0.9);
    add(arm, side * 0.22, hipY + (seated ? 0.3 : 0.28), seated ? 0.12 : 0);
  }
  // Legs: folded forward when seated, down when standing.
  for (const side of [-1, 1]) {
    if (seated) {
      const thigh = new THREE.CapsuleGeometry(0.075, 0.34, 3, 6);
      thigh.rotateX(Math.PI / 2);
      add(thigh, side * 0.1, hipY - 0.04, 0.2);
      const shin = new THREE.CapsuleGeometry(0.065, 0.36, 3, 6);
      add(shin, side * 0.1, hipY - 0.26, 0.38);
    } else {
      add(new THREE.CapsuleGeometry(0.075, 0.68, 3, 6), side * 0.1, 0.44, 0);
    }
  }

  return mergeRaw(parts);
}

/**
 * A lamp standard: the post and its lantern, as one geometry.
 */
export function lamp(height: number): {
  post: THREE.BufferGeometry;
  lantern: THREE.BufferGeometry;
} {
  const base = new THREE.CylinderGeometry(0.16, 0.2, 0.42, 8);
  base.translate(0, 0.21, 0);
  const shaft = new THREE.CylinderGeometry(0.065, 0.095, height, 8);
  shaft.translate(0, height / 2 + 0.3, 0);

  const lantern = new THREE.SphereGeometry(0.28, 10, 8);
  lantern.scale(1, 1.25, 1);
  lantern.translate(0, height + 0.5, 0);

  return { post: mergeRaw([base, shaft]), lantern };
}

/**
 * A slab with a moulded edge: the coping of the compound wall, the tread of a
 * step, the cap of a pier. Three boxes, because a chamfer that reads at ten
 * metres does not need to be a bevel.
 */
export function coped(
  width: number,
  height: number,
  depth: number,
  overhang = 0.1,
): THREE.BufferGeometry {
  return mergeRaw([
    box(width, height * 0.72, depth),
    (() => {
      const g = box(width + overhang * 2, height * 0.28, depth + overhang * 2);
      g.translate(0, height * 0.5, 0);
      return g;
    })(),
  ]);
}

/**
 * Merge geometries that are already in their final local positions.
 *
 * `mergeParts` in `../geometry` reprojects UVs in world space, which is right
 * for architecture but wrong for a small object built at the origin and then
 * instanced. This keeps the attributes as they are.
 */
export function mergeRaw(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const prepared = geometries.map((g) => {
    const out = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(out.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv')
        out.deleteAttribute(name);
    }
    if (!out.getAttribute('uv')) {
      out.setAttribute(
        'uv',
        new THREE.BufferAttribute(
          new Float32Array(out.getAttribute('position').count * 2),
          2,
        ),
      );
    }
    return out;
  });

  const merged = new THREE.BufferGeometry();
  const counts = prepared.reduce((n, g) => n + g.getAttribute('position').count, 0);
  const position = new Float32Array(counts * 3);
  const normal = new Float32Array(counts * 3);
  const uv = new Float32Array(counts * 2);
  let at = 0;
  for (const g of prepared) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const t = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      position[(at + i) * 3] = p.getX(i);
      position[(at + i) * 3 + 1] = p.getY(i);
      position[(at + i) * 3 + 2] = p.getZ(i);
      normal[(at + i) * 3] = n.getX(i);
      normal[(at + i) * 3 + 1] = n.getY(i);
      normal[(at + i) * 3 + 2] = n.getZ(i);
      uv[(at + i) * 2] = t.getX(i);
      uv[(at + i) * 2 + 1] = t.getY(i);
    }
    at += p.count;
  }
  merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  merged.computeBoundingSphere();
  return merged;
}

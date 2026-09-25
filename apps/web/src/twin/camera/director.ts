/**
 * The entry sequence.
 *
 * The camera starts low in the forecourt looking up at the crown of the Toran,
 * rises toward the gate as its gaze drops through the doorway, and settles
 * inside looking down the nave at the Chaitya arch. It is one continuous move
 * rather than a sequence of stops, so position and target run along splines
 * through the keyframes and are driven by a single eased clock.
 *
 * Easing is sine in and out. Of the common curves it has the lowest peak
 * velocity for a given duration, about 1.57 times the average against 3 for a
 * cubic, which is what "architectural pacing, no overshoot" means in numbers.
 */

import * as THREE from 'three';

export type Vec3 = readonly [number, number, number];

export interface Shot {
  readonly position: Vec3;
  readonly target: Vec3;
}

export const ENTRY_DURATION_MS = 3600;

/**
 * Provisional. The memorial and its grounds are far larger than the forecourt
 * these keyframes used to cross, so the flight now starts high over the road
 * and comes down the approach to the arch. It is still three beats in 3.6
 * seconds, which is brisk for the distance; the six-beat arrival — bird's eye,
 * the gate, the guard, the pillar sweeping past, the building filling the
 * frame — arrives with the campus it needs to fly through.
 */
export const ENTRY: readonly Shot[] = [
  { position: [0, 54, 168], target: [0, 15, 8] },
  { position: [0, 21, 96], target: [0, 13, 4] },
  { position: [0, 7, 42], target: [0, 8, 0] },
  { position: [0, 2.5, 9.0], target: [0, 3.6, -26] },
];

export const HOME: Shot = ENTRY[ENTRY.length - 1] as Shot;

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export class Flight {
  private readonly positions: THREE.CatmullRomCurve3;
  private readonly targets: THREE.CatmullRomCurve3;

  constructor(shots: readonly Shot[]) {
    this.positions = new THREE.CatmullRomCurve3(
      shots.map((s) => new THREE.Vector3(...s.position)),
      false,
      'centripetal',
    );
    this.targets = new THREE.CatmullRomCurve3(
      shots.map((s) => new THREE.Vector3(...s.target)),
      false,
      'centripetal',
    );
  }

  /** Pose at a normalised time in [0, 1]. */
  at(t: number, position: THREE.Vector3, target: THREE.Vector3): void {
    const u = easeInOutSine(Math.min(1, Math.max(0, t)));
    this.positions.getPoint(u, position);
    this.targets.getPoint(u, target);
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

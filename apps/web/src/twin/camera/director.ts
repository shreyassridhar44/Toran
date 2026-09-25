/**
 * The arrival.
 *
 * Eight keyframes, seven and a half seconds, one continuous move from a bird's
 * eye of the whole site to the threshold of the hall. Position and target run
 * along their own splines through the keyframes, driven by a single eased
 * clock, so the camera never stops and the gaze never snaps.
 *
 * The beats, in order:
 *
 *  1. High over Alipur Road, looking down on the campus. The memorial reads as
 *     an open book only from above, so this is where the flight has to begin.
 *  2. Down and forward. The city leaves the frame, the gate rises into it.
 *  3. Through the main gate at head height, between the open leaves, the name
 *     wall passing on one side and the gate house on the other.
 *  4. Under the torana on the approach.
 *  5. Alongside the Ashoka pillar, climbing, with the gaze on the lion capital.
 *     This is the one moment the lions are seen at full size.
 *  6. The building fills the frame: both wings splayed, the drum centred.
 *  7. The foot of the steps, the arch dead ahead.
 *  8. Through the arch and into the atrium, arriving on the statue.
 *
 * Easing is sine in and out. Of the common curves it has the lowest peak
 * velocity for a given duration, about 1.57 times the average against 3 for a
 * cubic, which is what "architectural pacing, no overshoot" means in numbers.
 *
 * Each beat also carries a weight, because the distances are wildly uneven —
 * ninety metres of descent against eight through the doorway — and a spline
 * parameterised by keyframe index gives every segment the same time regardless.
 * Without the weights the descent crawls and the doorway is a lunge.
 */

import * as THREE from 'three';

export type Vec3 = readonly [number, number, number];

export interface Shot {
  readonly position: Vec3;
  readonly target: Vec3;
  /**
   * Share of the flight spent travelling **to** this shot from the one before.
   * Relative, not absolute: only the ratios matter. Ignored on the first shot,
   * which has nothing before it.
   */
  readonly weight?: number;
}

/**
 * Seven and a half seconds. The brief allows eight, and the flight crosses two
 * hundred and thirty metres; below about seven it stops reading as an approach
 * and starts reading as a swoop.
 */
export const ENTRY_DURATION_MS = 7600;

export const ENTRY: readonly Shot[] = [
  // Above the road, looking down. High and steep: from 54 m at a shallow angle
  // the two pages foreshortened into one flat oval, and the open-book plan only
  // exists when you are over it. Beyond the road as well as above it, so the
  // establishing shot carries the market and the traffic the flight comes in
  // across.
  { position: [0, 108, 180], target: [0, 10, -8] },

  // Down and forward. The gaze drops to the gate as the city leaves the frame.
  { position: [0, 30, 134], target: [0, 8, 86], weight: 1.5 },

  // Through the gate at head height. Low enough to pass between the open leaves
  // rather than over them, which is the whole point of their being open.
  { position: [0, 3.2, 113], target: [0, 4.5, 84], weight: 1.0 },

  // Under the torana. Dead centre: the gap between its posts is barely five
  // metres, and it is the one piece of the approach the camera goes through
  // rather than past.
  { position: [0, 4.5, 95], target: [0, 8, 64], weight: 0.75 },

  // Rising alongside the pillar, gaze level with the lion capital. Offset in x
  // so the camera passes beside the shaft rather than through it.
  //
  // Set back far enough that the capital shares the frame with the campus it
  // stands in. From sixteen metres and craning upward the lions filled the
  // middle of an otherwise empty sky, which is a photograph of a statue rather
  // than a beat in an approach. A level gaze keeps the horizon, the plaza and
  // the building in shot behind them.
  { position: [12, 16, 74], target: [2, 15.5, 50], weight: 1.15 },

  // The building fills the frame, swinging back toward the centre line.
  //
  // Forty-six metres out, not thirty. The memorial is seventy-six metres across
  // and needs about forty-five of standoff before both wings fit a fifty degree
  // lens; from thirty the drum filled the frame on its own and the building it
  // belongs to was off the edges. Held a few metres off the axis so the path
  // from the pillar clears the shaft rather than threading it.
  { position: [3, 12, 46], target: [0, 12, 4], weight: 1.1 },

  // The foot of the steps, the arch dead ahead.
  { position: [0, 5.4, 17], target: [0, 7.5, 1], weight: 0.85 },

  // Through the arch. The zone boundary is the plane of the opening, so the
  // exterior is culled and the hall revealed while the camera is inside the two
  // and a half metre reveal of the doorway, where almost nothing else is in
  // view and the change cannot be seen.
  { position: [0, 4.5, 9.0], target: [0, 5.4, 0], weight: 0.75 },
];

export const HOME: Shot = ENTRY[ENTRY.length - 1] as Shot;

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export class Flight {
  private readonly positions: THREE.CatmullRomCurve3;
  private readonly targets: THREE.CatmullRomCurve3;
  /** Cumulative share of the flight at the end of each segment, ending at 1. */
  private readonly marks: readonly number[];

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

    const weights = shots.slice(1).map((s) => s.weight ?? 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let run = 0;
    this.marks = weights.map((w) => (run += w / total));
  }

  /**
   * Curve parameter for an eased time.
   *
   * CatmullRomCurve3.getPoint walks its points by index, so segment i occupies
   * an equal slice of u whatever its length. This maps the flight's own timing
   * onto that: find which segment the time falls in, and where within it.
   */
  private curveAt(eased: number): number {
    const segments = this.marks.length;
    let from = 0;
    for (let i = 0; i < segments; i++) {
      const to = this.marks[i] as number;
      if (eased <= to || i === segments - 1) {
        const span = to - from;
        const local = span <= 0 ? 0 : (eased - from) / span;
        return (i + Math.min(1, Math.max(0, local))) / segments;
      }
      from = to;
    }
    return 1;
  }

  /** Pose at a normalised time in [0, 1]. */
  at(t: number, position: THREE.Vector3, target: THREE.Vector3): void {
    const u = this.curveAt(easeInOutSine(Math.min(1, Math.max(0, t))));
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

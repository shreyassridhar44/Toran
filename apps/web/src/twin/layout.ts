/**
 * Hall dimensions, in metres. One place, so the camera bounds, the lighting
 * and the architecture cannot disagree about where the walls are.
 *
 * The hall stands **on the memorial's plinth**, two metres above the ground the
 * campus is measured from. Everything inside is quoted in hall coordinates with
 * the floor at zero and lifted by `floorY` when it is placed, except the devices,
 * whose positions are world coordinates because the fly-in reads them directly.
 */

export const HALL = {
  halfWidth: 12,
  height: 12,
  front: 13,
  /**
   * The nave runs to the back of the building rather than stopping halfway
   * down it. At −30 the hall was twenty metres long and had to hold the
   * photograph gallery, the study, the manuscripts, the banyan and the
   * Constitution gallery; the memorial's own back wall is at −39, and the
   * room now uses the length it has.
   */
  back: -38,
  doorHalfWidth: 3.2,
  doorHeight: 8.6,
  colonnadeX: 8.6,
  columnsZ: [-11, -16, -21, -26, -31] as const,
  archZ: -33,
  galleryZ: -36.5,

  /**
   * Height of the interior floor above the campus ground: the top of the
   * memorial's plinth.
   *
   * Stated rather than imported from campus.ts, so that this module and the
   * fleet config it sits beside stay loadable by a plain Node process — the
   * verifiers read them, and Toran Core reads the fleet. verify-campus asserts
   * this equals MEMORIAL.plinthY, so the two cannot drift.
   */
  floorY: 2.0,

  /**
   * Where the atrium ends and the nave begins.
   *
   * The atrium is the space under the rotunda: the drum's footprint, domed,
   * with the statue in it. The colonnade starts behind it — a row of columns
   * through a domed entrance hall would be a mistake in any building, and the
   * first three pairs stood exactly there.
   */
  atriumBackZ: -10,
} as const;

export const hallLength = HALL.front - HALL.back;
export const hallCentreZ = (HALL.front + HALL.back) / 2;

/** Clerestory windows on the left wall. The light shafts start here. */
export const WINDOW = { centreY: 8.5, height: 4.2 } as const;

/** Direction the clerestory light travels: down and across the nave. */
export const SUN = { from: [-20, 26, -6] as const, to: [0, 0, -6] as const };

/**
 * The statue of Dr. Ambedkar, standing in a sunken well at the centre of the
 * atrium and facing the entrance. In hall coordinates.
 */
/**
 * The exhibit sections, in hall coordinates. Each runs along a side wall, and
 * the centre aisle is left clear so the sightline from the atrium to the
 * Preamble is never blocked — which is the one rule the interior was composed
 * around before this pass and still is.
 */
export const SECTIONS = {
  /** Backlit archive photographs down the left wall, with the timeline panels
   * set into them. */
  mural: { x: -1, fromZ: -11, toZ: -25 },
  /** The recreated study, behind glass on the right. */
  study: { x: 1, fromZ: -11.5, toZ: -24 },
  /** Manuscript cases, right, behind the study. */
  vitrines: { x: 1, fromZ: -26.5, toZ: -34 },
  /** The banyan diorama, left, behind the mural wall. */
  banyan: { x: -1, fromZ: -26.5, toZ: -36 },
} as const;

export const STATUE = {
  z: 0,
  /** Radius of the well the pedestal stands in, and how far it drops. */
  wellRadius: 6.4,
  wellDepth: 1.3,
  pedestalHeight: 1.7,
  pedestalHalfWidth: 1.5,
  /** Head to heel. Monumental, not life sized. */
  height: 4.6,
} as const;

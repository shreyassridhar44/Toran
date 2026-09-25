/**
 * Hall dimensions, in metres. One place, so the camera bounds, the lighting
 * and the architecture cannot disagree about where the walls are.
 *
 * The hall stands **on the memorial's plinth**, two metres above the ground the
 * campus is measured from. Everything inside is quoted in hall coordinates with
 * the floor at zero and lifted by `floorY` when it is placed, except the devices,
 * whose positions are world coordinates because the fly-in reads them directly.
 */

import { MEMORIAL } from './campus';

export const HALL = {
  halfWidth: 12,
  height: 12,
  front: 13,
  back: -30,
  doorHalfWidth: 3.2,
  doorHeight: 8.6,
  colonnadeX: 8.6,
  columnsZ: [-11, -16, -21] as const,
  archZ: -25,
  galleryZ: -28.5,

  /** Height of the interior floor above the campus ground. */
  floorY: MEMORIAL.plinthY,

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

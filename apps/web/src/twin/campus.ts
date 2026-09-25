/**
 * The site plan of the Dr. Ambedkar National Memorial, 26 Alipur Road, in
 * metres. One place, so the building, the grounds, the city beyond the wall
 * and the arrival flight cannot disagree about where anything stands.
 *
 * Axes follow `layout.ts`, which keeps owning the interior: x across the site,
 * y up, z along the approach with **positive z toward the gate and the road**.
 * The origin sits on the building's spine axis at the centre of the rotunda,
 * so the whole composition is symmetric about x = 0 and the sightline from the
 * gate to the entrance arch to the Preamble wall is the line x = 0.
 *
 * Reading the site from the road inward:
 *
 *   z = 124   the road centreline
 *   z = 110   the compound wall and the main gate
 *   z =  86   the outer edge of the ring plaza
 *   z =  56   the Ashoka pillar, at the plaza's centre
 *   z =  26   the inner edge of the plaza, where the approach begins
 *   z =  18   the foot of the entrance steps
 *   z =  10   the face of the entrance arch
 *   z <  10   the building
 *
 * Dimensions are taken from the proportions in the photographs rather than a
 * survey. The memorial is roughly 80 m across its two wings and stands in a
 * compound of about 170 by 180 m; those are the numbers used here.
 */

/** Ground level. Everything on the site is measured from this plane. */
export const GROUND_Y = 0;

/**
 * The building: an open book, spine running along z, pages falling away to
 * either side.
 *
 * The rotunda is the drum of red sandstone at the front of the spine with the
 * arched entrance cut into it. `archZ` is the plane of the arch opening, which
 * is where the arrival flight ends and the interior begins.
 */
export const MEMORIAL = {
  /** Sandstone plinth the whole building stands on. */
  plinthY: 2.0,
  plinthFrontZ: 20,
  plinthBackZ: -48,
  /** Narrower than the stack above it, which overhangs it. */
  plinthHalfWidth: 35,

  /**
   * The spine: the red sandstone ridge between the two pages.
   *
   * It begins above the interior ceiling rather than at the plinth. Seen from
   * outside and from the air it is a solid ridge; taken to the ground it would
   * be a wall straight down the middle of the hall it is supposed to roof.
   */
  spineHalfWidth: 4.2,
  spineBaseY: 12,
  spineBackZ: -44,
  spineHeight: 23.4,

  /** The rotunda at the front of the spine, and the arch cut into it. */
  rotundaZ: 0,
  rotundaRadius: 13,
  /**
   * Height of the drum before the dome starts, and the dome above it. They sum
   * to the spine's height, so the drum finishes the ridge rather than being
   * overtopped by it — at 12.5 and 5 the spine stood a clear three metres
   * above the entrance and read as a chimney behind a pot.
   */
  drumHeight: 15.0,
  domeHeight: 8.4,
  /**
   * Half-angle of the gap left in the drum for the entrance. The portal is a
   * flat panel closing this gap, so its ends meet the drum exactly and its
   * centre sits back inside the curve — which is the deep recess of the
   * photographs.
   */
  portalHalfAngle: 0.52,
  archZ: 10,
  /** Matched to HALL.doorHalfWidth and HALL.doorHeight so the interior lines up. */
  archHalfWidth: 3.2,
  archHeight: 8.6,

  /** The steps and the ramp from the plaza up onto the plinth. */
  stepsFrontZ: 18,
  stepsBackZ: 12,
  stepsHalfWidth: 9.5,
  stepCount: 11,
  rampHalfWidth: 2.2,
  rampOffsetX: 13.5,
} as const;

/**
 * One wing of the book: the stack of curved louvre bands that is the cut edge
 * of a thousand fanned pages.
 *
 * Three things make it read as a book rather than as a glass hillside, and all
 * three are visible in the photographs:
 *
 * 1. **The stack leans outward as it rises.** Each band reaches further out
 *    than the one below, so the mass overhangs its own plinth — see the right
 *    wing in image4, where the top band stands several metres proud of the
 *    sandstone base it springs from. Built the other way, narrowing as it
 *    climbs, the memorial becomes a pair of splayed ramps with a pot between
 *    them.
 * 2. **The stack is steep and shallow in plan.** It runs `axTop - axBase`
 *    across while rising the full height of the building, so it is a wall, not
 *    a slope. Everything inboard of it is page.
 * 3. **The wing tapers along its length.** Higher bands sweep a shorter arc, so
 *    the wing stands tall against the rotunda and dies away to nothing at its
 *    far end — the profile of image4 from the road.
 *
 * Each band is an elliptical arc in plan, all about one centre behind the
 * middle of the building. Each starts where it clears the spine, so the start
 * angle is derived per band from `ax` rather than stored: as a constant it put
 * the low bands through the middle of the rotunda.
 *
 * Mirrored about x = 0 for the other wing, so only one is described.
 */
export const WING = {
  /**
   * Centre of the arcs, behind the middle of the building's length.
   *
   * Set far enough back that the front tip of every band falls behind the face
   * of the drum. At −16 the wings reached a metre and a half past it and the
   * stacks appeared to grow out of the entrance.
   */
  centreZ: -19,

  bands: 12,
  /** Vertical rise per band, and the height of the band itself. */
  bandRise: 1.0,
  bandThickness: 0.92,
  /** The glazing sits back behind the metal edge, which is what catches light. */
  edgeDepth: 0.34,

  /**
   * Semi-axis across x. `axBase` is the lowest band, standing on the plinth;
   * `axTop` is the highest, overhanging it by ten metres. The difference is
   * the whole overhang, and it is what the eye reads as the fanned edge of a
   * book rather than as a bank of seating.
   */
  axBase: 32,
  axTop: 38,
  /** Semi-axis along z, which leans out with it. */
  azBase: 24,
  azTop: 28,

  /** How far round the back the lowest band runs, as a fraction of a half turn. */
  backSweep: 0.97,
  /**
   * Radians taken off the far end of the arc per band. This is the taper: the
   * wing is full height where it meets the rotunda and falls away to the
   * plinth at its fore-edge.
   */
  endTaper: 0.058,

  /**
   * How square the plan is. 2 would be an ellipse, which gave a circular dish
   * that read as a bathtub; a book has long straightish edges and tight
   * corners. See superPoint in scene/world.
   */
  squareness: 2.9,

  /** Segments per arc. Twelve bands at 48 is 576 quads a wing; it reads smooth. */
  segments: 48,
} as const;

/**
 * The cream page face: the great gently sloping top surface of each wing, and
 * what the memorial actually is when seen from the air.
 *
 * It is the **dominant** surface, not a strip. It runs from the spine all the
 * way out to the top of the louvre stack — better than four fifths of the half
 * width — and falls only three metres over that distance, which is the shallow
 * tilt of an open page in image15. Made narrow, with the stack taking most of
 * the slope, the building stops being a book.
 */
export const PAGE = {
  /** Height of the page's inner edge, where it meets the spine. */
  innerY: 22.3,
  /**
   * Height of its outer edge. Flush with the top of the louvre stack — the top
   * band's tread plus the riser standing on it — so the paper lands exactly on
   * the glass rather than hovering above it or sinking through.
   */
  outerY: MEMORIAL.plinthY + WING.bands * WING.bandRise,
  /**
   * From the spine to the outermost, highest band. In plan the inner edge is a
   * straight line along the spine and the outer edge follows that band's arc,
   * so the page fans the way the leaf of an open book does.
   */
  innerX: MEMORIAL.spineHalfWidth,
  outerX: WING.axTop,
  /**
   * Pages bow very slightly, as the leaves of an open book do. Barely: at 0.9
   * the two pages dished inward and the building read as a basin.
   */
  sag: 0.25,
  /**
   * How much of the page's length is spent rising from the height of the stack
   * to its full height at the spine.
   *
   * The front of a page passes under the dome of the rotunda. Held at full
   * height the whole way forward, its inner corner stood nearly two metres
   * proud of the dome and drove a dark spike through it on each side.
   */
  tuck: 0.32,
} as const;

/** Where band `i` of a wing sits: its height and its two semi-axes. */
export function wingBand(i: number): {
  y: number;
  ax: number;
  az: number;
  startAngle: number;
  endAngle: number;
} {
  // 0 at the plinth, 1 at the top band.
  const t = i / (WING.bands - 1);
  // Outward as it rises: the overhang.
  const ax = WING.axBase + (WING.axTop - WING.axBase) * t;
  const az = WING.azBase + (WING.azTop - WING.azBase) * t;
  // Start where the arc first clears the spine, so the band tucks in beside the
  // sandstone instead of running through it. Taken from MEMORIAL rather than
  // restated here: the two were separate constants once, and they drifted.
  // asin is undefined if a band is ever narrower than the spine, which the
  // clamp handles by starting that band at its widest point.
  const startAngle = Math.asin(Math.min(1, MEMORIAL.spineHalfWidth / ax));
  return {
    y: MEMORIAL.plinthY + i * WING.bandRise,
    ax,
    az,
    startAngle,
    // Each band stops short of the one below it, which is the taper.
    endAngle: Math.PI * WING.backSweep - startAngle - i * WING.endTaper,
  };
}

/**
 * The ring plaza. Concentric bands of cream and warm grey paving centred on the
 * Ashoka pillar, and the dominant ground pattern of the whole site.
 */
export const PLAZA = {
  centreX: 0,
  centreZ: 56,
  innerRadius: 7.5,
  outerRadius: 30,
  rings: 17,
  /** The paved approach from the plaza to the foot of the steps. */
  approachHalfWidth: 8.5,
} as const;

/**
 * The Ashoka pillar, at the centre of the plaza and on the gate-to-arch
 * sightline. It stands on a platform shaped as a 24-spoke dharmachakra: paved
 * spokes radiating from the plinth with wedges of lawn between them.
 */
export const PILLAR = {
  x: 0,
  z: PLAZA.centreZ,

  wheelRadius: 7.2,
  spokes: 24,
  spokeHalfAngle: 0.055,
  wheelRise: 0.45,

  plinthHalfWidth: 1.9,
  plinthHeight: 1.25,
  shaftBottomRadius: 0.82,
  shaftTopRadius: 0.62,
  shaftHeight: 12.5,
  /** Bell capital, abacus with the animal frieze, and the four lions. */
  bellHeight: 1.5,
  abacusRadius: 1.15,
  abacusHeight: 0.62,
  lionHeight: 2.3,
} as const;

/** The compound wall, and the gate in it. */
export const COMPOUND = {
  halfWidth: 86,
  frontZ: 110,
  backZ: -78,
  wallHeight: 3.2,
  wallThickness: 0.7,
  copingHeight: 0.26,

  /** The main gate, centred on the sightline, standing open. */
  gateHalfWidth: 5.6,
  gateHeight: 3.9,
  pierHalfWidth: 1.0,
  pierHeight: 4.6,
  /** The pedestrian gate, to the east of the main leaves. */
  wicketOffsetX: 8.4,
  wicketHalfWidth: 1.2,

  /**
   * The name wall: the panel west of the gate carrying the memorial's name in
   * raised gold letters, with the lion capital on the coping above it.
   *
   * Set far enough out that its inner edge clears the gate pier. At the first
   * attempt it began at x = -6.5 and ran straight through the pier, which put
   * the first letters of the name inside a block of sandstone.
   */
  nameWallCentreX: -17.0,
  nameWallHalfWidth: 8.0,
  nameWallHeight: 4.2,
} as const;

/** The gate house, and the guard who sits in it. */
export const GATEHOUSE = {
  x: 13.8,
  z: 103,
  width: 3.4,
  depth: 3.0,
  height: 3.1,
} as const;

/**
 * The mudra walls: curved sandstone walls flanking the approach, carrying a row
 * of bronze hands in the Buddhist gestures, each on a boss with a name plaque.
 *
 * Arcs about the plaza centre, so they read as a continuation of the ring
 * paving rather than as two arbitrary walls.
 */
export const MUDRA = {
  radius: 34,
  centreZ: PLAZA.centreZ,
  height: 3.6,
  thickness: 0.65,
  /** Sweep, in radians either side of the cross axis. */
  halfSweep: 0.62,
  hands: 11,
  handY: 2.35,
  bossRadius: 0.34,
} as const;

/** The road outside the wall, and the footpath between them. */
export const ROAD = {
  centreZ: 124,
  halfWidth: 7.0,
  kerbHeight: 0.15,
  footpathHalfWidth: 2.6,
  /** How far the road and its traffic run either side of the sightline. */
  extent: 180,
  /** The two traffic lanes, as offsets from the centreline. */
  laneOffsets: [-3.4, 3.4] as const,
} as const;

/**
 * Everything beyond the wall. Scenery: never raycast, and hidden the moment the
 * camera is inside the building.
 */
export const CITY = {
  /** Neighbouring blocks on the far side of the road. */
  blockRowZ: 150,
  blockDepth: 18,
  blockExtent: 200,
  /** Delhi residential blocks run three and four storeys. */
  storeyHeight: 3.3,
  minStoreys: 3,
  maxStoreys: 5,
  /** The market row: shopfronts under awnings, nearer the road than the blocks. */
  marketZ: 138,
  marketDepth: 7.5,
  /** A low-detail skyline behind everything, to close the horizon. */
  skylineZ: 290,

  /**
   * How far beyond the compound wall the neighbours stand on the sides and at
   * the back. The memorial is enclosed on all four sides in the photographs;
   * building only along the road leaves a campus that ends in empty haze the
   * moment the camera turns.
   */
  sideOffset: 26,
  backOffset: 30,
} as const;

/**
 * Where the perimeter planting stands. Trees line the inside of the wall and
 * both sides of the road; the campus reads as enclosed from every angle the
 * arrival flight passes through.
 */
export const PLANTING = {
  perimeterInset: 7.0,
  spacing: 16,
  /** Lamp standards along the approach and around the plaza. */
  lampSpacing: 14,
  lampHeight: 4.6,
} as const;

/** The fountains, either side of the approach between the plaza and the gate. */
export const FOUNTAINS = [
  { x: -27, z: 78, radius: 5.2 },
  { x: 27, z: 78, radius: 5.2 },
] as const;

/**
 * The water channel curving around the east of the site, as it does in the
 * memorial's master plan.
 */
export const CHANNEL = {
  radius: 62,
  centreZ: PLAZA.centreZ,
  width: 3.4,
  depth: 0.4,
  startAngle: 0.35,
  endAngle: 1.95,
} as const;

/**
 * Where the camera is, in the terms the scene cares about. The exterior stops
 * drawing once the visitor is inside and the interior stops drawing while they
 * are out on the campus, which is the single biggest saving available: the two
 * halves of the model are never both on screen.
 *
 * The boundary is the plane of the entrance arch.
 */
export type Zone = 'campus' | 'inside';

export function zoneAt(z: number): Zone {
  return z > MEMORIAL.archZ ? 'campus' : 'inside';
}

/**
 * The band around the threshold where **both** halves are drawn.
 *
 * A hard switch at the arch is correct for everything except the one place it
 * matters: standing on the steps looking in. From there the opening is most of
 * the frame, the camera is still outside, and the interior is culled — so the
 * climax of the arrival is a view through a doorway into the back of a hollow
 * drum with daylight behind it.
 *
 * Inside this band nothing is culled, so the hall is already there to be seen
 * through the arch and the exterior is still there to be seen back through it.
 * It costs a few hundred milliseconds of drawing both models, once, at the end
 * of the flight.
 *
 * `overlapIn` sits just **inside** where the flight comes to rest, at z = 9.
 * Put any further in and the visitor stands in the band for the whole visit,
 * drawing a campus behind a wall they are facing away from; put it level with
 * the arch and the exterior vanishes the instant the camera crosses the plane,
 * while the opening still fills the frame.
 */
export const THRESHOLD = { overlapIn: 9.3, overlapOut: 24 } as const;

/**
 * Where the city stops being drawn.
 *
 * Everything beyond the wall is behind the camera once it is on the approach,
 * and it is dead weight exactly where the threshold band is already paying to
 * draw both halves of the model. Dropping it there is what keeps that overlap
 * inside the draw-call budget.
 */
export const CITY_FADES_AT = 26;

export function drawsBothZones(z: number): boolean {
  return z > THRESHOLD.overlapIn && z < THRESHOLD.overlapOut;
}

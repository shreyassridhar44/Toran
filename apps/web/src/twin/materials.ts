/**
 * Shared materials, built once per page.
 *
 * Every colour traces to a token in tokens.css and through it to a material in
 * the building: red sandstone, brass, the dark stone of the floor. Nothing is
 * picked here that is not already in the palette. See CLAUDE.md section 5.
 */

import * as THREE from 'three';
import {
  ashlar,
  asphalt,
  blob,
  daysky,
  facade,
  floor,
  jali,
  lawn,
  nameplate,
  pageFace,
  paving,
  plume,
  relief,
  sandstone,
  shaft,
  sky,
} from './textures';

export interface HallMaterials {
  sandstone: THREE.MeshStandardMaterial;
  carved: THREE.MeshStandardMaterial;
  gate: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  ground: THREE.MeshStandardMaterial;
  window: THREE.MeshBasicMaterial;
  shaft: THREE.MeshBasicMaterial;
  shadow: THREE.MeshBasicMaterial;
  sky: THREE.MeshBasicMaterial;
  inlay: THREE.MeshStandardMaterial;
  paper: THREE.MeshStandardMaterial;
  generatedMs: number;
}

let cached: HallMaterials | null = null;

export function hallMaterials(): HallMaterials {
  if (cached !== null) return cached;
  const started = performance.now();

  const stone = sandstone(512);
  const carving = relief(512);
  // 512 rather than 1024: each two metre slab still gets 128 pixels, which is
  // more than a standing eye resolves across the hall, and it saves about 8 MB
  // of texture memory on a tablet.
  const tiles = floor(512);
  // Two metre slabs. At one metre the floor read as a grid of bathroom tile.
  tiles.map.repeat.set(3, 5.5);
  tiles.roughness.repeat.set(3, 5.5);

  const brassColor = new THREE.Color('#c89b52');

  cached = {
    sandstone: new THREE.MeshStandardMaterial({
      map: stone.map,
      roughnessMap: stone.roughness,
      roughness: 0.92,
      metalness: 0,
    }),
    carved: new THREE.MeshStandardMaterial({
      map: stone.map,
      roughnessMap: stone.roughness,
      bumpMap: carving,
      bumpScale: 1.1,
      roughness: 0.9,
      metalness: 0,
    }),
    gate: new THREE.MeshStandardMaterial({
      map: stone.map,
      roughnessMap: stone.roughness,
      bumpMap: carving,
      bumpScale: 1.9,
      roughness: 0.88,
      metalness: 0,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: brassColor,
      metalness: 0.92,
      roughness: 0.32,
      emissive: brassColor,
      emissiveIntensity: 0.06,
    }),
    bronze: new THREE.MeshStandardMaterial({
      color: '#3d332a',
      metalness: 0.7,
      roughness: 0.34,
    }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#1a1714', roughness: 0.95 }),
    floor: new THREE.MeshStandardMaterial({
      map: tiles.map,
      roughnessMap: tiles.roughness,
      // Dark polished granite, as in image5 and image8, not the warm grey it
      // was. Through the open arch the daylight outside falls on this floor,
      // and at the old tone it read as more sandstone paving rather than as
      // the inside of a building.
      color: '#3c3833',
      roughness: 0.38,
      metalness: 0.14,
      envMapIntensity: 0.3,
    }),
    ground: new THREE.MeshStandardMaterial({ color: '#241d17', roughness: 1 }),
    window: new THREE.MeshBasicMaterial({
      map: jali(),
      color: new THREE.Color(1.25, 1.25, 1.25),
      toneMapped: false,
    }),
    shaft: new THREE.MeshBasicMaterial({
      color: '#ffcf8f',
      alphaMap: shaft(),
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    shadow: new THREE.MeshBasicMaterial({
      map: blob(),
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    }),
    sky: new THREE.MeshBasicMaterial({
      map: sky(),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
    inlay: new THREE.MeshStandardMaterial({
      color: brassColor,
      metalness: 0.95,
      roughness: 0.25,
      emissive: brassColor,
      emissiveIntensity: 0.18,
    }),
    paper: new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.85 }),
    generatedMs: 0,
  };
  cached.generatedMs = Math.round(performance.now() - started);
  return cached;
}

/**
 * Materials for the campus outside the building.
 *
 * Kept in their own cache rather than added to `hallMaterials`, and built on
 * first use. A visitor who deep-links straight into a device never sees the
 * grounds, and there is no reason to spend their cold load generating a lawn
 * and forty building facades they will not look at.
 */
export interface CampusMaterials {
  /** Coursed red sandstone: the compound wall, the spine, the plinth. */
  ashlar: THREE.MeshStandardMaterial;
  /** The cream page faces that roof the building. */
  page: THREE.MeshStandardMaterial;
  /** The dark glazing of the louvre bands. */
  louvre: THREE.MeshStandardMaterial;
  /** The pale metal edge capping each band, which is what catches the light. */
  louvreEdge: THREE.MeshStandardMaterial;
  /** The gold of the gate, the lettering and the mudra bosses. */
  gold: THREE.MeshStandardMaterial;
  /** Patinated bronze: the mudra hands and the lions, outdoors in daylight. */
  verdigris: THREE.MeshStandardMaterial;
  /**
   * The statue, indoors. The same patina, but far less metallic: a metal with
   * nothing bright to reflect renders close to black, and the atrium is a black
   * room. The statue has to be modelled by its own lighting, not by a
   * reflection of a room that has none.
   */
  bronze: THREE.MeshStandardMaterial;
  /** Polished dark granite: the pillar shaft, the statue pedestal. */
  granite: THREE.MeshStandardMaterial;
  /** The two alternating tones of the ring plaza. */
  pavingLight: THREE.MeshStandardMaterial;
  pavingDark: THREE.MeshStandardMaterial;
  lawn: THREE.MeshStandardMaterial;
  asphalt: THREE.MeshStandardMaterial;
  /** Kerbs, footpaths, and the concrete of the forecourt. */
  concrete: THREE.MeshStandardMaterial;
  /**
   * Neighbouring blocks: one texture over a box, in three tints. A single
   * colour across forty buildings reads as one printed backdrop rather than as
   * a neighbourhood, and tinting is the cheapest variation there is.
   */
  facade: THREE.MeshStandardMaterial;
  facadeWarm: THREE.MeshStandardMaterial;
  facadeCool: THREE.MeshStandardMaterial;
  /** Foliage, and the clipped hedges. */
  foliage: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  /** The guard at the gate. Delhi police khaki. */
  khaki: THREE.MeshStandardMaterial;
  /** The glass balustrade around the statue's well. */
  glazing: THREE.MeshStandardMaterial;
  /** Its handrail, and the stanchions in the galleries. */
  steel: THREE.MeshStandardMaterial;
  /** Lane markings on the road. */
  marking: THREE.MeshStandardMaterial;
  /** Car paintwork, autorickshaw green, bus red. */
  paintwork: THREE.MeshStandardMaterial;
  autoGreen: THREE.MeshStandardMaterial;
  busRed: THREE.MeshStandardMaterial;
  /** Market awnings, and the dark glazed front of a shop. */
  awning: THREE.MeshStandardMaterial;
  shopfront: THREE.MeshStandardMaterial;
  /** The skyline, which exists only to be haze-coloured and far away. */
  distant: THREE.MeshStandardMaterial;
  /** Water in the fountains and the channel. */
  water: THREE.MeshStandardMaterial;
  /** The plume of a fountain jet, and the spray. Additive, unlit. */
  spray: THREE.MeshBasicMaterial;
  /** The daytime sky over the campus. */
  daylight: THREE.MeshBasicMaterial;
  /** The lit globe of a lamp standard. */
  lampGlow: THREE.MeshBasicMaterial;
  /** The name on the compound wall, as a decal over the stone. */
  nameplate: THREE.MeshBasicMaterial;
  generatedMs: number;
}

let campusCache: CampusMaterials | null = null;

export function campusMaterials(): CampusMaterials {
  if (campusCache !== null) return campusCache;
  const started = performance.now();

  const coursed = ashlar(512);
  // Three metre courses. The compound wall is about three metres tall, so one
  // repeat covers its full height and the coursing never reads as wallpaper.
  coursed.map.repeat.set(0.34, 0.34);
  coursed.roughness.repeat.set(0.34, 0.34);

  const slabs = paving(256);
  slabs.map.repeat.set(0.5, 0.5);
  slabs.roughness.repeat.set(0.5, 0.5);

  const gold = new THREE.Color('#c89b52');
  const patina = new THREE.Color('#4a7a68');

  campusCache = {
    ashlar: new THREE.MeshStandardMaterial({
      map: coursed.map,
      roughnessMap: coursed.roughness,
      roughness: 0.94,
      metalness: 0,
    }),
    page: new THREE.MeshStandardMaterial({
      map: pageFace(512),
      color: '#ffffff',
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
    louvre: new THREE.MeshStandardMaterial({
      color: '#1f1b17',
      roughness: 0.18,
      metalness: 0.55,
      envMapIntensity: 1.4,
    }),
    louvreEdge: new THREE.MeshStandardMaterial({
      color: '#c8bfae',
      roughness: 0.42,
      metalness: 0.72,
    }),
    gold: new THREE.MeshStandardMaterial({
      color: gold,
      metalness: 0.9,
      roughness: 0.34,
      emissive: gold,
      emissiveIntensity: 0.05,
    }),
    verdigris: new THREE.MeshStandardMaterial({
      color: patina,
      metalness: 0.62,
      roughness: 0.62,
    }),
    bronze: new THREE.MeshStandardMaterial({
      color: '#5c9186',
      metalness: 0.28,
      roughness: 0.46,
      // A trace of self-illumination, so the shaded side of the bronze falls to
      // a patina green rather than to pure black.
      emissive: new THREE.Color('#122a28'),
      emissiveIntensity: 0.4,
    }),
    granite: new THREE.MeshStandardMaterial({
      color: '#2a2724',
      roughness: 0.3,
      metalness: 0.22,
      envMapIntensity: 0.5,
    }),
    // The two ring tones. Same texture, different tint, so the alternating
    // bands of the plaza cost one texture between them.
    pavingLight: new THREE.MeshStandardMaterial({
      map: slabs.map,
      roughnessMap: slabs.roughness,
      color: '#d8cdb8',
      roughness: 0.78,
      metalness: 0,
    }),
    pavingDark: new THREE.MeshStandardMaterial({
      map: slabs.map,
      roughnessMap: slabs.roughness,
      color: '#8f8676',
      roughness: 0.8,
      metalness: 0,
    }),
    lawn: new THREE.MeshStandardMaterial({
      map: (() => {
        const t = lawn(256);
        t.repeat.set(24, 24);
        return t;
      })(),
      roughness: 1,
      metalness: 0,
    }),
    asphalt: new THREE.MeshStandardMaterial({
      map: (() => {
        const t = asphalt(256);
        t.repeat.set(30, 3);
        return t;
      })(),
      roughness: 0.92,
      metalness: 0,
    }),
    concrete: new THREE.MeshStandardMaterial({ color: '#9a9184', roughness: 0.9 }),
    ...(() => {
      // One map between the three, so the variation is free in texture memory.
      const map = facade(256);
      const tint = (color: string) =>
        new THREE.MeshStandardMaterial({ map, color, roughness: 0.92, metalness: 0 });
      return {
        facade: tint('#ffffff'),
        facadeWarm: tint('#e6d4b8'),
        facadeCool: tint('#c9cec9'),
      };
    })(),
    foliage: new THREE.MeshStandardMaterial({
      color: '#4e6134',
      roughness: 0.95,
      metalness: 0,
      // Flat shading turns eight-segment spheres into something that reads as
      // massed leaves rather than as a smooth green ball.
      flatShading: true,
    }),
    bark: new THREE.MeshStandardMaterial({ color: '#4a3a2c', roughness: 0.96 }),
    khaki: new THREE.MeshStandardMaterial({ color: '#8a7b55', roughness: 0.9 }),
    // Barely there. A balustrade that reads as glass is one you notice only
    // where its edge catches the light.
    glazing: new THREE.MeshStandardMaterial({
      color: '#9fd4dc',
      transparent: true,
      opacity: 0.14,
      roughness: 0.06,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: '#b7bcc0',
      metalness: 0.85,
      roughness: 0.28,
    }),
    marking: new THREE.MeshStandardMaterial({ color: '#d8d2c2', roughness: 0.85 }),
    // One colour for every car, because at the distance the road is seen a
    // fleet of different colours reads as noise rather than as traffic.
    paintwork: new THREE.MeshStandardMaterial({
      color: '#9aa1a8',
      metalness: 0.55,
      roughness: 0.38,
    }),
    autoGreen: new THREE.MeshStandardMaterial({ color: '#2f6b46', roughness: 0.55 }),
    busRed: new THREE.MeshStandardMaterial({ color: '#8f3626', roughness: 0.68 }),
    awning: new THREE.MeshStandardMaterial({ color: '#7a5c3c', roughness: 0.92 }),
    shopfront: new THREE.MeshStandardMaterial({
      color: '#2b2a28',
      roughness: 0.3,
      metalness: 0.4,
    }),
    // Flat, unlit-looking and close to the fog, so the skyline sits at the
    // horizon instead of standing out as a row of lit boxes.
    distant: new THREE.MeshStandardMaterial({
      color: '#9c9484',
      roughness: 1,
      metalness: 0,
    }),
    water: new THREE.MeshStandardMaterial({
      color: '#2f5a6b',
      roughness: 0.08,
      metalness: 0.4,
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 1.6,
    }),
    spray: new THREE.MeshBasicMaterial({
      color: '#dceaf0',
      alphaMap: plume(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    daylight: new THREE.MeshBasicMaterial({
      map: daysky(),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
    lampGlow: new THREE.MeshBasicMaterial({ color: '#ffe6bc', toneMapped: false }),
    nameplate: new THREE.MeshBasicMaterial({
      map: nameplate(),
      transparent: true,
      toneMapped: false,
    }),
    generatedMs: 0,
  };
  campusCache.generatedMs = Math.round(performance.now() - started);
  return campusCache;
}

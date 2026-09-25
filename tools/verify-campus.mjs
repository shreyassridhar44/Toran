/**
 * Campus geometry verification.
 *
 * The site plan in apps/web/src/twin/campus.ts is a long list of numbers that
 * several scene components read independently. A number that is wrong there is
 * not a compile error and not a test failure: it is a building with its wings
 * through the entrance arch, and it only shows up when someone looks at it.
 *
 * This asserts the relationships those numbers have to hold, before anything is
 * modelled from them. It imports the real module rather than restating it, so
 * the check cannot drift from the plan it is checking. Node strips the types.
 *
 * Runs anywhere Node runs; no browser and no GPU, unlike verify-twin.
 */

import {
  CHANNEL,
  CITY,
  COMPOUND,
  FOUNTAINS,
  GATEHOUSE,
  MEMORIAL,
  MUDRA,
  PAGE,
  PILLAR,
  PLAZA,
  ROAD,
  WING,
  wingBand,
  zoneAt,
} from '../apps/web/src/twin/campus.ts';

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
};

console.log('\nToran campus geometry\n');

// ---- the wing: the silhouette of the whole building ----
console.log('The wings');

const bands = Array.from({ length: WING.bands }, (_, i) => wingBand(i));
const first = bands[0];
const last = bands[bands.length - 1];

let maxX = 0;
let minZ = Infinity;
let maxZ = -Infinity;
let widens = false;
for (let i = 0; i < bands.length; i++) {
  const b = bands[i];
  if (i > 0 && b.ax > bands[i - 1].ax + 1e-6) widens = true;
  for (let s = 0; s <= WING.segments; s++) {
    const a = b.startAngle + (b.endAngle - b.startAngle) * (s / WING.segments);
    maxX = Math.max(maxX, b.ax * Math.sin(a));
    const z = WING.centreZ + b.az * Math.cos(a);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
}
const topY = last.y + WING.bandThickness / 2;

check(
  'the wedge falls outward, so the building reads as an open book',
  !widens && last.ax < first.ax,
  `${first.ax.toFixed(1)} m at the plinth down to ${last.ax.toFixed(1)} m at the spine`,
);
check(
  'the memorial is about eighty metres across',
  maxX * 2 > 65 && maxX * 2 < 95,
  `${(maxX * 2).toFixed(1)} m`,
);
check(
  'the top band dies into the spine rather than floating beside it',
  last.ax < MEMORIAL.spineHalfWidth + 4,
  `top band reaches x ${last.ax.toFixed(1)}, spine is ${MEMORIAL.spineHalfWidth}`,
);
check(
  'no band cuts through the spine',
  first.ax * Math.sin(first.startAngle) >= MEMORIAL.spineHalfWidth - 0.01,
  `innermost point x ${(first.ax * Math.sin(first.startAngle)).toFixed(2)}`,
);
check(
  'the stack stays under the spine ridge',
  topY < MEMORIAL.spineHeight,
  `stack ${topY.toFixed(1)} m, spine ${MEMORIAL.spineHeight} m`,
);
check(
  'the wings clear the entrance arch',
  maxZ <= MEMORIAL.archZ + 3,
  `front of the wings at z ${maxZ.toFixed(1)}, arch at z ${MEMORIAL.archZ}`,
);
check(
  'the wings stand on the plinth, front to back',
  maxZ < MEMORIAL.plinthFrontZ && minZ > MEMORIAL.plinthBackZ,
  `z ${maxZ.toFixed(1)} to ${minZ.toFixed(1)}, plinth ${MEMORIAL.plinthFrontZ} to ${MEMORIAL.plinthBackZ}`,
);
check(
  'the wings stand on the plinth across',
  maxX < MEMORIAL.plinthHalfWidth,
  `${maxX.toFixed(1)} m of ${MEMORIAL.plinthHalfWidth} m`,
);

// ---- the page faces sit on top of the stack, not through it ----
console.log('\nThe page faces');
check(
  'the page slopes down and outward from the spine',
  PAGE.innerY > PAGE.outerY && PAGE.outerX > PAGE.innerX,
  `${PAGE.innerY} m at x ${PAGE.innerX} down to ${PAGE.outerY} m at x ${PAGE.outerX}`,
);
check(
  'the page meets the top of the louvre stack',
  Math.abs(PAGE.outerY - topY) < 2.5,
  `page edge ${PAGE.outerY} m, stack top ${topY.toFixed(1)} m`,
);
check(
  'the page starts at the spine',
  Math.abs(PAGE.innerX - MEMORIAL.spineHalfWidth) < 1.5,
  `page inner edge x ${PAGE.innerX}, spine ${MEMORIAL.spineHalfWidth}`,
);
check(
  'the page is no taller than the spine that carries it',
  PAGE.innerY <= MEMORIAL.spineHeight,
  `${PAGE.innerY} m of ${MEMORIAL.spineHeight} m`,
);

// ---- the approach, from the gate to the arch ----
console.log('\nThe approach');
const plazaFront = PLAZA.centreZ + PLAZA.outerRadius;
const plazaBack = PLAZA.centreZ - PLAZA.outerRadius;

check(
  'the gate, the pillar and the arch are on one sightline',
  PILLAR.x === 0 && PLAZA.centreX === 0,
  'all on x = 0',
);
check(
  'the order from the road inward is road, wall, plaza, steps, arch',
  ROAD.centreZ > COMPOUND.frontZ &&
    COMPOUND.frontZ > plazaFront &&
    plazaBack > MEMORIAL.stepsFrontZ &&
    MEMORIAL.stepsFrontZ > MEMORIAL.archZ,
  `road ${ROAD.centreZ}, wall ${COMPOUND.frontZ}, plaza ${plazaFront.toFixed(0)}-${plazaBack.toFixed(0)}, steps ${MEMORIAL.stepsFrontZ}, arch ${MEMORIAL.archZ}`,
);
check(
  'the plaza clears the building',
  plazaBack > MEMORIAL.plinthFrontZ,
  `plaza reaches z ${plazaBack.toFixed(1)}, plinth starts at ${MEMORIAL.plinthFrontZ}`,
);
check(
  'the pillar stands clear of the mudra walls',
  MUDRA.radius > PILLAR.wheelRadius + 4,
  `wall at r ${MUDRA.radius}, wheel r ${PILLAR.wheelRadius}`,
);
check(
  'the steps are shallow enough to climb',
  MEMORIAL.plinthY / MEMORIAL.stepCount < 0.2,
  `${((MEMORIAL.plinthY / MEMORIAL.stepCount) * 1000).toFixed(0)} mm rise per step`,
);
check(
  'the gate is wide enough for the flight to pass through',
  COMPOUND.gateHalfWidth * 2 >= 8,
  `${(COMPOUND.gateHalfWidth * 2).toFixed(1)} m clear`,
);

// ---- everything inside the wall ----
console.log('\nThe compound');
const inside = (x, z) =>
  Math.abs(x) < COMPOUND.halfWidth && z < COMPOUND.frontZ && z > COMPOUND.backZ;

check(
  'the building is inside the wall',
  inside(MEMORIAL.plinthHalfWidth, MEMORIAL.plinthFrontZ) &&
    inside(MEMORIAL.plinthHalfWidth, MEMORIAL.plinthBackZ),
  '',
);
check('the plaza is inside the wall', inside(PLAZA.outerRadius, plazaFront), '');
check('the gate house is inside the wall', inside(GATEHOUSE.x, GATEHOUSE.z), '');
check(
  'the name wall fits beside the gate without overlapping it',
  Math.abs(COMPOUND.nameWallCentreX) - COMPOUND.nameWallHalfWidth >
    COMPOUND.gateHalfWidth + COMPOUND.pierHalfWidth * 2,
  '',
);
check(
  'the wicket gate clears the main leaves',
  COMPOUND.wicketOffsetX - COMPOUND.wicketHalfWidth >
    COMPOUND.gateHalfWidth + COMPOUND.pierHalfWidth,
  '',
);
check(
  'both fountains are inside the wall and off the sightline',
  FOUNTAINS.every(
    (f) => inside(Math.abs(f.x) + f.radius, f.z) && Math.abs(f.x) > f.radius,
  ),
  `${FOUNTAINS.length} fountains`,
);
check(
  'the water channel stays inside the wall',
  CHANNEL.radius + CHANNEL.width < COMPOUND.halfWidth,
  `channel at r ${CHANNEL.radius}, wall at ${COMPOUND.halfWidth}`,
);

// ---- the city, which must sit beyond the wall ----
console.log('\nThe city');
check(
  'the road runs outside the wall',
  ROAD.centreZ - ROAD.halfWidth > COMPOUND.frontZ,
  `road edge z ${(ROAD.centreZ - ROAD.halfWidth).toFixed(1)}, wall z ${COMPOUND.frontZ}`,
);
check(
  'the market and the neighbouring blocks are beyond the road',
  CITY.marketZ > ROAD.centreZ + ROAD.halfWidth && CITY.blockRowZ > CITY.marketZ,
  `road ${ROAD.centreZ}, market ${CITY.marketZ}, blocks ${CITY.blockRowZ}`,
);
check(
  'the skyline is far enough back to read as distance',
  CITY.skylineZ > CITY.blockRowZ + 100,
  `skyline z ${CITY.skylineZ}`,
);
check(
  'the neighbours are the three to five storeys of the photographs',
  CITY.minStoreys >= 3 && CITY.maxStoreys <= 6,
  `${CITY.minStoreys} to ${CITY.maxStoreys} storeys`,
);
check(
  'the road is wide enough for two lanes',
  ROAD.laneOffsets.length === 2 &&
    ROAD.laneOffsets.every((o) => Math.abs(o) < ROAD.halfWidth),
  '',
);

// ---- the culling boundary ----
console.log('\nCulling');
check(
  'the plaza, the gate and the road are all outside',
  zoneAt(PLAZA.centreZ) === 'campus' &&
    zoneAt(COMPOUND.frontZ) === 'campus' &&
    zoneAt(ROAD.centreZ) === 'campus',
  '',
);
check(
  'the rotunda and everything behind it are inside',
  zoneAt(MEMORIAL.rotundaZ) === 'inside' && zoneAt(MEMORIAL.plinthBackZ) === 'inside',
  '',
);
check(
  'the boundary is the arch, so the flight crosses it exactly once',
  zoneAt(MEMORIAL.archZ + 0.1) === 'campus' && zoneAt(MEMORIAL.archZ - 0.1) === 'inside',
  `at z ${MEMORIAL.archZ}`,
);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);

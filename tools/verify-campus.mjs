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
import { HALL, SECTIONS } from '../apps/web/src/twin/layout.ts';
import { DEVICES } from '../apps/web/src/fleet/devices.ts';

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
let narrows = false;
let shortens = true;
for (let i = 0; i < bands.length; i++) {
  const b = bands[i];
  if (i > 0 && b.ax < bands[i - 1].ax - 1e-6) narrows = true;
  if (i > 0 && b.endAngle >= bands[i - 1].endAngle) shortens = false;
  for (let s = 0; s <= WING.segments; s++) {
    const a = b.startAngle + (b.endAngle - b.startAngle) * (s / WING.segments);
    maxX = Math.max(maxX, b.ax * Math.sin(a));
    const z = WING.centreZ + b.az * Math.cos(a);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
}
// The top of the stack is the riser standing on the highest tread, not the
// tread itself: each band's glazing climbs from its own tread to the next one in.
const topY = last.y + WING.bandRise;

check(
  'the stack leans outward as it rises, overhanging its plinth',
  !narrows && last.ax > first.ax,
  `${first.ax.toFixed(1)} m at the plinth out to ${last.ax.toFixed(1)} m at the top`,
);
check(
  'the stack overhangs the plinth it stands on',
  first.ax <= MEMORIAL.plinthHalfWidth && last.ax > MEMORIAL.plinthHalfWidth,
  `base ${first.ax.toFixed(1)} m on a ${MEMORIAL.plinthHalfWidth} m plinth, top ${last.ax.toFixed(1)} m`,
);
check(
  'the wing tapers along its length, tall at the rotunda and dying at its end',
  shortens,
  `arc ${first.endAngle.toFixed(2)} rad at the plinth, ${last.endAngle.toFixed(2)} at the top`,
);
check(
  'the stack is a wall, not a hillside: it rises faster than it spreads',
  WING.bands * WING.bandRise > last.ax - first.ax,
  `${(WING.bands * WING.bandRise).toFixed(1)} m up over ${(last.ax - first.ax).toFixed(1)} m out`,
);
check(
  'the memorial is about eighty metres across',
  maxX * 2 > 65 && maxX * 2 < 95,
  `${(maxX * 2).toFixed(1)} m`,
);
check(
  'the top band hands over to the page face rather than floating',
  Math.abs(last.ax - PAGE.outerX) < 2,
  `top band at x ${last.ax.toFixed(1)}, page edge at x ${PAGE.outerX}`,
);
// The page is the memorial seen from the air, and image15 is most of the brief.
// It has to dominate: a narrow strip of paper on a broad bank of glass is a
// grandstand, not a book.
check(
  'the page is the dominant surface, not a strip on top of the stack',
  PAGE.outerX - PAGE.innerX > (last.ax - first.ax) * 2,
  `${(PAGE.outerX - PAGE.innerX).toFixed(1)} m of page against ${(last.ax - first.ax).toFixed(1)} m of stack`,
);
check(
  'the page lies nearly flat, as an open page does',
  (PAGE.innerY - PAGE.outerY) / (PAGE.outerX - PAGE.innerX) < 0.25,
  `${(PAGE.innerY - PAGE.outerY).toFixed(1)} m of fall over ${(PAGE.outerX - PAGE.innerX).toFixed(1)} m`,
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
// The front tip of the lowest band is the part of a wing that reaches furthest
// forward, and the drum is what it has to stay behind. A wing that oversteps
// here appears to sprout from the entrance.
{
  const tipX = first.ax * Math.sin(first.startAngle);
  const tipZ = WING.centreZ + first.az * Math.cos(first.startAngle);
  const drumZ = Math.sqrt(Math.max(0, MEMORIAL.rotundaRadius ** 2 - tipX ** 2));
  check(
    'the wings tuck in behind the face of the drum',
    tipZ < drumZ,
    `wing tip at z ${tipZ.toFixed(1)}, drum face at z ${drumZ.toFixed(1)} for x ${tipX.toFixed(1)}`,
  );
}
check(
  'the wings stand on the plinth, front to back',
  maxZ < MEMORIAL.plinthFrontZ && minZ > MEMORIAL.plinthBackZ,
  `z ${maxZ.toFixed(1)} to ${minZ.toFixed(1)}, plinth ${MEMORIAL.plinthFrontZ} to ${MEMORIAL.plinthBackZ}`,
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
check(
  'the spine ridge starts above the interior, not through it',
  MEMORIAL.spineBaseY >= 12,
  `spine springs from ${MEMORIAL.spineBaseY} m`,
);
check(
  'the drum and its dome make up the rotunda',
  MEMORIAL.drumHeight + MEMORIAL.domeHeight > PAGE.innerY - 3 &&
    MEMORIAL.drumHeight > MEMORIAL.archHeight + 2,
  `drum ${MEMORIAL.drumHeight} m plus dome ${MEMORIAL.domeHeight} m`,
);
check(
  'the portal gap is wide enough to hold the arch',
  MEMORIAL.rotundaRadius * Math.sin(MEMORIAL.portalHalfAngle) >
    MEMORIAL.archHalfWidth + 1.5,
  `${(MEMORIAL.rotundaRadius * Math.sin(MEMORIAL.portalHalfAngle)).toFixed(1)} m half-width for a ${MEMORIAL.archHalfWidth} m arch`,
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

// ---- the interior, and where the thirteen devices stand in it ----
console.log('\nThe hall');

check(
  'the hall stands on the plinth',
  HALL.floorY === MEMORIAL.plinthY,
  `floor ${HALL.floorY} m, plinth ${MEMORIAL.plinthY} m`,
);
check(
  'the hall fits inside the building',
  HALL.back > MEMORIAL.plinthBackZ && HALL.halfWidth < WING.axBase,
  `back z ${HALL.back} of ${MEMORIAL.plinthBackZ}, half width ${HALL.halfWidth}`,
);
check(
  'the Preamble hangs on the wall opposite the entrance',
  HALL.galleryZ < HALL.back + 3 && HALL.galleryZ > HALL.back,
  `gallery z ${HALL.galleryZ}, back wall ${HALL.back}`,
);
for (const [name, section] of Object.entries(SECTIONS)) {
  check(
    `the ${name} section is inside the nave`,
    section.fromZ <= HALL.atriumBackZ && section.toZ > HALL.back,
    `z ${section.fromZ} to ${section.toZ}`,
  );
}

console.log('\nThe devices');

const HALF = { kiosk: 0.6, desk: 1.2, booth: 1.32, console: 1.0, totem: 0.6, wall: 1.5 };
const standing = DEVICES.filter((d) => d.form !== 'wall');

check('the roster is still thirteen', DEVICES.length === 13, `${DEVICES.length} devices`);
check(
  'every device stands on the floor, not on the ground',
  DEVICES.every((d) => d.position[1] >= HALL.floorY - 0.01),
  `lowest ${Math.min(...DEVICES.map((d) => d.position[1]))} m`,
);
check(
  'nothing stands on the centre aisle',
  standing.every((d) => Math.abs(d.position[0]) > 2.2),
  `nearest ${Math.min(...standing.map((d) => Math.abs(d.position[0]))).toFixed(1)} m off the axis`,
);
// A device turned away from the aisle shows its back to everyone who walks up
// to it. Two were moved across the hall and kept the heading they had on the
// other side, which is exactly the mistake this catches.
check(
  'every device faces the aisle rather than the wall behind it',
  standing.every((d) => {
    const heading = Math.sin(d.rotationY);
    return Math.abs(heading) < 0.1 || Math.sign(heading) !== Math.sign(d.position[0]);
  }),
  '',
);
check(
  'no device stands in the colonnade',
  standing.every(
    (d) =>
      Math.abs(Math.abs(d.position[0]) - HALL.colonnadeX) > (HALF[d.form] ?? 0.8) - 0.25,
  ),
  '',
);
{
  let closest = Infinity;
  let pair = '';
  for (let i = 0; i < DEVICES.length; i++) {
    for (let j = i + 1; j < DEVICES.length; j++) {
      const a = DEVICES[i];
      const b = DEVICES[j];
      const gap = Math.hypot(
        a.position[0] - b.position[0],
        a.position[2] - b.position[2],
      );
      if (gap < closest) {
        closest = gap;
        pair = `${a.deviceId} and ${b.deviceId}`;
      }
    }
  }
  check(
    'no two devices overlap',
    closest > 2.5,
    `closest ${pair}, ${closest.toFixed(1)} m`,
  );
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);

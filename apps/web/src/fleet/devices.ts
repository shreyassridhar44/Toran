/**
 * The thirteen devices in the hall, placed where they would physically stand.
 * Roster and roles follow PROJECT.md section 7.
 *
 * Positions are metres in **world** coordinates, not hall coordinates: x across
 * the nave (negative is the left wall), y up from the campus ground, z along
 * the nave (positive is the entrance). The rest of the interior is modelled with
 * its floor at zero and lifted onto the memorial's plinth when it is placed, but
 * these are absolute, because the fly-in reads them straight out of this list to
 * work out where to put the camera. `HALL.floorY` is therefore the floor here.
 *
 * The config shape is the shared DeviceConfig contract, so the fleet service in
 * step 10 can replace this list without the scene changing.
 */

import type { DeviceChannel, DeviceConfig, DeviceHealth } from '@toran/contracts';
import { HALL } from '../twin/layout';

/** Physical form, which decides the geometry the scene draws. */
export type DeviceForm = 'kiosk' | 'wall' | 'desk' | 'booth' | 'console' | 'totem';

export interface HallDevice extends DeviceConfig {
  readonly form: DeviceForm;
}

const Q = Math.PI / 4;

/**
 * The Timeline Wall panels hang with their centre at 1.6 m, so the 1.75 m
 * screen runs from 0.71 m to 2.49 m off the floor. Its bottom third, where the
 * time axis is dragged, then sits between 0.71 m and 1.30 m: waist height for
 * a standing adult and inside the 15 to 48 inch reach range for a visitor in
 * a wheelchair. They were at 3.1 m, where nobody could touch them.
 */
const WALL_CENTRE_Y = HALL.floorY + 1.6;

/** Floor level for everything that stands on it. */
const F = HALL.floorY;

/**
 * The atrium is the domed space under the rotunda, and the statue stands in a
 * well at the middle of it. Devices in that room are ranged around the wall,
 * clear of the balustrade: four of them used to stand where the well now is.
 */

export const DEVICES: readonly HallDevice[] = [
  {
    deviceId: 'dev-13',
    channel: 'entrance',
    form: 'totem',
    defaultLanguage: 'en',
    position: [-3.6, F, 9.4],
    rotationY: 0.35,
    version: 1,
  },
  {
    deviceId: 'dev-01',
    channel: 'reading',
    form: 'kiosk',
    defaultLanguage: 'en',
    position: [-9.5, F, 5.0],
    rotationY: Q * 0.9,
    version: 1,
  },
  {
    deviceId: 'dev-02',
    channel: 'reading',
    form: 'kiosk',
    defaultLanguage: 'mr',
    position: [-9.5, F, -4.0],
    rotationY: Q * 0.9,
    version: 1,
  },
  {
    deviceId: 'dev-03',
    channel: 'provenance',
    form: 'kiosk',
    defaultLanguage: 'en',
    position: [9.5, F, 5.0],
    rotationY: -Q * 0.9,
    version: 1,
  },
  {
    deviceId: 'dev-07',
    channel: 'manuscript',
    form: 'kiosk',
    defaultLanguage: 'en',
    position: [9.5, F, -4.0],
    rotationY: -Q * 0.9,
    version: 1,
  },
  {
    deviceId: 'dev-04',
    channel: 'timeline',
    form: 'wall',
    defaultLanguage: 'en',
    position: [-11.55, WALL_CENTRE_Y, -13],
    rotationY: Math.PI / 2,
    version: 1,
  },
  {
    deviceId: 'dev-05',
    channel: 'timeline',
    form: 'wall',
    defaultLanguage: 'hi',
    position: [-11.55, WALL_CENTRE_Y, -18],
    rotationY: Math.PI / 2,
    version: 1,
  },
  {
    deviceId: 'dev-06',
    channel: 'timeline',
    form: 'wall',
    defaultLanguage: 'mr',
    position: [-11.55, WALL_CENTRE_Y, -23],
    rotationY: Math.PI / 2,
    version: 1,
  },
  // Beside the processional line, not on it: the view from the door to the
  // Chaitya arch stays clear.
  {
    deviceId: 'dev-11',
    channel: 'assistant',
    form: 'desk',
    defaultLanguage: 'en',
    position: [5.5, F, -8.5],
    rotationY: -0.5,
    version: 1,
  },
  {
    deviceId: 'dev-08',
    channel: 'audio',
    form: 'booth',
    defaultLanguage: 'hi',
    position: [6.2, F, -12.5],
    rotationY: -0.55,
    version: 1,
  },
  // Staggered so the pair do not line up, and their plates do not stack, from the door.
  {
    deviceId: 'dev-09',
    channel: 'av',
    form: 'kiosk',
    defaultLanguage: 'en',
    position: [-5.7, F, -14.5],
    rotationY: Q * 0.7,
    version: 1,
  },
  {
    deviceId: 'dev-10',
    channel: 'av',
    form: 'kiosk',
    defaultLanguage: 'en',
    position: [-3.7, F, -19.6],
    rotationY: Q * 0.55,
    version: 1,
  },
  {
    deviceId: 'dev-12',
    channel: 'curator',
    form: 'console',
    defaultLanguage: 'en',
    position: [6.2, F, -19],
    rotationY: -0.5,
    version: 1,
  },
];

/**
 * Health fixture.
 *
 * This is NOT live data. Toran Core's fleet service does not exist until step
 * 10, so health comes from here. The fixture deliberately includes one idle and
 * one offline device, because the renderer has to handle every state a real
 * fleet will report, and a fixture where everything is green tests nothing.
 */
export function fixtureHealth(now: Date = new Date()): ReadonlyMap<string, DeviceHealth> {
  const iso = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60_000).toISOString();
  const map = new Map<string, DeviceHealth>();
  for (const d of DEVICES) {
    const offline = d.deviceId === 'dev-10';
    const idle = d.deviceId === 'dev-06';
    map.set(d.deviceId, {
      deviceId: d.deviceId,
      online: !offline,
      lastSeen: offline ? iso(11) : iso(0),
      configVersion: d.version,
      state: idle ? 'ambient' : 'subtle',
      uptimeSeconds: offline ? 0 : 6 * 3600 + d.deviceId.charCodeAt(5) * 97,
    });
  }
  return map;
}

export type DeviceStatus = 'online' | 'idle' | 'offline';

export function statusOf(health: DeviceHealth | undefined): DeviceStatus {
  if (health === undefined || !health.online) return 'offline';
  return health.state === 'ambient' ? 'idle' : 'online';
}

export const CHANNEL_ORDER: readonly DeviceChannel[] = [
  'entrance',
  'reading',
  'provenance',
  'manuscript',
  'timeline',
  'assistant',
  'audio',
  'av',
  'curator',
];

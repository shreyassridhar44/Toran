'use client';

/**
 * Delhi, beyond the compound wall.
 *
 * All of it is scenery: nothing out here is ever clicked, nothing is raycast,
 * and the whole group is culled the moment the visitor passes through the
 * entrance arch. It exists so the memorial sits in a city rather than on a
 * plane, which is most of the difference between a render and a place.
 */

import { Neighbourhood } from './Neighbourhood';
import { Road } from './Road';
import { Traffic } from './Traffic';

export function City() {
  return (
    <group>
      <Road />
      <Neighbourhood />
      <Traffic />
    </group>
  );
}

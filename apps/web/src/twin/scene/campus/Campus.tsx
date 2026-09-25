'use client';

/**
 * Everything inside the compound wall and outside the building.
 *
 * The campus and the memorial are separate things and are modelled separately:
 * the wall, the gate, the guard, the ring plaza, the Ashoka pillar, the mudra
 * walls and the park are the grounds; the open book standing in them is the
 * building. Conflating the two is what made the old twin a hall behind a
 * gateway with nothing around it.
 *
 * Rendered inside the exterior group, so all of it is culled the moment the
 * visitor passes through the arch.
 */

import { Compound } from './Compound';
import { Park } from './Park';
import { Pillar } from './Pillar';
import { Plaza } from './Plaza';

export function Campus() {
  return (
    <group>
      {/* Park first: its lawn is the ground everything else is drawn on. */}
      <Park />
      <Plaza />
      <Pillar />
      <Compound />
    </group>
  );
}

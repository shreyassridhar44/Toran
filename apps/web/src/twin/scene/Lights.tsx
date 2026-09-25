'use client';

/**
 * Five lights for the nave, chosen for a tablet: every standard material shades
 * every light, so the count is a direct cost and each one has to earn its place.
 *
 * A warm fill; the clerestory sun, which also sets the direction of the light
 * shafts; two downlights carrying the length of the room; and a lamp on the
 * Constitution gallery at the end of it.
 *
 * Three went. Two floodlights raked the Toran gateway, which now stands out on
 * the campus — and this rig lives inside the interior group, so they were lit
 * whenever the gateway was not and vice versa: they shaded every fragment in
 * the hall to illuminate something in another model. The third was a glow at
 * the old doorway, which is the atrium's job now and the atrium does it.
 *
 * The exhibit sections carry their own lights, because a reading lamp on a desk
 * and a spot on a painted backdrop are part of what those rooms look like
 * rather than general illumination.
 */

import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { HALL, SUN } from '../layout';

/** Wraps a spot or directional light and puts its target into the scene. */
function Aimed({
  light,
  target,
}: {
  light: React.ReactElement;
  target: [number, number, number];
}) {
  const holder = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const group = holder.current;
    if (group === null) return;
    const l = group.children.find(
      (c): c is THREE.SpotLight | THREE.DirectionalLight =>
        c instanceof THREE.SpotLight || c instanceof THREE.DirectionalLight,
    );
    if (l === undefined) return;
    // A light's target must be in the scene graph for its direction to update.
    l.target.position.set(...target);
    group.add(l.target);
    l.target.updateMatrixWorld();
  }, [target]);
  return <group ref={holder}>{light}</group>;
}

export function Lights() {
  return (
    <>
      {/* Warm fill, and a great deal of it. The nave is twenty-eight metres,
          its floor and ceiling are near black by design, and ACES tone mapping
          over a vignette takes another bite: at the old 1.3 the far half of the
          room was not dim, it was invisible. */}
      <hemisphereLight args={['#9c8f7c', '#26221c', 3.4]} />
      <Aimed
        target={[...SUN.to]}
        light={
          <directionalLight position={[...SUN.from]} intensity={1.7} color="#ffd8a8" />
        }
      />
      {/*
        Two lamps along the nave, hung between the columns.
        
        Point lights, not spots. A spot at penumbra 0.95 puts all but the
        innermost twentieth of its cone into falloff, so the first version lit
        a disc of floor directly under itself and left the exhibits along the
        walls — which is every exhibit — in the dark. A point light has no cone
        to fall off.
        
        Two carry the room. A row of eight would carry it no better and cost
        six more lights on every fragment in it.
      */}
      {[-17, -28].map((z) => (
        <pointLight
          key={z}
          position={[0, 8.6, z]}
          intensity={900}
          distance={34}
          decay={2}
          color="#ffd9a6"
        />
      ))}
      <Aimed
        target={[0, 4.6, HALL.galleryZ]}
        light={
          <spotLight
            position={[0, 11.2, HALL.galleryZ + 7]}
            angle={0.44}
            penumbra={0.75}
            intensity={420}
            distance={30}
            decay={2}
            color="#ffe3bd"
          />
        }
      />
    </>
  );
}

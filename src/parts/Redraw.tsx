// Inside a <ThreeCanvas>: draw the scene again when something that was loading has arrived (a model, textures).
// @remotion/three only draws when the frame changes, so on a still (or a frozen frame of a sheet) a model that
// finishes loading after the first draw would never be painted. Put <Redraw when={model} /> next to your meshes.
import React, {useEffect} from 'react';
import {useThree} from '@react-three/fiber';

export const Redraw: React.FC<{when: unknown}> = ({when}) => {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    if (when) advance(performance.now());
  }, [when, advance]);
  return null;
};

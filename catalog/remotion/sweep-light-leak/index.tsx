// Light leak over a hard cut (@remotion/light-leaks).
import React from 'react';
import {LightLeak} from '@remotion/light-leaks';
import {SceneProps} from '../../../src/catalog/ui';

const SweepLightLeak: React.FC<SceneProps> = ({it, dur, W, H}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', mixBlendMode: 'screen', opacity: Number(it.strength ?? 0.55), pointerEvents: 'none'}}>
    <LightLeak durationInFrames={dur} seed={Number(it.seed ?? 3)} hueShift={(((Number(it.hue ?? 14) % 360) + 360) % 360)} />
  </div>
);
export default SweepLightLeak;

// Curtains of light: the `shaders` Aurora preset as a frame-locked background (src/adapters/Shader.tsx).
import React from 'react';
import {ShaderLayer} from '../../../src/adapters/Shader';
import {HUE, SceneProps, hueOf} from '../../../src/catalog/ui';

const BgAurora: React.FC<SceneProps> = ({it, st, W, H}) => {
  const a = hueOf(it, HUE.teal), b = hueOf(it, st.accent, 'color2');
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: st.bg}}>
      <ShaderLayer w={W} h={H} opacity={Number(it.strength ?? 0.5)} preset={{components: [{type: 'Aurora', props: {colorA: a, colorB: b, colorC: st.bg2, intensity: 70, curtainCount: 3, speed: Number(it.speed ?? 3), waviness: 40, rayDensity: 14, height: 110, center: {x: 0.5, y: Number(it.y ?? 0.1)}}}]}} />
    </div>
  );
};
export default BgAurora;

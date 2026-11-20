// Dark stone: slow veins of light in black marble (the `shaders` Marble preset, frame-locked).
import React from 'react';
import {ShaderLayer} from '../../../src/adapters/Shader';
import {SceneProps, hueOf} from '../../../src/catalog/ui';

const BgMarble: React.FC<SceneProps> = ({it, st, W, H}) => {
  const c = hueOf(it, st.accent);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: st.bg}}>
      <ShaderLayer w={W} h={H} opacity={Number(it.strength ?? 0.2)} preset={{components: [{type: 'Marble', props: {colorA: c, colorB: st.bg2, colorC: st.bg, scale: 1.1, turbulence: 6, speed: Number(it.speed ?? 0.05)}}]}} />
    </div>
  );
};
export default BgMarble;

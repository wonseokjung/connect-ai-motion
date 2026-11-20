// Flowing gradient: a `shaders` preset as a frame-locked background (src/adapters/Shader.tsx).
import React from 'react';
import {ShaderLayer} from '../../../src/adapters/Shader';
import {SceneProps, hueOf} from '../../../src/catalog/ui';

const BgFlow: React.FC<SceneProps> = ({it, st, W, H}) => {
  const c = hueOf(it, st.accent);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: st.bg}}>
      <ShaderLayer w={W} h={H} opacity={Number(it.strength ?? 0.55)} preset={{components: [{type: 'FlowingGradient', props: {colorA: st.bg, colorB: st.bg2, colorC: c, colorD: st.bg, speed: Number(it.speed ?? 0.5), distortion: 0.6}}]}} />
    </div>
  );
};
export default BgFlow;

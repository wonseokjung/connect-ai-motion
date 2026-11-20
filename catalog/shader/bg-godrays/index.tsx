// God rays: a `shaders` preset as a frame-locked background (src/adapters/Shader.tsx).
import React from 'react';
import {ShaderLayer} from '../../../src/adapters/Shader';
import {SceneProps, hueOf} from '../../../src/catalog/ui';

const BgGodrays: React.FC<SceneProps> = ({it, st, W, H}) => {
  const c = hueOf(it, st.accent);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: st.bg}}>
      <ShaderLayer w={W} h={H} opacity={Number(it.strength ?? 0.7)} preset={{components: [{type: 'Godrays', props: {center: {x: Number(it.x ?? 1), y: Number(it.y ?? 0)}, rayColor: c, backgroundColor: st.bg, density: 0.3, intensity: 0.6, spotty: 0.4, speed: 0.4}}]}} />
    </div>
  );
};
export default BgGodrays;

// Liquid colour: a slow mesh gradient in the film's dark base and two subject colours
// (the `shaders` MeshGradient preset, frame-locked).
import React from 'react';
import {ShaderLayer} from '../../../src/adapters/Shader';
import {HUE, SceneProps, hueOf} from '../../../src/catalog/ui';

const BgMesh: React.FC<SceneProps> = ({it, st, W, H}) => {
  const a = hueOf(it, HUE.indigo), b = hueOf(it, st.accent, 'color2');
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: st.bg}}>
      <ShaderLayer w={W} h={H} opacity={Number(it.strength ?? 0.42)} preset={{components: [{type: 'MeshGradient', props: {colorA: st.bg, colorB: a, count: 5, smoothness: 2.4, variation: 0.4, swirl: 0.35, drift: 0.5, speed: Number(it.speed ?? 0.6)}}, {type: 'MeshGradient', props: {colorA: '#00000000', colorB: b, count: 3, smoothness: 3, variation: 0.3, swirl: 0.2, drift: 0.4, speed: Number(it.speed ?? 0.6) * 0.7, seed: 4, opacity: 0.35}}]}} />
    </div>
  );
};
export default BgMesh;

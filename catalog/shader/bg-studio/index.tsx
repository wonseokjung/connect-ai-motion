// Studio wall: a dark backdrop with a key light, a fill and a back light that breathe slowly
// (the `shaders` StudioBackground preset, frame-locked). The look of a night set.
import React from 'react';
import {ShaderLayer} from '../../../src/adapters/Shader';
import {SceneProps, hueOf} from '../../../src/catalog/ui';

const BgStudio: React.FC<SceneProps> = ({it, st, W, H}) => {
  const c = hueOf(it, st.accent);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: st.bg}}>
      <ShaderLayer w={W} h={H} opacity={Number(it.strength ?? 0.9)} preset={{components: [{type: 'StudioBackground', props: {color: String(it.wall || '#2A2119'), keyColor: c, keyIntensity: 100, keySoftness: 72, fillColor: st.ink, fillIntensity: 24, fillSoftness: 80, fillAngle: 60, backColor: c, backIntensity: 80, backSoftness: 85, brightness: 30, vignette: 26, center: {x: Number(it.x ?? 0.5), y: Number(it.y ?? 0.72)}, ambientIntensity: 60, ambientSpeed: Number(it.speed ?? 2)}}]}} />
    </div>
  );
};
export default BgStudio;

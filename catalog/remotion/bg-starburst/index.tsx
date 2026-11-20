// Slow rays (@remotion/starburst).
import React from 'react';
import {Starburst} from '@remotion/starburst';
import {SceneProps, hueOf} from '../../../src/catalog/ui';

const BgStarburst: React.FC<SceneProps> = ({it, lf, st, W, H}) => {
  const c = hueOf(it, st.accent);
  const x = Number(it.x ?? 50), y = Number(it.y ?? 60);
  const S = Math.max(W, H) * 1.5;
  const mask = `radial-gradient(closest-side, #000 20%, transparent 100%)`;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: st.bg}}>
      <div style={{position: 'absolute', left: (W * x) / 100 - S / 2, top: (H * y) / 100 - S / 2, width: S, height: S, opacity: Number(it.strength ?? 0.35), WebkitMaskImage: mask, maskImage: mask}}>
        <Starburst rays={18} colors={[c, st.bg]} rotation={lf * 0.12} smoothness={0.35} vignette={0.2} />
      </div>
    </div>
  );
};
export default BgStarburst;

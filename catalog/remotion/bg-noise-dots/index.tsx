// Breathing dots (@remotion/noise).
import React from 'react';
import {noise3D} from '@remotion/noise';
import {SceneProps, hueOf} from '../../../src/catalog/ui';

const BgNoiseDots: React.FC<SceneProps> = ({it, lf, st, W, H, u}) => {
  const c = hueOf(it, st.accent);
  const step = 54 * u, nx = Math.ceil(W / step) + 1, ny = Math.ceil(H / step) + 1, t = lf / 150;
  const dots: React.ReactNode[] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const n = noise3D('fm-dots', i * 0.11, j * 0.11, t);
      const k = (n + 1) / 2;
      dots.push(<circle key={`${i}-${j}`} cx={i * step + step / 2} cy={j * step + step / 2} r={(1.2 + k * 3.6) * u} fill={k > 0.72 ? c : st.ink} fillOpacity={k > 0.72 ? 0.8 : 0.06 + k * 0.16} />);
    }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: st.bg}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>{dots}</svg>
    </div>
  );
};
export default BgNoiseDots;

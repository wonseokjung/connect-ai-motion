// Contour lines: rows of points pushed up and down by 3D noise that moves slowly in time (@remotion/noise).
import React from 'react';
import {noise3D} from '@remotion/noise';
import {SceneProps, hexA, hueOf} from '../../../src/catalog/ui';

const BgNoiseContour: React.FC<SceneProps> = ({it, lf, st, W, H, u}) => {
  const c = hueOf(it, st.accent);
  const s = Number(it.strength ?? 0.5);
  const rows = 22, cols = 64, t = lf / 260;
  const lines: string[] = [];
  for (let j = 0; j < rows; j++) {
    const y0 = (H * (j + 0.5)) / rows;
    let d = '';
    for (let i = 0; i <= cols; i++) {
      const x = (W * i) / cols;
      const n = noise3D('fm-contour', (i / cols) * 2.6, (j / rows) * 3.2, t);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(y0 + n * 62 * u).toFixed(1)} `;
    }
    lines.push(d);
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: `radial-gradient(ellipse 80% 70% at 50% 50%, ${st.bg2} 0%, ${st.bg} 72%)`}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {lines.map((d, j) => <path key={j} d={d} fill="none" stroke={j % 5 === 2 ? hexA(c, 0.5 * s + 0.1) : st.ink} strokeOpacity={j % 5 === 2 ? 1 : 0.05 + 0.1 * s} strokeWidth={Math.max(1, 1.2 * u)} />)}
      </svg>
    </div>
  );
};
export default BgNoiseContour;

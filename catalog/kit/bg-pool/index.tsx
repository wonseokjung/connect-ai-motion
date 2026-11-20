// Light pool: a soft radial light and a faint drifting grid. Ours.
import React from 'react';
import {SceneProps, hexA, hueOf} from '../../../src/catalog/ui';

const BgPool: React.FC<SceneProps> = ({it, lf, st, W, H, u}) => {
  const c = hueOf(it, st.accent);
  const x = Number(it.x ?? 50) + Math.sin(lf / 90) * 3, y = Number(it.y ?? 56) + Math.cos(lf / 120) * 2;
  const step = 96 * u, off = (lf * 0.12 * u) % step;
  const nx = Math.ceil(W / step) + 2, ny = Math.ceil(H / step) + 2;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: `radial-gradient(ellipse 70% 62% at ${x}% ${y}%, ${hexA(c, 0.17)} 0%, ${hexA(c, 0.05)} 46%, transparent 76%), ${st.bg}`}}>
      <svg width={W} height={H} style={{position: 'absolute', opacity: 0.07}}>
        {Array.from({length: nx}, (_, i) => <line key={'v' + i} x1={i * step - off} y1={0} x2={i * step - off} y2={H} stroke={st.ink} strokeWidth={1} />)}
        {Array.from({length: ny}, (_, i) => <line key={'h' + i} x1={0} y1={i * step - off * 0.5} x2={W} y2={i * step - off * 0.5} stroke={st.ink} strokeWidth={1} />)}
      </svg>
    </div>
  );
};
export default BgPool;

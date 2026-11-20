// Brand card: wide-tracked small name (scramble in), thin gold rule, one quiet line. Ours.
import React from 'react';
import {Box, SceneProps, Scramble, caps, fit, k01} from '../../../src/catalog/ui';

const Ident: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const name = String(it.text || '').toUpperCase();
  const sub = String(it.sub || '');
  const track = 0.42;
  const fs = fit(name, r[2] * (tall ? 0.96 : 0.62), 58 * u, st.heavy, track);
  const w = Math.min(r[2] * 0.9, name.length * fs * (0.62 + track));
  const cy = r[3] / 2;
  const rule = k01(lf, 8, 30);
  const subAt = Math.max(16, Math.round(dur * 0.4));
  const fs2 = fit(sub.toUpperCase(), r[2] * 0.9, 28 * u, st.heavy, 0.3);
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: 0, right: 0, top: cy - fs * 1.5, textAlign: 'center', ...caps(st, fs, ink), letterSpacing: `${track}em`, paddingLeft: `${track}em`}}>
        <Scramble text={name} lf={lf} start={2} frames={16} />
      </div>
      <div style={{position: 'absolute', left: (r[2] - w * rule) / 2, top: cy + 6 * u, width: w * rule, height: Math.max(1.5, 2 * u), background: st.accent}} />
      {sub && <div style={{position: 'absolute', left: 0, right: 0, top: cy + 36 * u, textAlign: 'center', ...caps(st, fs2, st.dim), letterSpacing: '0.3em', paddingLeft: '0.3em', opacity: k01(lf, subAt, subAt + 12), transform: `translateY(${(1 - k01(lf, subAt, subAt + 14)) * 10 * u}px)`}}>{sub}</div>}
    </Box>
  );
};
export default Ident;

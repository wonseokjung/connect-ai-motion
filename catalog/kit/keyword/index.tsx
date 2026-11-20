// Key word: as big as the frame allows, words come into focus one by one. Ours.
import React from 'react';
import {Box, SceneProps, Words, caps, fit, fitLines, hueOf, k01, type} from '../../../src/catalog/ui';

const Keyword: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const sub = String(it.sub || '');
  const {fs, lines} = fitLines(text, r[2] * 0.96, r[3] * (tall ? 0.42 : 0.56), tall ? 3 : 2, st.weight, st.tracking);
  const h = lines.length * fs * 1.1;
  const top = (r[3] - h) / 2 - (sub ? 22 * u : 0);
  const fs2 = fit(sub.toUpperCase(), r[2] * 0.8, 30 * u, st.heavy, 0.24);
  let n = 0;
  return (
    <Box r={r}>
      {lines.map((l, i) => {
        const start = 2 + n * 3;
        n += l.split(/\s+/).length;
        return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: top + i * fs * 1.1, textAlign: 'center', ...type(st, fs, hueOf(it, ink))}}><Words text={l} lf={lf} start={start} /></div>;
      })}
      {sub && (
        <div style={{position: 'absolute', left: 0, right: 0, top: top + h + 26 * u, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 * u, opacity: k01(lf, 14, 26)}}>
          <div style={{width: 34 * u * k01(lf, 14, 30), height: Math.max(1.5, 2 * u), background: st.accent}} />
          <div style={{...caps(st, fs2, st.dim)}}>{sub}</div>
        </div>
      )}
    </Box>
  );
};
export default Keyword;

// Quote: a sentence on up to four lines, a gold bar, the speaker. Ours.
import React from 'react';
import {Box, SceneProps, Words, caps, fitLines, k01, type} from '../../../src/catalog/ui';

const Quote: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const by = String(it.by || '');
  const bar = 26 * u;
  const {fs, lines} = fitLines(text, r[2] * 0.9 - bar * 2, r[3] * (tall ? 0.5 : 0.62), tall ? 6 : 4, st.weight, st.tracking, 1.2);
  const h = lines.length * fs * 1.2;
  const top = (r[3] - h) / 2 - (by ? 20 * u : 0);
  let n = 0;
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: 0, top, width: Math.max(2, 4 * u), height: h * k01(lf, 0, 22), background: st.accent}} />
      {lines.map((l, i) => {
        const start = 3 + n * 3;
        n += l.split(/\s+/).length;
        return <div key={i} style={{position: 'absolute', left: bar * 2, top: top + i * fs * 1.2, ...type(st, fs, ink)}}><Words text={l} lf={lf} start={start} hi={String(it.hi || '')} hiColor={st.accentHi} /></div>;
      })}
      {by && <div style={{position: 'absolute', left: bar * 2, top: top + h + 30 * u, ...caps(st, 28 * u, st.dim), opacity: k01(lf, 8 + n * 3, 20 + n * 3)}}>{by}</div>}
    </Box>
  );
};
export default Quote;

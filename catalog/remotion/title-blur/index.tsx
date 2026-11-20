// Headline: fitted to the frame with @remotion/layout-utils, words come out of a blur.
import React from 'react';
import {Box, SceneProps, Scramble, Words, caps, fitLines, k01, type} from '../../../src/catalog/ui';

const TitleBlur: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const sub = String(it.sub || '').toUpperCase();
  const {fs, lines} = fitLines(text, r[2] * 0.98, r[3] * (tall ? 0.5 : 0.6), tall ? 4 : 2, st.weight, st.tracking, 1.08);
  const h = lines.length * fs * 1.08;
  const top = (r[3] - h) / 2 + (sub ? 22 * u : 0);
  let n = 0;
  return (
    <Box r={r}>
      {sub && (
        <div style={{position: 'absolute', left: 0, top: top - 64 * u, display: 'flex', alignItems: 'center', gap: 18 * u}}>
          <div style={{width: 44 * u * k01(lf, 0, 16), height: Math.max(1.5, 2 * u), background: st.accent}} />
          <div style={{...caps(st, 28 * u, st.accentHi)}}><Scramble text={sub} lf={lf} start={2} frames={12} /></div>
        </div>
      )}
      {lines.map((l, i) => {
        const start = 4 + n * 3;
        n += l.split(/\s+/).length;
        return <div key={i} style={{position: 'absolute', left: -fs * 0.04, top: top + i * fs * 1.08, ...type(st, fs, ink), lineHeight: 1.08}}><Words text={l} lf={lf} start={start} hi={String(it.hi || '')} hiColor={st.accentHi} /></div>;
      })}
    </Box>
  );
};
export default TitleBlur;

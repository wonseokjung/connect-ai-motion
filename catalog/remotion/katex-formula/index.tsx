// Formula (KaTeX). The fonts come with the katex package; the scene waits until they are loaded.
import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {Box, SceneProps, fit, hueOf, k01, type} from '../../../src/catalog/ui';

const KatexFormula: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const tex = String(it.tex || '');
  const html = useMemo(() => katex.renderToString(tex, {throwOnError: false, displayMode: true}), [tex]);
  const [h] = useState(() => delayRender('katex fonts'));
  useEffect(() => {
    const done = () => continueRender(h);
    const fonts = (document as any).fonts;
    if (fonts?.load) Promise.all([fonts.load('20px KaTeX_Main'), fonts.load('italic 20px KaTeX_Math')]).then(done, done);
    else done();
  }, [h]);
  // size: KaTeX is about 0.5 em per character of source at this level of formula; cap by height
  const plain = tex.replace(/\\[a-zA-Z]+|[{}^_]/g, '').length || 6;
  const fs = Math.min((r[2] * 0.92) / (plain * 0.5), r[3] * (tall ? 0.16 : 0.26));
  const label = String(it.text || '');
  const lfs = fit(label, r[2] * 0.9, 44 * u, 300, st.tracking);
  const k = k01(lf, 2, 22);
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: 0, right: 0, top: r[3] * 0.5 - fs * 1.1 - (label ? 30 * u : 0), textAlign: 'center', fontSize: fs, color: hueOf(it, ink), opacity: k, filter: k < 1 ? `blur(${(1 - k) * 12}px)` : undefined, transform: `translateY(${(1 - k) * 20 * u}px)`}} dangerouslySetInnerHTML={{__html: html}} />
      <div style={{position: 'absolute', left: (r[2] - 80 * u * k01(lf, 14, 30)) / 2, top: r[3] * 0.5 + fs * 0.75, width: 80 * u * k01(lf, 14, 30), height: Math.max(1.5, 2 * u), background: st.accent}} />
      {label && <div style={{position: 'absolute', left: 0, right: 0, top: r[3] * 0.5 + fs * 0.75 + 30 * u, textAlign: 'center', ...type(st, lfs, st.dim, 300), opacity: k01(lf, 20, 34)}}>{label}</div>}
    </Box>
  );
};
export default KatexFormula;

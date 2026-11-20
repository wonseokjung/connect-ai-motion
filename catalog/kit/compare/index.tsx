// Before / after: two halves, the second lights up at the "swap" cue. Ours.
import React from 'react';
import {Box, SceneProps, Words, caps, cueAt, fitLines, hexA, hueOf, k01, type} from '../../../src/catalog/ui';

const Compare: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const a = String(it.text || ''), b = String(it.sub || '');
  const col = hueOf(it, st.accent);
  const swap = cueAt(it, 'swap', Math.round(dur * 0.45));
  const gap = 28 * u;
  const w = tall ? r[2] : (r[2] - gap) / 2, h = tall ? (r[3] * 0.8 - gap) / 2 : r[3] * 0.62;
  const y0 = tall ? r[3] * 0.1 : (r[3] - h) / 2;
  const on = k01(lf, swap, swap + 14);
  const card = (i: number, text: string, label: string, lit: number) => {
    const x = tall ? 0 : i * (w + gap), y = tall ? y0 + i * (h + gap) : y0;
    const {fs, lines} = fitLines(text, w * 0.8, h * 0.5, 2, st.weight, st.tracking);
    const k = i === 0 ? k01(lf, 0, 12) : k01(lf, 6, 18);
    const off = i === 0 ? on : 0;
    return (
      <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: st.radius * u, border: `${Math.max(1, 1.5 * u)}px solid ${i === 1 ? hexA(col, 0.25 + 0.75 * lit) : st.cardLine}`, background: i === 1 ? hexA(col, 0.04 + 0.1 * lit) : st.card, opacity: k * (1 - off * 0.45), transform: `translateY(${(1 - k) * 22 * u}px)`}}>
        {label && <div style={{position: 'absolute', left: w * 0.1, top: h * 0.13, ...caps(st, 26 * u, i === 1 ? hexA(col, 0.5 + 0.5 * lit) : st.dim)}}>{label}</div>}
        <div style={{position: 'absolute', left: w * 0.1, top: h * 0.36}}>
          {lines.map((l, j) => (
            <div key={j} style={{...type(st, fs, i === 1 ? (lit > 0.5 ? col : st.dim) : ink), position: 'relative'}}>
              {i === 1 ? <Words text={l} lf={lf} start={swap - 2 + j * 4} /> : l}
              {i === 0 && <div style={{position: 'absolute', left: -fs * 0.04, top: '54%', width: `${on * 104}%`, height: Math.max(2, 3 * u), background: st.accent}} />}
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <Box r={r}>
      {card(0, a, String(it.label || ''), 0)}
      {card(1, b, String(it.label2 || ''), on)}
    </Box>
  );
};
export default Compare;

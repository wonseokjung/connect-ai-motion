// Letters as objects: each one falls, lands on the floor line with a bounce and a small tilt, and settles. Ours.
import React from 'react';
import {Box, SceneProps, caps, fit, hexA, hueOf, k01, measure, type} from '../../../src/catalog/ui';
import {random} from 'remotion';

// height above the floor (1 = start height) t frames after release: a fall and two smaller bounces
const bounce = (t: number) => {
  if (t <= 0) return 1;
  const a = 14, b = 9, c = 6; // frames of the fall, first bounce, second bounce
  if (t < a) return 1 - (t / a) * (t / a);
  if (t < a + b) { const x = (t - a) / b; return 0.16 * 4 * x * (1 - x); }
  if (t < a + b + c) { const x = (t - a - b) / c; return 0.05 * 4 * x * (1 - x); }
  return 0;
};

const TypeDrop: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const words = text.split(/\s+/).filter(Boolean);
  const lines = tall && words.length > 1 ? words : [text];
  const hi = String(it.hi || '').toLowerCase();
  const col = hueOf(it, st.accent);
  const weight = 300;
  const fs = Math.min(...lines.map((l) => fit(l, r[2] * 0.96, (tall ? 300 : 340) * u, weight, st.tracking)), (r[3] * 0.62) / lines.length);
  const lh = fs * 1.04;
  const floor = r[3] * (tall ? 0.62 : 0.66) + ((lines.length - 1) * lh) / 2;
  const sub = String(it.sub || '');
  let n = 0;
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: 0, top: floor + fs * 0.06, width: r[2] * k01(lf, 0, 20), height: Math.max(1.5, 2 * u), background: hexA(st.ink, 0.28)}} />
      {lines.map((l, li) => {
        const w = measure(l, fs, weight, st.tracking);
        let x = (r[2] - w) / 2;
        const base = floor - (lines.length - 1 - li) * lh;
        const on = hi && l.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '') === hi;
        return [...l].map((ch, i) => {
          const cw = measure(ch === ' ' ? 'n' : ch, fs, weight, 0) + fs * st.tracking;
          const left = x;
          x += ch === ' ' ? fs * 0.28 : cw;
          if (ch === ' ') return null;
          const k = n++;
          const t = lf - 3 - k * 2.2 - li * 4;
          const h = bounce(t);
          const tilt = (random(`td-${text}-${k}`) - 0.5) * 34;
          const settle = k01(t, 14, 34);
          const hiWord = hi && words.some((wd) => wd.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === hi && l.toLowerCase().indexOf(wd.toLowerCase()) <= i && i < l.toLowerCase().indexOf(wd.toLowerCase()) + wd.length);
          return (
            <React.Fragment key={`${li}-${i}`}>
              <div style={{position: 'absolute', left: left + cw * 0.1, top: floor + fs * 0.07, width: cw * 0.8, height: fs * 0.05, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', opacity: (1 - h) * (li === lines.length - 1 ? 1 : 0), transform: `scaleX(${1 - h * 0.5})`}} />
              <div style={{position: 'absolute', left, top: base - fs * 0.98 - h * (r[3] * 0.9 + base), ...type(st, fs, on || hiWord ? col : ink, weight), lineHeight: 1, transformOrigin: '50% 90%', transform: `rotate(${tilt * (1 - settle)}deg) scaleY(${t >= 14 && t < 18 ? 0.9 : 1})`, opacity: t < 0 ? 0 : 1}}>{ch}</div>
            </React.Fragment>
          );
        });
      })}
      {sub && <div style={{position: 'absolute', left: 0, right: 0, top: floor + fs * 0.22, textAlign: 'center', ...caps(st, 28 * u, st.dim), opacity: k01(lf, 30, 44)}}>{sub}</div>}
    </Box>
  );
};
export default TypeDrop;

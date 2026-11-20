// 1 · 2 · 3 steps. Ours.
import React from 'react';
import {Box, SceneProps, caps, fit, itemAt, itemText, itemsOf, k01, mix, type} from '../../../src/catalog/ui';

const Steps: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const items = itemsOf(it).slice(0, 5).map(itemText);
  const n = Math.max(1, items.length);
  const head = String(it.text || '');
  const at = items.map((_, i) => itemAt(it, i, n, dur, fps));
  const newest = at.reduce((best, f, i) => (lf >= f ? i : best), -1);
  const cellW = tall ? r[2] : r[2] / n, cellH = tall ? Math.min((r[3] * 0.86) / n, r[3] * 0.24) : r[3] * 0.6;
  const top0 = tall ? r[3] * 0.1 : r[3] * 0.24;
  const numFs = Math.min(tall ? cellH * 0.5 : cellH * 0.56, cellW * 0.42);
  const labFs = Math.min(...items.map((t) => fit(t, cellW * (tall ? 0.62 : 0.84), tall ? cellH * 0.3 : 60 * u, 300, st.tracking)));
  return (
    <Box r={r}>
      {head && <div style={{position: 'absolute', left: 0, top: tall ? 0 : r[3] * 0.08, ...caps(st, 28 * u, st.accentHi), opacity: k01(lf, 0, 12)}}>{head}</div>}
      {items.map((t, i) => {
        const k = k01(lf, at[i], at[i] + 14);
        const dim = i === newest || newest < 0 ? 1 : 0.5;
        const x = tall ? 0 : i * cellW, y = tall ? top0 + i * cellH : top0;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: cellW, height: cellH, opacity: k * mix(1, dim, k01(lf, at[i] + 14, at[i] + 26)), transform: `translateY(${(1 - k) * 26 * u}px)`}}>
            {(tall ? i > 0 : i > 0) && <div style={{position: 'absolute', left: 0, top: tall ? 0 : cellH * 0.08, width: tall ? cellW * k : Math.max(1, 1.5 * u), height: tall ? Math.max(1, 1.5 * u) : cellH * 0.84 * k, background: st.faint}} />}
            <div style={{position: 'absolute', left: tall ? 0 : cellW * 0.08, top: tall ? cellH * 0.2 : 0, ...type(st, numFs, st.accent, 200), fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{position: 'absolute', left: tall ? numFs * 1.5 : cellW * 0.08, top: tall ? cellH * 0.2 + (numFs - labFs * 1.15) / 2 : numFs * 1.18, ...type(st, labFs, ink, 300)}}>{t}</div>
          </div>
        );
      })}
    </Box>
  );
};
export default Steps;

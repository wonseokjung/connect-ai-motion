// Wall of cards. Ours.
import React from 'react';
import {Box, SceneProps, SNAP, fit, hexA, hueOf, itemAt, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';

const GridWall: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const items = itemsOf(it).slice(0, 12).map(itemText);
  const n = Math.max(1, items.length);
  const cols = tall ? (n > 6 ? 2 : 1) : n <= 4 ? 2 : n <= 6 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const gap = 22 * u;
  const cw = (r[2] - gap * (cols - 1)) / cols, ch = Math.min((r[3] - gap * (rows - 1)) / rows, cw * (tall ? 0.5 : 0.86));
  const y0 = (r[3] - rows * ch - (rows - 1) * gap) / 2;
  const col = hueOf(it, st.accent);
  const hi = String(it.hi || '').toLowerCase();
  const fs = Math.min(...items.map((t) => fit(t, cw * 0.8, ch * 0.3, 300, st.tracking)));
  return (
    <Box r={r}>
      {items.map((t, i) => {
        const f = itemAt(it, i, n, dur, fps);
        const k = k01(lf, f, f + 12, SNAP), o = k01(lf, f, f + 6);
        const on = hi && t.toLowerCase() === hi ? k01(lf, itemAt(it, n - 1, n, dur, fps) + 10, itemAt(it, n - 1, n, dur, fps) + 24) : 0;
        return (
          <div key={i} style={{position: 'absolute', left: (i % cols) * (cw + gap), top: y0 + Math.floor(i / cols) * (ch + gap), width: cw, height: ch, borderRadius: st.radius * u, border: `${Math.max(1, 1.5 * u)}px solid ${on ? hexA(col, 0.3 + 0.7 * on) : st.cardLine}`, background: on ? hexA(col, 0.14 * on) : st.card, opacity: o, transform: `scale(${0.9 + 0.1 * k})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...type(st, fs, on > 0.5 ? col : ink, 300)}}>{t}</span>
          </div>
        );
      })}
    </Box>
  );
};
export default GridWall;

// Up and down: rows of a word and an arrow that draws up or down. Ours.
import React from 'react';
import {Box, SceneProps, fit, hueOf, itemAt, itemText, itemsOf, k01, measure, type} from '../../../src/catalog/ui';

const Trend: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const rows = itemsOf(it).slice(0, 4);
  const n = Math.max(1, rows.length);
  const up = hueOf(it, '#3FB7A6'), down = hueOf(it, st.accentHi, 'color2');
  const rowH = Math.min((r[3] * 0.92) / n, r[3] * (tall ? 0.2 : 0.3));
  const y0 = (r[3] - rowH * n) / 2;
  const arrow = rowH * 0.62;
  const fs = Math.min(...rows.map((x) => fit(itemText(x), r[2] * (tall ? 0.94 : 0.62) - arrow * 1.6, rowH * 0.62, st.weight, st.tracking)));
  const newest = rows.reduce((b, _, i) => (lf >= itemAt(it, i, n, dur, fps) ? i : b), -1);
  const widest = Math.max(...rows.map((x) => measure(itemText(x) + (x?.sub ? ' ' + x.sub : ''), fs, st.weight, st.tracking)));
  const x0 = Math.max(0, (r[2] - (arrow * 1.5 + widest)) / 2);
  return (
    <Box r={r}>
      {rows.map((x, i) => {
        const f = itemAt(it, i, n, dur, fps);
        const k = k01(lf, f, f + 14), a = k01(lf, f + 4, f + 22);
        const isUp = String(x?.dir || 'up') === 'up';
        const c = isUp ? up : down;
        const y = y0 + i * rowH;
        const len = arrow * 0.8 * a;
        return (
          <div key={i} style={{position: 'absolute', left: x0, top: y, height: rowH, width: r[2] - x0, opacity: k * (i === newest ? 1 : 0.6), transform: `translateX(${(1 - k) * -24 * u}px)`}}>
            <svg width={arrow} height={arrow} viewBox="0 0 100 100" style={{position: 'absolute', left: 0, top: (rowH - arrow) / 2, overflow: 'visible'}}>
              <g transform={isUp ? undefined : 'scale(1,-1) translate(0,-100)'}>
                <line x1={50} y1={90} x2={50} y2={90 - 80 * a} stroke={c} strokeWidth={5} strokeLinecap="round" />
                <path d="M22 38 L50 10 L78 38" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={k01(lf, f + 14, f + 22)} />
              </g>
            </svg>
            <div style={{position: 'absolute', left: arrow * 1.5, top: (rowH - fs * 1.14) / 2, ...type(st, fs, ink)}}>
              {itemText(x)}
              {x?.sub && <span style={{color: c, marginLeft: '0.35em', fontWeight: 300}}>{String(x.sub)}</span>}
            </div>
            {i > 0 && <div style={{position: 'absolute', left: 0, top: 0, width: (arrow * 1.5 + widest) * k, height: Math.max(1, 1.5 * u), background: st.faint}} />}
          </div>
        );
      })}
    </Box>
  );
};
export default Trend;

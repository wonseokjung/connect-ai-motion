// Line with stops. Ours.
import React from 'react';
import {Box, SceneProps, caps, fit, itemAt, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';

const Timeline: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const raw = itemsOf(it).slice(0, 6);
  const n = Math.max(1, raw.length);
  const at = raw.map((_, i) => itemAt(it, i, n, dur, fps));
  const head = String(it.text || '');
  // how far the line has run: it reaches stop i at at[i]
  const L = tall ? r[3] * 0.84 : r[2];
  const pos = (i: number) => ((i + 0.5) / n) * L;
  const lineAt = tall ? r[2] * 0.12 : r[3] * 0.56;
  let reach = 0;
  for (let i = 0; i < n; i++) reach += (pos(i) - (i ? pos(i - 1) : 0)) * k01(lf, at[i] - 12, at[i]);
  const labW = tall ? r[2] * 0.78 : (r[2] / n) * 0.9;
  const fs = Math.min(...raw.map((x) => fit(itemText(x), labW, tall ? 60 * u : 48 * u, 300, st.tracking)));
  const dot = 20 * u;
  return (
    <Box r={r}>
      {head && <div style={{position: 'absolute', left: 0, top: tall ? 0 : r[3] * 0.1, ...caps(st, 28 * u, st.accentHi), opacity: k01(lf, 0, 12)}}>{head}</div>}
      <div style={{position: 'absolute', left: tall ? lineAt : 0, top: tall ? r[3] * 0.1 : lineAt, width: tall ? Math.max(1, 1.5 * u) : L, height: tall ? L : Math.max(1, 1.5 * u), background: st.faint}} />
      <div style={{position: 'absolute', left: tall ? lineAt : 0, top: tall ? r[3] * 0.1 : lineAt, width: tall ? Math.max(2, 2.5 * u) : reach, height: tall ? reach : Math.max(2, 2.5 * u), background: st.accent}} />
      {raw.map((x, i) => {
        const k = k01(lf, at[i] - 2, at[i] + 12);
        const p = pos(i);
        const sub = x && typeof x === 'object' && x.sub ? String(x.sub) : '';
        const cx = tall ? lineAt : p, cy = tall ? r[3] * 0.1 + p : lineAt;
        const up = !tall && i % 2 === 1;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: cx - dot / 2, top: cy - dot / 2, width: dot, height: dot, borderRadius: dot, border: `${Math.max(2, 2.5 * u)}px solid ${st.accent}`, background: st.bg, transform: `scale(${k})`}} />
            <div style={{position: 'absolute', left: tall ? cx + dot * 1.8 : cx - labW / 2, top: tall ? cy - fs * 0.9 : up ? cy - dot - fs * 1.2 - (sub ? 34 * u : 0) : cy + dot * 1.3, width: labW, textAlign: tall ? 'left' : 'center', opacity: k, transform: `translateY(${(1 - k) * (up ? -1 : 1) * 14 * u}px)`}}>
              <div style={{...type(st, fs, ink, 300)}}>{itemText(x)}</div>
              {sub && <div style={{...caps(st, 24 * u, st.dim), marginTop: 10 * u}}>{sub}</div>}
            </div>
          </React.Fragment>
        );
      })}
    </Box>
  );
};
export default Timeline;

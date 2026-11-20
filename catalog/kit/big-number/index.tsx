// Big number: counts up, ticks fill, unit and label. Ours.
import React from 'react';
import {Box, SceneProps, caps, fit, hueOf, k01, type} from '../../../src/catalog/ui';

const parse = (s: string) => {
  const m = String(s).trim().match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
  if (!m) return {pre: '', v: NaN, post: String(s), dec: 0};
  const num = m[2].replace(/,/g, '');
  return {pre: m[1], v: parseFloat(num), post: m[3], dec: (num.split('.')[1] || '').length, comma: m[2].includes(',')};
};

const BigNumber: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const raw = String(it.value ?? '');
  const p = parse(raw);
  const k = k01(lf, 2, Math.min(36, dur * 0.4));
  const shown = Number.isFinite(p.v) ? `${p.pre}${(p.v * k).toLocaleString('en-US', {minimumFractionDigits: p.dec, maximumFractionDigits: p.dec, useGrouping: !!(p as any).comma})}${p.post}` : raw;
  const unit = String(it.unit || ''), label = String(it.text || '');
  const fs = fit(raw, r[2] * (tall ? 0.94 : 0.62), r[3] * (tall ? 0.3 : 0.62), st.weight, st.tracking);
  const top = (r[3] - fs * 1.05) / 2 - (tall ? fs * 0.3 : 0);
  const N = tall ? 28 : 48, tickW = (r[2] * (tall ? 0.94 : 0.62)) / N;
  const side = 32 * u;
  const lab = Math.max(40 * u, fit(label, r[2] * (tall ? 0.94 : 0.3), 56 * u, 300, st.tracking));
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: 0, top, ...type(st, fs, hueOf(it, ink)), fontVariantNumeric: 'tabular-nums', lineHeight: 1.05}}>{shown}</div>
      <div style={{position: 'absolute', left: 0, top: top + fs * 1.12}}>
        {Array.from({length: N}, (_, i) => <div key={i} style={{position: 'absolute', left: i * tickW, top: 0, width: Math.max(1.5, 2 * u), height: (i % 6 === 0 ? 22 : 12) * u, background: i / N <= k ? st.accent : st.faint}} />)}
      </div>
      <div style={{position: 'absolute', left: tall ? 0 : r[2] * 0.66, top: tall ? top + fs * 1.12 + 56 * u : top + fs * 0.22, opacity: k01(lf, 12, 26), transform: `translateY(${(1 - k01(lf, 12, 28)) * 14 * u}px)`}}>
        {unit && <div style={{...caps(st, side, st.accentHi), marginBottom: 14 * u}}>{unit}</div>}
        {label && <div style={{...type(st, lab, ink, 300), whiteSpace: 'normal', width: r[2] * (tall ? 0.94 : 0.32), lineHeight: 1.2}}>{label}</div>}
      </div>
    </Box>
  );
};
export default BigNumber;

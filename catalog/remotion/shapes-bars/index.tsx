// Bars: values you said, grown from a base line (@remotion/shapes makeRect).
import React from 'react';
import {makeRect} from '@remotion/shapes';
import {Box, SceneProps, caps, fit, hueOf, itemAt, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';

const num = (s: any) => {
  const v = parseFloat(String(s ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(v) ? v : 0;
};

const ShapesBars: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const items = itemsOf(it).slice(0, 6);
  const n = Math.max(1, items.length);
  const vals = items.map((x) => num(x?.value));
  const max = Math.max(1e-6, ...vals);
  const col = hueOf(it, st.accent);
  const hi = String(it.hi || '').toLowerCase();
  const head = String(it.text || '');
  const W = r[2], H = r[3];
  const baseY = H * 0.8, topY = H * (head ? 0.26 : 0.16);
  const slot = W / n, bw = Math.min(slot * 0.5, 190 * u);
  const fsV = Math.min(64 * u, bw * 0.62), fsL = Math.min(...items.map((x) => fit(itemText(x), slot * 0.9, 38 * u, 300, st.tracking)));
  return (
    <Box r={r}>
      {head && <div style={{position: 'absolute', left: 0, top: tall ? 0 : H * 0.06, ...caps(st, 28 * u, st.accentHi), opacity: k01(lf, 0, 12)}}>{head}</div>}
      <div style={{position: 'absolute', left: 0, top: baseY, width: W * k01(lf, 0, 18), height: Math.max(1, 1.5 * u), background: st.cardLine}} />
      <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
        {items.map((x, i) => {
          const f = itemAt(it, i, n, dur, fps);
          const k = k01(lf, f, f + 22);
          const h = Math.max(2, (baseY - topY) * (vals[i] / max) * k);
          const rect = makeRect({width: bw, height: h, cornerRadius: Math.min(10 * u, h / 2)});
          const on = hi && itemText(x).toLowerCase() === hi;
          return <path key={i} d={rect.path} transform={`translate(${slot * (i + 0.5) - bw / 2} ${baseY - h})`} fill={on ? col : st.ink} fillOpacity={on ? 0.95 : 0.22} />;
        })}
      </svg>
      {items.map((x, i) => {
        const f = itemAt(it, i, n, dur, fps);
        const k = k01(lf, f, f + 22);
        const h = (baseY - topY) * (vals[i] / max) * k;
        const on = hi && itemText(x).toLowerCase() === hi;
        const raw = String(x?.value ?? '');
        const dec = (raw.split('.')[1] || '').replace(/\D/g, '').length;
        const shown = raw.replace(/-?[\d.,]+/, (vals[i] * k).toFixed(dec));
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: slot * i, width: slot, top: baseY - h - fsV * 1.3, textAlign: 'center', ...type(st, fsV, on ? col : ink, 200), fontVariantNumeric: 'tabular-nums', opacity: k01(lf, f, f + 8)}}>{shown}</div>
            <div style={{position: 'absolute', left: slot * i, width: slot, top: baseY + 20 * u, textAlign: 'center', ...type(st, fsL, on ? ink : st.dim, 300), opacity: k01(lf, f, f + 10)}}>{itemText(x)}</div>
          </React.Fragment>
        );
      })}
    </Box>
  );
};
export default ShapesBars;

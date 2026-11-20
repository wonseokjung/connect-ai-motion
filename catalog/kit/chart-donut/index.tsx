// Donut: slices sweep in one after another, the ring turns very slowly, a word or value sits in the middle
// and each slice has its line in the legend. Ours.
import React from 'react';
import {Box, SceneProps, caps, fit, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';
import {Stage, arc, colorAt, decimals, num, startAt} from '../../../src/parts/Picture';

const ChartDonut: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W: FW, H: FH, tall}) => {
  const items = itemsOf(it).slice(0, 8);
  const n = Math.max(1, items.length);
  const vals = items.map((x) => Math.max(0, num(x?.value)));
  const total = Math.max(1e-6, vals.reduce((a, b) => a + b, 0));
  const W = r[2], H = r[3];
  const D = tall ? Math.max(H * 0.4, Math.min(W * 0.94, H - 60 * u - n * 84 * u)) : Math.min(H * 0.98, W * 0.5);
  const sw = D * 0.15, R = D / 2 - sw / 2 - 6 * u;
  const cx = tall ? W / 2 : D / 2, cy = tall ? D / 2 : H / 2;
  const hi = String(it.hi || '').toLowerCase();
  const turn = -18 + lf * 0.07; // degrees: the whole ring drifts
  const gap = n > 1 ? 1.6 : 0;
  let a = 0;
  const segs = items.map((x, i) => {
    const sweep = (vals[i] / total) * 360;
    const f = startAt(it, items, i, n, dur, fps);
    const k = k01(lf, f, f + 22);
    const s = {i, a0: a + gap / 2, a1: a + gap / 2 + Math.max(0.01, (sweep - gap) * k), k, f, col: colorAt(x, i), on: !!hi && itemText(x).toLowerCase() === hi};
    a += sweep;
    return s;
  });
  const text = String(it.text || ''), sub = String(it.sub || '');
  const inner = (R - sw / 2) * 2 * 0.78;
  const fsC = text ? fit(text, inner, D * 0.2, st.weight, st.tracking) : 0;
  const fsS = sub ? fit(sub.toUpperCase(), inner * 0.9, 26 * u, st.heavy, 0.24) : 0;
  // legend
  const lx = tall ? 0 : D + W * 0.07, lw = W - lx;
  const lh = tall ? H - D - 50 * u : H * 0.86;
  const rowH = Math.min(92 * u, lh / n);
  const ly = tall ? D + 50 * u : (H - rowH * n) / 2;
  const fsL = Math.min(50 * u, rowH * 0.56, ...items.map((x) => fit(itemText(x), lw * 0.66, 50 * u, 300, st.tracking)));
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="plum" glow={segs[0]?.col} lf={lf} x={tall ? 50 : 30} y={tall ? 36 : 52} strength={0.16} />
      <Box r={r}>
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={st.card} strokeWidth={sw} opacity={k01(lf, 0, 12)} />
          <g transform={`rotate(${turn} ${cx} ${cy})`}>
            {segs.map((s) => <path key={s.i} d={arc(cx, cy, R + (s.on ? sw * 0.07 : 0), s.a0, s.a1)} fill="none" stroke={s.col} strokeWidth={sw * (s.on ? 1.14 : 1)} opacity={s.k > 0 ? (hi && !s.on ? 0.62 : 1) : 0} />)}
          </g>
          <circle cx={cx} cy={cy} r={R - sw / 2 - 10 * u} fill="none" stroke={st.cardLine} strokeWidth={Math.max(1, 1.5 * u)} strokeDasharray={`${3 * u} ${9 * u}`} transform={`rotate(${-lf * 0.12} ${cx} ${cy})`} opacity={k01(lf, 4, 20)} />
        </svg>
        {text && <div style={{position: 'absolute', left: cx - inner / 2, width: inner, top: cy - fsC * 0.6 - (sub ? fsS * 0.9 : 0), textAlign: 'center', ...type(st, fsC, ink), opacity: k01(lf, 4, 18)}}>{text}</div>}
        {sub && <div style={{position: 'absolute', left: cx - inner / 2, width: inner, top: cy + (text ? fsC * 0.56 : -fsS / 2), textAlign: 'center', ...caps(st, fsS, st.dim), opacity: k01(lf, 10, 24)}}>{sub}</div>}
        {segs.map((s) => {
          const y = ly + s.i * rowH;
          const raw = String(items[s.i]?.value ?? '');
          const shown = raw.replace(/-?[\d.,]+/, (vals[s.i] * s.k).toFixed(decimals(raw)));
          const k = k01(lf, s.f, s.f + 14);
          return (
            <div key={s.i} style={{position: 'absolute', left: lx, top: y, width: lw, height: rowH, display: 'flex', alignItems: 'center', gap: 22 * u, opacity: k * (hi && !s.on ? 0.7 : 1), transform: `translateX(${(1 - k) * 26 * u}px)`}}>
              <div style={{width: 12 * u, height: rowH * 0.52, borderRadius: 6 * u, background: s.col, flex: 'none'}} />
              <div style={{...type(st, fsL, ink, 300), flex: 1}}>{itemText(items[s.i])}</div>
              <div style={{...type(st, fsL * 1.12, s.col, 200), fontVariantNumeric: 'tabular-nums'}}>{shown}</div>
            </div>
          );
        })}
      </Box>
    </>
  );
};
export default ChartDonut;

// Gantt: one bar per row grows along a shared axis when you name it; a "now" line walks across the whole beat
// and what it has passed turns to full colour. Ours.
import React from 'react';
import {Box, SceneProps, caps, fit, itemText, itemsOf, k01, measure, type} from '../../../src/catalog/ui';
import {Stage, colorAt, num, useSvgId, startAt} from '../../../src/parts/Picture';

const ChartGantt: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W: FW, H: FH, tall}) => {
  const items = itemsOf(it).slice(0, 8);
  const n = Math.max(1, items.length);
  const from = items.map((x) => num(x?.from)), to = items.map((x, i) => Math.max(num(x?.to), from[i]));
  const a0 = Math.min(...from), a1 = Math.max(...to, a0 + 1e-6);
  const steps = (Array.isArray(it.lines) ? it.lines : []).map(itemText);
  const head = String(it.text || '');
  const id = useSvgId('gt');
  const W = r[2], H = r[3];
  const labW = tall ? 0 : W * 0.22;
  const fsL = Math.min(...items.map((x) => fit(itemText(x), tall ? W * 0.9 : labW - 28 * u, (tall ? 46 : 42) * u, 300, st.tracking)));
  const gy = head ? 66 * u : 0, axH = steps.length ? 54 * u : 16 * u;
  const gx = labW, gw = W - gx, gh = H - gy - axH;
  const rowH = Math.min((tall ? 250 : 150) * u, gh / n);
  const y0 = gy + (gh - rowH * n) / 2;
  const barH = Math.min(rowH * (tall ? 0.34 : 0.52), 78 * u);
  const X = (v: number) => gx + ((v - a0) / (a1 - a0)) * gw;
  const whole = a1 - a0 <= 30 && Number.isInteger(a0) && Number.isInteger(a1);
  const nowK = Math.max(0, Math.min(1, (lf - 8) / Math.max(1, dur * 0.86)));
  const nx = gx + gw * nowK;
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="deep" glow={colorAt(items[0], 0)} lf={lf} x={40} y={50} strength={0.14} />
      <Box r={r}>
        {head && <div style={{position: 'absolute', left: 0, top: 0, ...caps(st, 28 * u, st.accentHi), opacity: k01(lf, 0, 12)}}>{head}</div>}
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          <defs><clipPath id={id}><rect x={0} y={0} width={Math.max(0, nx)} height={H} /></clipPath></defs>
          {whole && Array.from({length: a1 - a0 + 1}, (_, i) => <line key={i} x1={X(a0 + i)} y1={y0} x2={X(a0 + i)} y2={y0 + (rowH * n) * k01(lf, i * 1.2, 16 + i * 1.2)} stroke={st.ink} strokeOpacity={0.09} strokeWidth={Math.max(1, u)} />)}
          {items.map((x, i) => {
            const f = startAt(it, items, i, n, dur, fps);
            const k = k01(lf, f, f + 22);
            const w = Math.max(barH, (X(to[i]) - X(from[i])) * k);
            const y = y0 + i * rowH + (tall ? rowH * 0.5 : (rowH - barH) / 2);
            const c = colorAt(x, i);
            return (
              <g key={i} opacity={Math.min(1, k * 4)}>
                <rect x={X(from[i])} y={y} width={w} height={barH} rx={barH / 2} fill={c} fillOpacity={0.3} />
                <rect x={X(from[i])} y={y} width={w} height={barH} rx={barH / 2} fill={c} clipPath={`url(#${id})`} />
              </g>
            );
          })}
          <g opacity={k01(lf, 4, 14)}>
            <line x1={nx} y1={y0 - 18 * u} x2={nx} y2={y0 + rowH * n + 6 * u} stroke={ink} strokeOpacity={0.8} strokeWidth={Math.max(1.5, 2 * u)} />
            <path d={`M ${nx - 9 * u} ${y0 - 30 * u} h ${18 * u} l ${-9 * u} ${13 * u} z`} fill={ink} />
          </g>
        </svg>
        {items.map((x, i) => {
          const f = startAt(it, items, i, n, dur, fps);
          const k = k01(lf, f - 2, f + 12);
          const y = y0 + i * rowH;
          return tall ? (
            <div key={i} style={{position: 'absolute', left: Math.max(0, Math.min(X(from[i]), W - measure(itemText(x), fsL, 300, st.tracking) - 4 * u)), top: y + rowH * 0.5 - fsL * 1.5, ...type(st, fsL, ink, 300), opacity: k}}>{itemText(x)}</div>
          ) : (
            <div key={i} style={{position: 'absolute', left: 0, top: y + rowH / 2 - fsL * 0.6, width: labW - 28 * u, textAlign: 'right', ...type(st, fsL, ink, 300), opacity: k, transform: `translateX(${(1 - k) * -14 * u}px)`}}>{itemText(x)}</div>
          );
        })}
        {steps.slice(0, Math.max(0, Math.round(a1 - a0))).map((t: string, i: number) => {
          const passed = nx >= X(a0 + i);
          return <div key={'s' + i} style={{position: 'absolute', left: X(a0 + i), width: X(a0 + i + 1) - X(a0 + i), top: y0 + rowH * n + 16 * u, textAlign: 'center', ...type(st, Math.min(30 * u, (X(a0 + 1) - X(a0)) * 0.5), passed ? ink : st.dim, 300), fontVariantNumeric: 'tabular-nums', opacity: k01(lf, i * 1.2, 14 + i * 1.2)}}>{t}</div>;
        })}
      </Box>
    </>
  );
};
export default ChartGantt;

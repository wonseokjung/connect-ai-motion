// Line chart that draws itself: the line grows point by point, a head dot rides it and the value counts along
// (@remotion/paths getLength / getPointAtLength). Every number on screen is one of your values. Ours.
import React from 'react';
import {getLength, getPointAtLength} from '@remotion/paths';
import {Box, HUE, INOUT, SceneProps, caps, fit, hexA, hueOf, itemAt, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';
import {Stage, curve, decimals, num, useSvgId} from '../../../src/parts/Picture';

const ChartLine: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W: FW, H: FH, tall}) => {
  const items = itemsOf(it).slice(0, 12);
  const n = Math.max(2, items.length);
  const vals = Array.from({length: n}, (_, i) => num(items[i]?.value));
  const col = hueOf(it, HUE.teal);
  const id = useSvgId('cl');
  const W = r[2], H = r[3];
  const head = String(it.text || ''), unit = String(it.unit || '');
  const top = H * (tall ? 0.3 : 0.4), base = H * (tall ? 0.88 : 0.84);
  const lo = Math.min(0, ...vals), hi = Math.max(...vals, lo + 1e-6);
  const padX = W * (tall ? 0.06 : 0.04);
  const pts = vals.map((v, i) => [padX + ((W - 2 * padX) * i) / (n - 1), base - ((v - lo) / (hi - lo)) * (base - top)]);
  const {d, parts} = curve(pts, 0.16);
  const lens = parts.map((p) => getLength(p));
  const total = lens.reduce((a, b) => a + b, 0);
  const at = Array.from({length: n}, (_, i) => itemAt(it, i, n, dur, fps));
  // the line reaches point i at the moment item i is due
  let p = 0;
  for (let i = 1; i < n; i++) if (lf >= at[i - 1]) p = Math.max(p, i - 1 + k01(lf, at[i - 1], at[i], INOUT));
  const seg = Math.min(n - 2, Math.floor(p)), frac = p - seg;
  const len = lens.slice(0, seg).reduce((a, b) => a + b, 0) + frac * lens[seg];
  const hp = getPointAtLength(d, Math.min(total, Math.max(0, len))) || {x: pts[0][0], y: pts[0][1]};
  const cur = vals[seg] + (vals[seg + 1] - vals[seg]) * frac;
  const dec = Math.max(...items.map((x) => decimals(x?.value)), 0);
  const reached = Math.min(n - 1, Math.round(p));
  const inK = k01(lf, 0, 10);
  const fsV = (tall ? 190 : 170) * u;
  const slot = (W - 2 * padX) / (n - 1);
  const showLab = n <= (tall ? 4 : 7);
  const fsL = showLab ? Math.min(...items.map((x) => fit(itemText(x), slot * 0.94, 32 * u, 300, st.tracking))) : 0;
  const sw = Math.max(3, 6 * u);
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="night" glow={col} lf={lf} x={62} y={66} />
      <Box r={r}>
        {head && <div style={{position: 'absolute', left: 0, top: 0, ...caps(st, 28 * u, hexA(col, 0.95)), opacity: inK}}>{head}</div>}
        <div style={{position: 'absolute', left: 0, top: head ? 44 * u : 0, display: 'flex', alignItems: 'baseline', gap: 22 * u, opacity: inK}}>
          <div style={{...type(st, fsV, ink, 200), fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{cur.toFixed(dec)}</div>
          {unit && <div style={{...type(st, 54 * u, st.dim, 300)}}>{unit}</div>}
          <div style={{...type(st, Math.min(56 * u, fit(itemText(items[reached]), W * 0.5, 56 * u, 300, st.tracking)), col, 300)}}>{itemText(items[reached])}</div>
        </div>
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          <defs>
            <linearGradient id={id + 'g'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={col} stopOpacity={0.42} />
              <stop offset="1" stopColor={col} stopOpacity={0} />
            </linearGradient>
            <clipPath id={id + 'c'}><rect x={0} y={0} width={Math.max(0, hp.x)} height={H} /></clipPath>
          </defs>
          <line x1={0} y1={base} x2={W * k01(lf, 0, 18)} y2={base} stroke={st.cardLine} strokeWidth={Math.max(1, 1.5 * u)} />
          <path d={`${d} L ${pts[n - 1][0]} ${base} L ${pts[0][0]} ${base} Z`} fill={`url(#${id}g)`} clipPath={`url(#${id}c)`} />
          <path d={d} fill="none" stroke={st.faint} strokeWidth={Math.max(1, 1.5 * u)} strokeDasharray={`${4 * u} ${10 * u}`} opacity={inK} />
          <path d={d} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${total} ${total}`} strokeDashoffset={total - len} />
          {pts.map(([x, y], i) => {
            const k = k01(lf, at[i] - 3, at[i] + 9);
            return (
              <g key={i} opacity={i === 0 ? inK : k}>
                <line x1={x} y1={y} x2={x} y2={base} stroke={hexA(col, 0.3)} strokeWidth={Math.max(1, 1.5 * u)} />
                <circle cx={x} cy={y} r={(5 + 4 * k) * u} fill={st.bg} stroke={col} strokeWidth={Math.max(2, 3 * u)} />
              </g>
            );
          })}
          <circle cx={hp.x} cy={hp.y} r={22 * u} fill="none" stroke={hexA(col, 0.4)} strokeWidth={Math.max(1, 1.5 * u)} opacity={inK} />
          <circle cx={hp.x} cy={hp.y} r={11 * u} fill={col} opacity={inK} />
        </svg>
        {showLab && pts.map(([x], i) => {
          const k = i === 0 ? inK : k01(lf, at[i] - 3, at[i] + 9);
          const left = Math.max(0, Math.min(W - slot * 0.94, x - (slot * 0.94) / 2));
          return <div key={i} style={{position: 'absolute', left, top: base + 22 * u, width: slot * 0.94, textAlign: i === 0 ? 'left' : i === n - 1 ? 'right' : 'center', ...type(st, fsL, i === reached ? ink : st.dim, 300), opacity: 0.3 + 0.7 * k}}>{itemText(items[i])}</div>;
        })}
      </Box>
    </>
  );
};
export default ChartLine;

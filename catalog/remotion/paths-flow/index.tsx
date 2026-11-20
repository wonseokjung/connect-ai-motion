// Flow: stations on one curved line that draws itself (@remotion/paths).
import React from 'react';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {Box, FONT, SceneProps, fit, hueOf, itemAt, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';

const PathsFlow: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const items = itemsOf(it).slice(0, 5).map(itemText);
  const n = Math.max(2, items.length);
  const col = hueOf(it, st.accent);
  const W = r[2], H = r[3];
  // station centres: a gentle wave across the frame (a zig-zag down the frame in 9:16)
  const pts = items.map((_, i) => (tall ? [W * (i % 2 ? 0.72 : 0.28), H * (0.12 + (0.76 * i) / (n - 1))] : [W * (0.1 + (0.8 * i) / (n - 1)), H * (0.5 + (i % 2 ? -0.13 : 0.13))]));
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    d += tall ? ` C ${x0} ${(y0 + y1) / 2}, ${x1} ${(y0 + y1) / 2}, ${x1} ${y1}` : ` C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`;
  }
  const at = items.map((_, i) => itemAt(it, i, n, dur, fps));
  let prog = 0;
  for (let i = 1; i < n; i++) prog = Math.max(prog, (i - 1 + k01(lf, at[i] - 14, at[i])) / (n - 1));
  const ev = evolvePath(Math.max(0.0001, prog), d);
  const head = getPointAtLength(d, getLength(d) * prog);
  const R = (tall ? 62 : 54) * u;
  const labW = tall ? W * 0.5 : (W / n) * 1.05;
  const fs = Math.min(...items.map((t) => fit(t, labW, 44 * u, 300, st.tracking)));
  return (
    <Box r={r}>
      <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
        <path d={d} fill="none" stroke={st.faint} strokeWidth={Math.max(1, 1.5 * u)} strokeDasharray={`${6 * u} ${10 * u}`} />
        <path d={d} fill="none" stroke={col} strokeWidth={Math.max(2, 3 * u)} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        {head && prog > 0 && prog < 1 && <circle cx={head.x} cy={head.y} r={7 * u} fill={col} />}
        {pts.map(([x, y], i) => {
          const k = k01(lf, at[i] - 2, at[i] + 12);
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * k})`} opacity={i === 0 ? k01(lf, 0, 10) : 0.25 + 0.75 * k}>
              <circle r={R} fill={st.bg} stroke={k > 0.5 ? col : st.cardLine} strokeWidth={Math.max(1.5, 2 * u)} />
              <text textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={R * 0.8} fontWeight={200} fill={k > 0.5 ? col : st.dim} style={{fontVariantNumeric: 'tabular-nums'}}>{i + 1}</text>
            </g>
          );
        })}
      </svg>
      {pts.map(([x, y], i) => {
        const k = i === 0 ? k01(lf, 2, 14) : k01(lf, at[i], at[i] + 12);
        const below = tall ? true : i % 2 === 0;
        return <div key={i} style={{position: 'absolute', left: x - labW / 2, top: below ? y + R + 18 * u : y - R - 18 * u - fs * 1.15, width: labW, textAlign: 'center', ...type(st, fs, ink, 300), opacity: k, transform: `translateY(${(1 - k) * (below ? 1 : -1) * 12 * u}px)`}}>{items[i]}</div>;
      })}
    </Box>
  );
};
export default PathsFlow;

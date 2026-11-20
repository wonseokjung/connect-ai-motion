// Route on a map that is not a real place: faint contour rings and a dotted grid, a route that draws itself
// from pin to pin as you name the stops (@remotion/paths, @remotion/noise for the terrain). Ours.
import React from 'react';
import {getLength, getPointAtLength} from '@remotion/paths';
import {noise2D} from '@remotion/noise';
import {random} from 'remotion';
import {Box, HUE, INOUT, SNAP, SceneProps, fit, hexA, hueOf, itemAt, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';
import {Stage, colorAt, curve, num, useSvgId} from '../../../src/parts/Picture';

const DrawRoute: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W: FW, H: FH, tall}) => {
  const items = itemsOf(it).slice(0, 6);
  const n = Math.max(2, items.length);
  const col = hueOf(it, HUE.coral);
  const seed = String(it.seed ?? items.map(itemText).join('|'));
  const pid = useSvgId('dr');
  const W = r[2], H = r[3];
  // stops: yours ("x", "y" from 0 to 1) or a wandering line across the frame
  const pts = Array.from({length: n}, (_, i) => {
    const x = items[i] || {};
    const a = n === 1 ? 0.5 : i / (n - 1), j = random(seed + i) - 0.5, side = i % 2 ? -1 : 1;
    const dx = tall ? 0.5 + side * (0.2 + 0.1 * j) : 0.08 + 0.84 * a, dy = tall ? 0.1 + 0.8 * a : 0.52 + side * (0.2 + 0.12 * j);
    return [W * (x.x != null ? num(x.x) : dx), H * (x.y != null ? num(x.y) : dy)];
  });
  const {d, parts} = curve(pts, 0.22);
  const lens = parts.map((p) => getLength(p));
  const total = lens.reduce((a, b) => a + b, 0);
  const at = Array.from({length: n}, (_, i) => itemAt(it, i, n, dur, fps));
  let p = 0;
  for (let i = 1; i < n; i++) if (lf >= at[i - 1]) p = Math.max(p, i - 1 + k01(lf, at[i - 1], at[i], INOUT));
  const seg = Math.min(n - 2, Math.floor(p)), frac = p - seg;
  const len = lens.slice(0, seg).reduce((a, b) => a + b, 0) + frac * lens[seg];
  const hp = getPointAtLength(d, Math.min(total, Math.max(0, len))) || {x: pts[0][0], y: pts[0][1]};
  // terrain: rings around a few hills, each ring pushed in and out by noise; the whole map drifts a little
  const hills = Array.from({length: tall ? 4 : 5}, (_, h) => ({x: FW * (0.08 + 0.84 * random(seed + 'hx' + h)), y: FH * (0.1 + 0.8 * random(seed + 'hy' + h)), R: Math.min(FW, FH) * (0.2 + 0.2 * random(seed + 'hr' + h))}));
  const rings: string[] = [];
  hills.forEach((hl, h) => {
    for (let k = 1; k <= 5; k++) {
      let s = '';
      for (let a = 0; a <= 48; a++) {
        const th = (a / 48) * Math.PI * 2;
        const rr = hl.R * (k / 5) * (1 + 0.22 * noise2D(seed + h, Math.cos(th) * 1.1 + k * 0.35, Math.sin(th) * 1.1));
        s += `${a ? 'L' : 'M'}${(hl.x + Math.cos(th) * rr).toFixed(1)} ${(hl.y + Math.sin(th) * rr * 0.8).toFixed(1)} `;
      }
      rings.push(s + 'Z');
    }
  });
  const driftX = Math.sin(lf / 130) * 10 * u, driftY = Math.cos(lf / 170) * 6 * u;
  const step = 64 * u;
  const pinR = (tall ? 38 : 32) * u;
  const labW = tall ? W * 0.44 : Math.min(W * 0.26, (W / n) * 1.3);
  const fs = Math.min(...items.map((x) => fit(itemText(x), labW, 52 * u, 300, st.tracking)));
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="moss" glow={HUE.leaf} lf={lf} x={50} y={50} strength={0.1} />
      <svg width={FW} height={FH} style={{position: 'absolute', left: 0, top: 0, opacity: k01(lf, 0, 16)}}>
        <defs>
          <pattern id={pid} width={step} height={step} patternUnits="userSpaceOnUse"><circle cx={step / 2} cy={step / 2} r={1.6 * u} fill={st.ink} fillOpacity={0.14} /></pattern>
        </defs>
        <rect width={FW} height={FH} fill={`url(#${pid})`} />
        <g transform={`translate(${driftX} ${driftY})`}>
          {rings.map((s, i) => <path key={i} d={s} fill="none" stroke={i % 5 === 4 ? hexA(HUE.leaf, 0.42) : st.ink} strokeOpacity={i % 5 === 4 ? 1 : 0.12} strokeWidth={Math.max(1, 1.3 * u)} />)}
        </g>
      </svg>
      <Box r={r}>
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          <path d={d} fill="none" stroke={st.ink} strokeOpacity={0.22} strokeWidth={Math.max(1.5, 2 * u)} strokeDasharray={`${3 * u} ${12 * u}`} strokeLinecap="round" opacity={k01(lf, 2, 18)} />
          <path d={d} fill="none" stroke={col} strokeWidth={Math.max(4, 8 * u)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${total} ${total}`} strokeDashoffset={total - len} />
          {pts.map(([x, y], i) => {
            const k = i === 0 ? k01(lf, 0, 12, SNAP) : k01(lf, at[i] - 4, at[i] + 10, SNAP);
            const c = i === n - 1 ? st.accentHi : colorAt(items[i], i, col);
            return (
              <g key={i} transform={`translate(${x} ${y - (1 - Math.min(1, k)) * 40 * u}) scale(${Math.max(0, k)})`} opacity={Math.min(1, Math.max(0, k) * 2)}>
                <ellipse cx={0} cy={0} rx={pinR * 0.6} ry={pinR * 0.22} fill="#000" fillOpacity={0.4} />
                <path d={`M 0 0 C ${-pinR * 0.3} ${-pinR * 0.9}, ${-pinR} ${-pinR * 1.3}, ${-pinR} ${-pinR * 2} A ${pinR} ${pinR} 0 1 1 ${pinR} ${-pinR * 2} C ${pinR} ${-pinR * 1.3}, ${pinR * 0.3} ${-pinR * 0.9}, 0 0 Z`} fill={c} />
                <circle cx={0} cy={-pinR * 2} r={pinR * 0.42} fill={st.bg} />
              </g>
            );
          })}
          {p > 0 && p < n - 1 && <circle cx={hp.x} cy={hp.y} r={11 * u} fill={ink} />}
        </svg>
        {pts.map(([x, y], i) => {
          const k = i === 0 ? k01(lf, 4, 16) : k01(lf, at[i], at[i] + 12);
          const up = !tall && y > H * 0.5;
          const left = Math.max(0, Math.min(W - labW, x - labW / 2));
          const top = up ? y + 20 * u : y - pinR * 3.2 - fs * 1.2;
          return <div key={i} style={{position: 'absolute', left, top, width: labW, textAlign: 'center', ...type(st, fs, i === n - 1 ? st.accentHi : ink, 300), opacity: k, transform: `translateY(${(1 - k) * 12 * u}px)`}}>{itemText(items[i])}</div>;
        })}
      </Box>
    </>
  );
};
export default DrawRoute;

// Skyline in one stroke: a pen draws the outline of a city from left to right, the buildings fill in behind it,
// and windows keep switching on until the cut. A second, fainter row of buildings stands behind. Ours.
import React from 'react';
import {random} from 'remotion';
import {Box, HUE, SceneProps, Words, caps, fitLines, hexA, hueOf, k01, type} from '../../../src/catalog/ui';
import {Stage, useSvgId} from '../../../src/parts/Picture';

type B = {x0: number; x1: number; top: number; at: number};

// one row of buildings as a single line that never lifts: up, across the roof, down (or straight on to the next roof)
function row(seed: string, W: number, ground: number, hMin: number, hMax: number, wMin: number, wMax: number) {
  const bs: B[] = [];
  const pts: number[][] = [];
  let x = -wMax * random(seed + 'o');
  pts.push([x, ground]);
  for (let i = 0; x < W + wMax; i++) {
    const w = wMin + (wMax - wMin) * random(seed + 'w' + i);
    const tower = random(seed + 't' + i) > 0.74;
    const h = tower ? hMin + (hMax - hMin) * (0.7 + 0.3 * random(seed + 'h' + i)) : hMin + (hMax - hMin) * 0.62 * random(seed + 'h' + i);
    const top = ground - h, roof = Math.floor(random(seed + 'r' + i) * 5), x1 = x + w;
    pts.push([x, top]);
    if (roof === 1) pts.push([x + w * 0.2, top], [x + w * 0.2, top - h * 0.12], [x + w * 0.8, top - h * 0.12], [x + w * 0.8, top]);
    else if (roof === 2 && tower) pts.push([x + w * 0.46, top], [x + w * 0.5, top - h * 0.24], [x + w * 0.54, top]);
    else if (roof === 4 && tower) pts.push([x + w * 0.5, top - w * 0.36]);
    pts.push([x1, roof === 3 ? top + h * 0.1 : top]);
    bs.push({x0: x, x1, top: roof === 3 ? top + h * 0.1 : top, at: pts.length - 1});
    if (random(seed + 'g' + i) > 0.7) { pts.push([x1, ground]); x = x1 + wMin * 0.3 * (1 + random(seed + 'gg' + i)); pts.push([x, ground]); }
    else x = x1;
  }
  pts.push([x, ground]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  /** x of the pen when the fraction k of the line is drawn */
  const penX = (k: number) => {
    const L = k * total;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < L) i++;
    const t = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * Math.max(0, Math.min(1, t));
  };
  for (const b of bs) b.at = cum[b.at] / total;
  return {d, bs, end: x, penX};
}

const DrawSkyline: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W, H, tall}) => {
  const text = String(it.text || ''), sub = String(it.sub || '');
  const seed = String(it.seed ?? (text || 'skyline'));
  const lit = hueOf(it, HUE.goldHi), lit2 = hueOf(it, HUE.sky, 'color2');
  const id = useSvgId('sk');
  const ground = H * (tall ? 0.76 : 0.8);
  const maxH = H * (text ? (tall ? 0.36 : 0.44) : tall ? 0.48 : 0.6);
  const front = React.useMemo(() => row(seed + 'f', W, ground, H * 0.1, maxH, 86 * u, 210 * u), [seed, W, ground, H, maxH, u]);
  const back = React.useMemo(() => row(seed + 'b', W, ground, H * 0.08, maxH * 0.74, 60 * u, 150 * u), [seed, W, ground, H, maxH, u]);
  const k = k01(lf, 0, dur * 0.56, (t) => t * t * (3 - 2 * t));
  const kb = k01(lf, 4, dur * 0.42, (t) => t * t * (3 - 2 * t));
  const ease = (t: number) => t * t * (3 - 2 * t);
  const penX = front.penX(k);
  const {fs, lines} = fitLines(text, r[2] * 0.94, r[3] * (tall ? 0.2 : 0.26), 2, st.weight, st.tracking);
  // windows: a grid inside each front building, a few of them lit, each at its own moment after the pen has passed
  const wins: {x: number; y: number; w: number; h: number; on: number; c: string}[] = [];
  const ww = 15 * u, wh = 22 * u, gx = 34 * u, gy = 44 * u;
  front.bs.forEach((b, bi) => {
    const cols = Math.floor((b.x1 - b.x0 - 22 * u) / gx), rows = Math.floor((ground - b.top - 34 * u) / gy);
    // the moment the pen finishes this building (the pen eases in and out: undo the easing by search)
    let lo = 0, hi = 1;
    for (let q = 0; q < 14; q++) { const mid = (lo + hi) / 2; if (ease(mid) < b.at) lo = mid; else hi = mid; }
    const passed = hi * dur * 0.56;
    for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
      const s = seed + bi + '-' + c + '-' + rr;
      if (random(s) > 0.24) continue;
      wins.push({x: b.x0 + (b.x1 - b.x0 - cols * gx) / 2 + c * gx + (gx - ww) / 2, y: b.top + 26 * u + rr * gy, w: ww, h: wh, on: passed + 4 + random(s + 'on') * Math.max(10, dur * 0.94 - passed), c: random(s + 'c') > 0.8 ? lit2 : lit});
    }
  });
  const drift = Math.sin(lf / 120) * 14 * u;
  return (
    <>
      <Stage it={it} W={W} H={H} d="night" glow={HUE.blue} lf={lf} x={50} y={tall ? 74 : 80} strength={0.26} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={id + 'g'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B2430" /><stop offset="1" stopColor="#0C1118" /></linearGradient>
          <linearGradient id={id + 'h'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141C28" /><stop offset="1" stopColor="#0B1017" /></linearGradient>
          <clipPath id={id + 'c'}><rect x={0} y={0} width={Math.max(0, penX)} height={H} /></clipPath>
          <clipPath id={id + 'b'}><rect x={-40 * u} y={0} width={Math.max(0, back.penX(kb) + 40 * u)} height={H} /></clipPath>
        </defs>
        <g transform={`translate(${drift} 0)`}>
          <path d={`${back.d} Z`} fill={`url(#${id}h)`} clipPath={`url(#${id}b)`} />
          <path d={back.d} fill="none" stroke={hexA(HUE.sky, 0.34)} strokeWidth={Math.max(1, 1.5 * u)} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - kb} />
        </g>
        <path d={`${front.d} Z`} fill={`url(#${id}g)`} clipPath={`url(#${id}c)`} />
        {wins.map((w, i) => {
          const a = k01(lf, w.on, w.on + 5);
          return a > 0 ? <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} rx={2 * u} fill={w.c} fillOpacity={0.9 * a} /> : null;
        })}
        <path d={front.d} fill="none" stroke={ink} strokeWidth={Math.max(2, 3.5 * u)} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
        <rect x={0} y={ground} width={W} height={H - ground} fill="#070A0F" fillOpacity={0.55} />
        <line x1={0} y1={ground} x2={W * k01(lf, 0, 20)} y2={ground} stroke={ink} strokeOpacity={0.5} strokeWidth={Math.max(1, 1.5 * u)} />
        {Array.from({length: 4}, (_, i) => <line key={i} x1={0} y1={ground + (22 + i * 26) * u} x2={W} y2={ground + (22 + i * 26) * u} stroke={i % 2 ? lit : ink} strokeOpacity={0.3 - i * 0.05} strokeWidth={Math.max(1, 2 * u)} strokeDasharray={`${(60 + i * 46) * u} ${(90 + i * 60) * u}`} strokeDashoffset={-lf * (0.6 + i * 0.35) * u} strokeLinecap="round" />)}
      </svg>
      <Box r={r}>
        {text && (
          <div style={{position: 'absolute', left: 0, right: 0, top: tall ? r[3] * 0.02 : 0, textAlign: 'center'}}>
            {sub && <div style={{...caps(st, 26 * u, hexA(lit, 0.95)), marginBottom: 14 * u, opacity: k01(lf, 6, 18)}}>{sub}</div>}
            {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={6 + i * 6} /></div>)}
          </div>
        )}
      </Box>
    </>
  );
};
export default DrawSkyline;

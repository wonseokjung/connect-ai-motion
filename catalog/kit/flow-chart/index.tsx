// Flow chart: boxes and arrows build one step at a time; one step can be a decision (a diamond) with a way
// forward and a way back. A dot walks the path: back around the loop once, then on to the end. Ours.
import React from 'react';
import {Box, HUE, SceneProps, cueAt, fit, fitLines, hexA, hueOf, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';
import {Stage, colorAt, num, startAt} from '../../../src/parts/Picture';

const lerp = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const bez = (p: number[][], t: number) => {
  const m = 1 - t;
  return [m * m * m * p[0][0] + 3 * m * m * t * p[1][0] + 3 * m * t * t * p[2][0] + t * t * t * p[3][0], m * m * m * p[0][1] + 3 * m * m * t * p[1][1] + 3 * m * t * t * p[2][1] + t * t * t * p[3][1]];
};

const FlowChart: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W: FW, H: FH, tall}) => {
  const items = itemsOf(it).slice(0, 6);
  const n = Math.max(2, items.length);
  const names = Array.from({length: n}, (_, i) => itemText(items[i]));
  const bi = it.branch != null && n > 2 ? Math.max(1, Math.min(n - 1, Math.round(num(it.branch)) - 1)) : -1;
  const yes = String(it.label || ''), no = String(it.label2 || '');
  const col2 = hueOf(it, HUE.coral, 'color2');
  const W = r[2], H = r[3];
  const gap = (tall ? H : W) * 0.05;
  const bw = tall ? W * (bi >= 0 ? 0.7 : 0.84) : Math.min(400 * u, (W - gap * (n - 1)) / n);
  const bh = tall ? Math.min(180 * u, (H - gap * (n - 1)) / n) : Math.min(210 * u, H * 0.28);
  const total = tall ? bh * n + gap * (n - 1) : bw * n + gap * (n - 1);
  const C = names.map((_, i) => (tall ? [bi >= 0 ? bw / 2 + W * 0.02 : W / 2, (H - total) / 2 + bh / 2 + i * (bh + gap)] : [(W - total) / 2 + bw / 2 + i * (bw + gap), H * (bi >= 0 ? 0.58 : 0.5)]));
  const dia = tall ? 1.16 : 1.26; // a decision is this much taller than a box
  const ext = (i: number) => (tall ? (i === bi ? (bh / 2) * dia : bh / 2) : bw / 2);
  const out = (i: number) => (tall ? [C[i][0], C[i][1] + ext(i)] : [C[i][0] + ext(i), C[i][1]]);
  const inn = (i: number) => (tall ? [C[i][0], C[i][1] - ext(i) - 6 * u] : [C[i][0] - ext(i) - 6 * u, C[i][1]]);
  const at = names.map((_, i) => startAt(it, items, i, n, dur, fps));
  const lift = tall ? W * 0.22 : Math.min(H * 0.34, 260 * u);
  const loop = bi < 0 ? null : tall
    ? [[C[bi][0] + bw / 2, C[bi][1]], [C[bi][0] + bw / 2 + lift, C[bi][1]], [C[bi][0] + bw / 2 + lift, C[bi - 1][1]], [C[bi - 1][0] + bw / 2 + 8 * u, C[bi - 1][1]]]
    : [[C[bi][0], C[bi][1] - (bh / 2) * dia], [C[bi][0], C[bi][1] - (bh / 2) * dia - lift], [C[bi - 1][0], C[bi - 1][1] - bh / 2 - lift], [C[bi - 1][0], C[bi - 1][1] - bh / 2 - 8 * u]];
  const tL = cueAt(it, 'back', at[n - 1] + 12);
  const kL = loop ? k01(lf, tL, tL + 18, (t) => t * t * (3 - 2 * t)) : 0;
  // where the dot is, and when it arrives at each box (a box lights up for a moment when it does)
  let dot: number[] | null = null;
  const arrive: number[][] = names.map((_, i) => [at[i]]);
  for (let i = 1; i < n; i++) { const k = k01(lf, at[i] - 14, at[i] - 2); if (k > 0 && k < 1) dot = lerp(out(i - 1), inn(i), k); }
  if (loop) {
    if (kL > 0 && kL < 1) dot = bez(loop, kL);
    arrive[bi - 1].push(tL + 18);
    for (let j = 0; bi - 1 + j < n - 1; j++) {
      const a = bi - 1 + j, t0 = tL + 24 + j * 14, k = k01(lf, t0, t0 + 11, (t) => t);
      if (k > 0 && k < 1) dot = lerp(out(a), inn(a + 1), k);
      arrive[a + 1].push(t0 + 11);
    }
  } else {
    const t0 = at[n - 1] + 16, cyc = (n - 1) * 14 + 30;
    if (lf > t0) {
      const tt = (lf - t0) % cyc, j = Math.floor(tt / 14), round = Math.floor((lf - t0) / cyc);
      if (j < n - 1) { const k = Math.min(1, (tt - j * 14) / 11); if (k < 1) dot = lerp(out(j), inn(j + 1), k); }
      for (let q = 0; q <= round; q++) for (let j2 = 0; j2 < n - 1; j2++) arrive[j2 + 1].push(t0 + q * cyc + j2 * 14 + 11);
    }
  }
  const pulse = (i: number) => Math.max(0, ...arrive[i].map((t) => (lf >= t ? 1 - Math.min(1, (lf - t) / 16) : 0)));
  const txt = names.map((t, i) => fitLines(t, bw * (i === bi ? 0.6 : 0.8), bh * 0.62, 2, 300, st.tracking));
  const fs = Math.min(...txt.map((t) => t.fs), 54 * u);
  const sw = Math.max(1.5, 2.5 * u);
  const head = (p: number[], ang: number, c: string, k: number) => <path d={`M 0 0 L ${-16 * u} ${-8 * u} L ${-16 * u} ${8 * u} Z`} transform={`translate(${p[0]} ${p[1]}) rotate(${ang})`} fill={c} opacity={k} />;
  const tag = (text: string, p: number[], c: string, k: number) => {
    const f = Math.min(34 * u, fit(text, tall ? W * 0.3 : W * 0.2, 34 * u, 400, st.tracking));
    return <div style={{position: 'absolute', left: p[0], top: p[1], transform: 'translate(-50%, -50%)', padding: `${6 * u}px ${16 * u}px`, borderRadius: 30 * u, background: 'rgba(9,11,15,0.88)', border: `${Math.max(1, 1.5 * u)}px solid ${hexA(c, 0.6)}`, ...type(st, f, c, 400), opacity: k}}>{text}</div>;
  };
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="deep" glow={HUE.teal} lf={lf} x={50} y={56} strength={0.14} />
      <Box r={r}>
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          {names.map((_, i) => {
            if (i === 0) return null;
            const k = k01(lf, at[i] - 14, at[i] - 2);
            const a = out(i - 1), b = inn(i), tip = lerp(a, b, k);
            return (
              <g key={'a' + i} opacity={k > 0 ? 1 : 0}>
                <line x1={a[0]} y1={a[1]} x2={tip[0]} y2={tip[1]} stroke={ink} strokeOpacity={0.6} strokeWidth={sw} strokeLinecap="round" />
                {head(tip, tall ? 90 : 0, ink, Math.min(1, k * 3) * 0.8)}
              </g>
            );
          })}
          {loop && (
            <g opacity={kL > 0 ? 1 : 0}>
              <path d={`M ${loop[0][0]} ${loop[0][1]} C ${loop[1][0]} ${loop[1][1]}, ${loop[2][0]} ${loop[2][1]}, ${loop[3][0]} ${loop[3][1]}`} fill="none" stroke={col2} strokeWidth={sw * 1.2} strokeLinecap="round" strokeDasharray={`${10 * u} ${9 * u}`} opacity={0.9} visibility={kL >= 1 ? 'visible' : 'hidden'} />
              {kL < 1 && Array.from({length: 24}, (_, s) => (s / 24 < kL ? <line key={s} x1={bez(loop, s / 24)[0]} y1={bez(loop, s / 24)[1]} x2={bez(loop, Math.min(kL, (s + 0.55) / 24))[0]} y2={bez(loop, Math.min(kL, (s + 0.55) / 24))[1]} stroke={col2} strokeWidth={sw * 1.2} strokeLinecap="round" /> : null))}
              {head(loop[3], tall ? 180 : 90, col2, kL >= 1 ? 1 : 0)}
            </g>
          )}
          {names.map((_, i) => {
            const k = k01(lf, at[i] - 2, at[i] + 12);
            const c = i === bi ? col2 : i === n - 1 ? st.accentHi : colorAt(items[i], i, hueOf(it, HUE.teal));
            const p = pulse(i);
            const [x, y] = C[i];
            const shape = i === bi
              ? <path d={`M ${-bw / 2} 0 L 0 ${(-bh / 2) * dia} L ${bw / 2} 0 L 0 ${(bh / 2) * dia} Z`} fill={c} fillOpacity={0.1 + 0.26 * p} stroke={c} strokeWidth={sw * 1.2} strokeLinejoin="round" />
              : <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={20 * u} fill={c} fillOpacity={0.1 + 0.26 * p} stroke={c} strokeWidth={sw * 1.2} />;
            return <g key={'b' + i} transform={`translate(${x} ${y + (1 - k) * 18 * u}) scale(${1 + 0.03 * p})`} opacity={k}>{shape}</g>;
          })}
          {dot && <circle cx={dot[0]} cy={dot[1]} r={10 * u} fill={ink} />}
        </svg>
        {names.map((_, i) => {
          const k = k01(lf, at[i], at[i] + 12);
          const lines = txt[i].lines;
          return (
            <div key={i} style={{position: 'absolute', left: C[i][0] - bw / 2, top: C[i][1] - (lines.length * fs * 1.12) / 2, width: bw, textAlign: 'center', opacity: k}}>
              {lines.map((l, j) => <div key={j} style={{...type(st, fs, ink, 300)}}>{l}</div>)}
            </div>
          );
        })}
        {loop && no && tag(no, bez(loop, 0.5), col2, k01(lf, tL + 6, tL + 18))}
        {loop && yes && bi < n - 1 && tag(yes, tall ? [C[bi][0] + bw * 0.3, (out(bi)[1] + inn(bi + 1)[1]) / 2] : [(out(bi)[0] + inn(bi + 1)[0]) / 2, C[bi][1] - bh / 2 - 34 * u], st.accentHi, k01(lf, at[bi + 1] - 8, at[bi + 1] + 4))}
      </Box>
    </>
  );
};
export default FlowChart;

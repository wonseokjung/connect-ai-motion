// Orbit: one thing in the middle, the others circle it on tilted rings, each at its own distance and speed.
// A body that passes in front is larger and covers the centre; behind it is smaller and dimmer. Ours.
import React from 'react';
import {random} from 'remotion';
import {Box, SceneProps, fit, fitLines, hueOf, itemAt, itemText, itemsOf, k01, measure, type} from '../../../src/catalog/ui';
import {Stage, colorAt, useSvgId} from '../../../src/parts/Picture';

const Orbit: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W: FW, H: FH, tall}) => {
  const items = itemsOf(it).slice(0, 6);
  const n = Math.max(1, items.length);
  const names = items.map(itemText);
  const text = String(it.text || '');
  const cCol = hueOf(it, st.accent);
  const id = useSvgId('ob');
  const seed = String(it.seed ?? names.join('|'));
  const W = r[2], H = r[3];
  const cx = W / 2, cy = H / 2;
  const aMax = tall ? H * 0.46 : W * 0.46, aMin = aMax * (n > 3 ? 0.36 : 0.46), sq = tall ? 0.52 : 0.4;
  const phi = ((tall ? 6 : -9) * Math.PI) / 180;
  const Rc = (tall ? 132 : 124) * u;
  const at = names.map((_, i) => itemAt(it, i, n, dur, fps));
  // a point on ring j at angle th: [x, y, depth] (depth > 0 = in front of the centre)
  const P = (a: number, th: number) => {
    const major = a * Math.cos(th), minor = a * sq * Math.sin(th);
    const x0 = tall ? minor : major, y0 = tall ? major : minor;
    return [cx + x0 * Math.cos(phi) - y0 * Math.sin(phi), cy + x0 * Math.sin(phi) + y0 * Math.cos(phi), Math.sin(th)];
  };
  const ringPath = (a: number, from: number, to: number) => {
    let d = '';
    for (let s = 0; s <= 48; s++) { const [x, y] = P(a, from + ((to - from) * s) / 48); d += `${s ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `; }
    return d;
  };
  const bodies = names.map((t, j) => {
    const a = n === 1 ? aMax * 0.8 : aMin + ((aMax - aMin) * j) / (n - 1);
    const w = ((2 * Math.PI) / 190) * Math.pow(aMin / a, 0.9);
    const th = random(seed + 'th' + j) * Math.PI * 2 + lf * w;
    const [x, y, z] = P(a, th);
    const k = k01(lf, at[j] - 2, at[j] + 16);
    return {j, t, a, x, y, z, k, R: (38 + 8 * ((j * 2) % 3)) * u * (1 + 0.3 * z), col: colorAt(items[j], j)};
  });
  const fs = Math.min(46 * u, ...names.map((t) => fit(t, W * (tall ? 0.36 : 0.22), (tall ? 42 : 46) * u, 300, st.tracking)));
  const cT = fitLines(text, Rc * 1.56, Rc * 1.0, 2, 400, st.tracking);
  const cK = k01(lf, 0, 14);
  const body = (b: (typeof bodies)[number]) => (
    <g key={'b' + b.j} opacity={b.k * (b.z < 0 ? 0.62 + 0.38 * (1 + b.z) : 1)} transform={`translate(${b.x} ${b.y}) scale(${0.3 + 0.7 * b.k})`}>
      <circle r={b.R} fill={b.col} />
      <circle r={b.R} fill={`url(#${id}s)`} />
    </g>
  );
  const label = (b: (typeof bodies)[number]) => (
    // far from the centre the name sits under its body; near the centre it moves to the outer side, so it never lies on the centre
    (() => {
      const right = b.x >= cx;
      const lw = W * (tall ? 0.36 : 0.22), tw = measure(b.t, fs, 300, st.tracking);
      // the name sits on the outer side of its body, so it never lies on the centre; under it when there is no room
      const near = right ? b.x + b.R + 14 * u + tw <= W + 40 * u : b.x - b.R - 14 * u - tw >= -40 * u;
      const left = near ? (right ? b.x + b.R + 14 * u : b.x - b.R - 14 * u - lw) : Math.max(-40 * u, Math.min(W + 40 * u - lw, b.x - lw / 2));
      return <div key={'l' + b.j} style={{position: 'absolute', left, top: near ? b.y - fs * 0.6 : b.y + b.R + 10 * u, width: lw, textAlign: near ? (right ? 'left' : 'right') : 'center', ...type(st, fs, ink, 300), opacity: k01(lf, at[b.j] + 4, at[b.j] + 18) * (b.z < 0 ? 0.6 : 1)}}>{b.t}</div>;
    })()
  );
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="plum" glow={cCol} lf={lf} x={50} y={50} strength={0.18} />
      <Box r={r}>
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          <defs>
            <radialGradient id={id + 's'} cx="0.34" cy="0.3" r="0.9"><stop offset="0" stopColor="#fff" stopOpacity={0.42} /><stop offset="0.45" stopColor="#fff" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.5} /></radialGradient>
          </defs>
          {bodies.map((b) => <path key={'g' + b.j} d={ringPath(b.a, 0, Math.PI * 2)} fill="none" stroke={st.ink} strokeOpacity={0.1 * cK} strokeWidth={Math.max(1, 1.2 * u)} />)}
          {bodies.map((b) => <path key={'r' + b.j} d={ringPath(b.a, 0, Math.PI * 2)} fill="none" stroke={b.col} strokeOpacity={0.36} strokeWidth={Math.max(1, 1.6 * u)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k01(lf, at[b.j] - 6, at[b.j] + 22)} />)}
          {bodies.filter((b) => b.z < 0).map(body)}
          <g transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * cK})`} opacity={cK}>
            <circle r={Rc} fill={cCol} />
            <circle r={Rc} fill={`url(#${id}s)`} />
          </g>
          {bodies.map((b) => <path key={'f' + b.j} d={ringPath(b.a, 0.12, Math.PI - 0.12)} fill="none" stroke={b.col} strokeOpacity={0.5 * k01(lf, at[b.j] + 10, at[b.j] + 24)} strokeWidth={Math.max(1, 1.6 * u)} />)}
          {bodies.filter((b) => b.z >= 0).sort((p, q) => p.z - q.z).map(body)}
        </svg>
        <div style={{position: 'absolute', left: cx - Rc, top: cy - (cT.lines.length * cT.fs * 1.12) / 2, width: Rc * 2, textAlign: 'center', opacity: k01(lf, 4, 16)}}>
          {cT.lines.map((l, i) => <div key={i} style={{...type(st, cT.fs, st.inkOnLight, 400)}}>{l}</div>)}
        </div>
        {bodies.map(label)}
      </Box>
    </>
  );
};
export default Orbit;

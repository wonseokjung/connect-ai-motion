// Node graph: nodes appear around a hub, an edge draws from each one to the hub (or along your own links),
// and small signals keep travelling along the edges into the hub. Everything floats a little. Ours.
import React from 'react';
import {random} from 'remotion';
import {Box, SceneProps, fit, fitLines, hexA, hueOf, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';
import {Stage, colorAt, startAt} from '../../../src/parts/Picture';

const NodeGraph: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W: FW, H: FH, tall}) => {
  const items = itemsOf(it).slice(0, 9);
  const n = Math.max(1, items.length);
  const names = items.map(itemText);
  const hiName = String(it.hi || '').toLowerCase();
  const hub = Math.max(0, names.findIndex((t) => t.toLowerCase() === hiName));
  const hubCol = hueOf(it, st.accent);
  const seed = String(it.seed ?? names.join('|'));
  const W = r[2], H = r[3];
  const cx = W / 2, cy = H / 2;
  const rx = W * (tall ? 0.38 : 0.33), ry = H * (tall ? 0.4 : 0.4);
  const outer = names.map((_, i) => i).filter((i) => i !== hub);
  const m = Math.max(1, outer.length);
  const pos: number[][] = [];
  const ang: number[] = [];
  outer.forEach((i, j) => {
    const a = ((-90 + (360 * (j + 0.5)) / m + (random(seed + 'a' + j) - 0.5) * (m > 5 ? 8 : 16)) * Math.PI) / 180;
    const rr = 0.84 + 0.16 * random(seed + 'r' + j);
    ang[i] = a;
    pos[i] = [cx + Math.cos(a) * rx * rr + Math.sin(lf / 52 + j * 2.1) * 9 * u, cy + Math.sin(a) * ry * rr + Math.cos(lf / 66 + j * 1.3) * 9 * u];
  });
  pos[hub] = [cx + Math.sin(lf / 90) * 5 * u, cy + Math.cos(lf / 110) * 5 * u];
  const at = names.map((_, i) => startAt(it, items, i, n, dur, fps));
  const links: number[][] = Array.isArray(it.links) && it.links.length ? it.links.map((l: any) => [Number(l[0]), Number(l[1])]).filter((l: number[]) => pos[l[0]] && pos[l[1]] && l[0] !== l[1]) : outer.map((i) => [i, hub]);
  const Rh = (tall ? 132 : 128) * u, Rn = (tall ? 34 : 32) * u;
  const rad = (i: number) => (i === hub ? Rh : Rn);
  const col = (i: number) => (i === hub ? hubCol : colorAt(items[i], outer.indexOf(i)));
  const edges = links.map(([a, b], e) => {
    const t0 = Math.max(at[a], at[b]) + 2;
    const k = k01(lf, t0, t0 + 14);
    const [x0, y0] = pos[a], [x1, y1] = pos[b];
    const L = Math.max(1, Math.hypot(x1 - x0, y1 - y0)), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    const sx = x0 + ux * (rad(a) + 8 * u), sy = y0 + uy * (rad(a) + 8 * u), ex = x1 - ux * (rad(b) + 8 * u), ey = y1 - uy * (rad(b) + 8 * u);
    // a signal runs from a to b again and again once the edge is there
    const period = 46, ph = ((lf - t0 - 14) / period + random(seed + 'p' + e)) % 1;
    return {e, a, b, k, sx, sy, ex, ey, ph: lf > t0 + 14 ? ph : -1};
  });
  const arrived = edges.filter((e) => e.k >= 1 && e.b === hub).length / Math.max(1, links.filter((l) => l[1] === hub).length);
  const hubK = k01(lf, at[hub] - 2, at[hub] + 12);
  const hubT = fitLines(names[hub] || '', Rh * 1.56, Rh * 1.0, 2, 300, st.tracking);
  const labW = tall ? W * 0.42 : W * 0.17;
  const fs = Math.min(...outer.map((i) => fit(names[i], labW, (tall ? 46 : 52) * u, 300, st.tracking)));
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="slate" glow={hubCol} lf={lf} x={50} y={52} strength={0.16} />
      <Box r={r}>
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          {edges.map((e) => (
            <g key={e.e}>
              <line x1={e.sx} y1={e.sy} x2={e.sx + (e.ex - e.sx) * e.k} y2={e.sy + (e.ey - e.sy) * e.k} stroke={col(e.a)} strokeOpacity={0.7} strokeWidth={Math.max(2, 3.5 * u)} strokeLinecap="round" />
              {e.ph >= 0 && <circle cx={e.sx + (e.ex - e.sx) * e.ph} cy={e.sy + (e.ey - e.sy) * e.ph} r={9 * u} fill={ink} opacity={Math.min(1, e.ph * 6, (1 - e.ph) * 6)} />}
            </g>
          ))}
          <g transform={`translate(${pos[hub][0]} ${pos[hub][1]}) scale(${0.7 + 0.3 * hubK})`} opacity={hubK}>
            <circle r={Rh} fill={st.bg} />
            <circle r={Rh} fill={hubCol} fillOpacity={0.1 + 0.2 * arrived} stroke={hubCol} strokeWidth={Math.max(2, 3 * u)} />
            <circle r={Rh + 14 * u} fill="none" stroke={hexA(hubCol, 0.4)} strokeWidth={Math.max(1, 1.5 * u)} strokeDasharray={`${4 * u} ${10 * u}`} transform={`rotate(${lf * 0.3})`} />
          </g>
          {outer.map((i) => <circle key={'g' + i} cx={pos[i][0]} cy={pos[i][1]} r={Rn * 0.7} fill="none" stroke={col(i)} strokeOpacity={0.3 * k01(lf, 0, 12)} strokeWidth={Math.max(1, 1.5 * u)} strokeDasharray={`${3 * u} ${6 * u}`} />)}
          {outer.map((i) => {
            const k = k01(lf, at[i] - 2, at[i] + 12);
            return (
              <g key={i} transform={`translate(${pos[i][0]} ${pos[i][1]}) scale(${0.4 + 0.6 * k})`} opacity={k}>
                <circle r={Rn + 10 * u} fill={col(i)} fillOpacity={0.16} />
                <circle r={Rn} fill={col(i)} />
                <circle r={Rn * 0.36} fill={st.bg} />
              </g>
            );
          })}
        </svg>
        <div style={{position: 'absolute', left: pos[hub][0] - Rh, top: pos[hub][1] - (hubT.lines.length * hubT.fs * 1.12) / 2, width: Rh * 2, textAlign: 'center', opacity: k01(lf, at[hub] + 2, at[hub] + 14)}}>
          {hubT.lines.map((l, i) => <div key={i} style={{...type(st, hubT.fs, ink, 300)}}>{l}</div>)}
        </div>
        {outer.map((i) => {
          const k = k01(lf, at[i] + 2, at[i] + 14);
          const c = Math.cos(ang[i]), s = Math.sin(ang[i]);
          const side = tall || Math.abs(c) < 0.34;
          const left = side ? pos[i][0] - labW / 2 : c > 0 ? pos[i][0] + Rn + 20 * u : pos[i][0] - Rn - 20 * u - labW;
          const top = side ? (s < 0 ? pos[i][1] - Rn - 18 * u - fs * 1.15 : pos[i][1] + Rn + 16 * u) : pos[i][1] - fs * 0.6;
          return <div key={i} style={{position: 'absolute', left: Math.max(0, Math.min(W - labW, left)), top, width: labW, textAlign: side ? 'center' : c > 0 ? 'left' : 'right', ...type(st, fs, ink, 300), opacity: k}}>{names[i]}</div>;
        })}
      </Box>
    </>
  );
};
export default NodeGraph;

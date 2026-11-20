// Learning on a grid: a dot tries to reach the goal. The first tries wander and stop (drawn faint); at the
// "solve" cue the last try goes straight there and its cells light up. A picture of trial and error
// (a simulator, a search, a route). Ours.
import React from 'react';
import {random} from 'remotion';
import {HUE, SceneProps, Words, caps, cueAt, fitLines, hexA, hueOf, k01, type} from '../../../src/catalog/ui';
import {Stage} from '../../../src/parts/Picture';

type P = [number, number];

function world(cols: number, rows: number, seed: string) {
  const start: P = [0, rows - 1], goal: P = [cols - 1, 0];
  const key = (p: P) => p[0] + ',' + p[1];
  // walls: seeded, never on the start or the goal; redraw until a way exists
  for (let attempt = 0; attempt < 30; attempt++) {
    const walls = new Set<string>();
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) if (random(`${seed}-w${attempt}-${x}-${y}`) < 0.2 && key([x, y]) !== key(start) && key([x, y]) !== key(goal)) walls.add(key([x, y]));
    // breadth-first search for the shortest way
    const prev = new Map<string, P | null>([[key(start), null]]);
    const q: P[] = [start];
    while (q.length) {
      const p = q.shift()!;
      if (key(p) === key(goal)) break;
      for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0], [0, 1]]) {
        const n: P = [p[0] + dx, p[1] + dy];
        if (n[0] < 0 || n[1] < 0 || n[0] >= cols || n[1] >= rows || walls.has(key(n)) || prev.has(key(n))) continue;
        prev.set(key(n), p);
        q.push(n);
      }
    }
    if (!prev.has(key(goal))) continue;
    const best: P[] = [];
    for (let p: P | null = goal; p; p = prev.get(key(p)) || null) best.unshift(p);
    // failed tries: random walks that stop after a while
    const tries: P[][] = [];
    for (let t = 0; t < 3; t++) {
      const path: P[] = [start];
      const seen = new Set([key(start)]);
      let p = start;
      for (let s = 0; s < 6 + t * 3; s++) {
        const opts = ([[1, 0], [0, -1], [-1, 0], [0, 1]] as P[]).map(([dx, dy]) => [p[0] + dx, p[1] + dy] as P).filter((n) => n[0] >= 0 && n[1] >= 0 && n[0] < cols && n[1] < rows && !walls.has(key(n)) && !seen.has(key(n)) && key(n) !== key(goal));
        if (!opts.length) break;
        p = opts[Math.floor(random(`${seed}-t${t}-${s}`) * opts.length)];
        seen.add(key(p));
        path.push(p);
      }
      tries.push(path);
    }
    return {start, goal, walls, best, tries};
  }
  return {start, goal, walls: new Set<string>(), best: [start, goal] as P[], tries: [] as P[][]};
}

const GridPath: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W, H, tall}) => {
  const good = hueOf(it, HUE.teal);
  const bad = HUE.coral;
  const text = String(it.text || ''), sub = String(it.sub || '');
  const cols = tall ? 6 : 10, rows = tall ? 8 : 6;
  const w = React.useMemo(() => world(cols, rows, String(it.seed || it.text || 'grid')), [cols, rows, it.seed, it.text]);
  const words = !!(text || sub);
  const gw = tall ? r[2] : r[2] * (words ? 0.62 : 0.8), gh = tall ? r[3] * (words ? 0.74 : 0.92) : r[3] * 0.94;
  const cell = Math.min(gw / cols, gh / rows);
  const gx = r[0] + (tall ? (r[2] - cell * cols) / 2 : words ? r[2] - cell * cols : (r[2] - cell * cols) / 2), gy = r[1] + (tall ? (words ? r[3] - cell * rows : (r[3] - cell * rows) / 2) : (r[3] - cell * rows) / 2);
  const solve = cueAt(it, 'solve', Math.round(dur * 0.52));
  const xy = (p: P) => [gx + (p[0] + 0.5) * cell, gy + (p[1] + 0.5) * cell];
  const line = (path: P[], n: number) => path.slice(0, Math.max(1, Math.ceil(n) + 1)).map((p, i, arr) => {
    let [x, y] = xy(p);
    if (i === arr.length - 1 && i > 0 && n < i) { const [px, py] = xy(arr[i - 1]); const k = n - (i - 1); x = px + (x - px) * k; y = py + (y - py) * k; }
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  // each failed try gets an equal slice of the time before the cue
  const slice = Math.max(8, (solve - 6) / Math.max(1, w.tries.length));
  const bestN = k01(lf, solve, solve + Math.max(14, w.best.length * 2.4), (t) => t) * (w.best.length - 1);
  const [hx, hy] = (() => {
    const i = Math.min(w.best.length - 2, Math.floor(bestN)), k = bestN - i;
    const a = xy(w.best[Math.max(0, i)]), b = xy(w.best[Math.min(w.best.length - 1, i + 1)]);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  })();
  const arrived = k01(lf, solve + Math.max(14, w.best.length * 2.4), solve + Math.max(14, w.best.length * 2.4) + 10);
  const pulse = 1 + Math.sin(Math.max(0, lf) / 7) * 0.06;
  const {fs, lines} = fitLines(text, tall ? r[2] : r[2] * 0.32, tall ? r[3] * 0.14 : r[3] * 0.4, tall ? 2 : 3, st.weight, st.tracking);
  const [gxg, gyg] = xy(w.goal), [sx, sy] = xy(w.start);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Stage it={it} W={W} H={H} d="deep" glow={good} lf={lf} x={tall ? 50 : 66} strength={0.16} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: cols * rows}, (_, i) => {
          const x = i % cols, y = Math.floor(i / cols);
          const k = k01(lf, (x + (rows - y)) * 0.9, (x + (rows - y)) * 0.9 + 10);
          const wall = w.walls.has(x + ',' + y);
          const bi = w.best.findIndex((p) => p[0] === x && p[1] === y);
          const lit = bi >= 0 ? k01(bestN, bi - 0.4, bi + 0.4) : 0;
          return <rect key={i} x={gx + x * cell + cell * 0.05} y={gy + y * cell + cell * 0.05} width={cell * 0.9} height={cell * 0.9} rx={cell * 0.1} fill={wall ? hexA(st.ink, 0.2) : lit > 0 ? hexA(good, 0.08 + 0.24 * lit) : hexA(st.ink, 0.045)} stroke={hexA(st.ink, wall ? 0 : 0.1)} strokeWidth={Math.max(1, 1.2 * u)} opacity={k} />;
        })}
        {w.tries.map((path, t) => {
          const t0 = 6 + t * slice;
          const n = k01(lf, t0, t0 + slice * 0.8, (x) => x) * (path.length - 1);
          const fade = 1 - 0.6 * k01(lf, t0 + slice * 0.8, t0 + slice * 1.2);
          if (lf < t0) return null;
          const end = xy(path[Math.min(path.length - 1, Math.round(n))]);
          const stopped = k01(lf, t0 + slice * 0.8, t0 + slice * 0.8 + 6);
          return (
            <g key={t} opacity={fade}>
              <path d={line(path, n)} fill="none" stroke={bad} strokeWidth={Math.max(2, cell * 0.06)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${cell * 0.12} ${cell * 0.14}`} />
              <path d={`M${end[0] - cell * 0.14} ${end[1] - cell * 0.14} l${cell * 0.28} ${cell * 0.28} M${end[0] + cell * 0.14} ${end[1] - cell * 0.14} l${-cell * 0.28} ${cell * 0.28}`} stroke={bad} strokeWidth={Math.max(2, cell * 0.06)} strokeLinecap="round" opacity={stopped} />
            </g>
          );
        })}
        {lf >= solve && <path d={line(w.best, bestN)} fill="none" stroke={good} strokeWidth={Math.max(3, cell * 0.1)} strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={sx} cy={sy} r={cell * 0.16} fill="none" stroke={hexA(st.ink, 0.6)} strokeWidth={Math.max(2, cell * 0.04)} opacity={k01(lf, 2, 12)} />
        <rect x={gxg - cell * 0.24} y={gyg - cell * 0.24} width={cell * 0.48} height={cell * 0.48} rx={cell * 0.08} fill={arrived > 0.5 ? st.accentHi : 'none'} stroke={st.accentHi} strokeWidth={Math.max(2, cell * 0.05)} transform={`rotate(45 ${gxg} ${gyg}) scale(1)`} style={{transformOrigin: `${gxg}px ${gyg}px`, transform: `rotate(45deg) scale(${pulse + arrived * 0.15})`}} opacity={k01(lf, 4, 14)} />
        {lf >= solve && <circle cx={hx} cy={hy} r={cell * 0.2} fill={good} />}
      </svg>
      {words && (
        <div style={{position: 'absolute', left: r[0], top: tall ? r[1] : r[1] + (r[3] - lines.length * fs * 1.12) / 2 - (sub ? 22 * u : 0), width: tall ? r[2] : r[2] * 0.34}}>
          {sub && <div style={{...caps(st, 26 * u, good), marginBottom: 14 * u, opacity: k01(lf, 6, 18)}}>{sub}</div>}
          {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={8 + i * 5} /></div>)}
        </div>
      )}
    </div>
  );
};
export default GridPath;

// Isometric city: blocks rise from the ground, back rows first; windows come on one by one.
// With "items", the values you said become towers in a colour, each with its number. Plain SVG, our own projection.
import React from 'react';
import {random} from 'remotion';
import {HUE, SceneProps, caps, fit, itemAt, itemText, itemsOf, k01, stageOf, type} from '../../../src/catalog/ui';

const rgb = (c: string) => {
  const h = c.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const shade = (c: string, k: number) => {
  const [r, g, b] = rgb(c);
  return `rgb(${Math.round(Math.min(255, r * k))},${Math.round(Math.min(255, g * k))},${Math.round(Math.min(255, b * k))})`;
};
const num = (s: any) => {
  const v = parseFloat(String(s ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(v) ? v : 0;
};
const SPOTS = [[0.16, 0.72], [0.3, 0.46], [0.56, 0.3], [0.78, 0.14]]; // where towers stand (share of the grid), left to right on screen
const TONES = ['teal', 'coral', 'sky', 'violet'];

const IsoCity: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, W, H, tall}) => {
  const items = itemsOf(it).slice(0, 4);
  const n = items.length;
  const N = tall ? 6 : 8;
  const seed = String(it.seed ?? 'city');
  const tw = (W * (tall ? 1.16 : 1.0)) / N, th = tw * (tall ? 0.8 : 0.5);
  const ox = W / 2, oy = H * (tall ? 0.58 : 0.63);
  const P = (gx: number, gy: number, h = 0) => [ox + ((gx - gy) * tw) / 2, oy + ((gx + gy - N) * th) / 2 - h];
  const pts = (a: number[][]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const stage = stageOf(it);
  const vals = items.map((x) => num(x?.value));
  const vMax = Math.max(1e-6, ...vals);
  const pick = n === 1 ? [1] : n === 2 ? [1, 2] : n === 3 ? [0, 1, 3] : [0, 1, 2, 3];
  const towers = new Map<string, number>();
  // a tower's share of the tallest: from its value, or (no values) a skyline of different heights
  const share = (i: number) => (vals[i] > 0 ? Math.max(0.3, vals[i] / vMax) : [0.8, 1, 0.88, 0.72][i % 4]);
  const labelRoom = (tall ? 60 : 46) * u + 76 * u * 1.15 + 26 * u * 1.6 + 16 * u;
  let hMax = H * (tall ? 0.34 : 0.44);
  items.forEach((_, i) => {
    const s = SPOTS[pick[i]];
    const gx = Math.min(N - 1, Math.round(s[0] * (N - 1))), gy = Math.min(N - 1, Math.round(s[1] * (N - 1)));
    towers.set(`${gx},${gy}`, i);
    // the tallest tower and its label stay inside the frame
    hMax = Math.min(hMax, (oy + ((gx + gy + 1 - N) * th) / 2 - labelRoom - (tall ? r[1] : H * 0.03)) / share(i));
  });
  const blocks: {gx: number; gy: number; ti: number}[] = [];
  for (let gx = 0; gx < N; gx++) for (let gy = 0; gy < N; gy++) blocks.push({gx, gy, ti: towers.has(`${gx},${gy}`) ? towers.get(`${gx},${gy}`)! : -1});
  blocks.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const g = 0.13;
  const labels: React.ReactNode[] = [];
  const drift = Math.sin(lf / 120) * 10 * u;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: stage || undefined}}>
      <svg width={W} height={H} style={{position: 'absolute', left: drift, top: 0, overflow: 'visible'}}>
        <polygon points={pts([P(0, 0), P(N, 0), P(N, N), P(0, N)])} fill="rgba(235,226,210,0.035)" stroke={st.faint} strokeWidth={Math.max(1, 1.2 * u)} />
        {Array.from({length: N - 1}, (_, i) => (
          <React.Fragment key={i}>
            <line x1={P(i + 1, 0)[0]} y1={P(i + 1, 0)[1]} x2={P(i + 1, N)[0]} y2={P(i + 1, N)[1]} stroke={st.ink} strokeOpacity={0.06} strokeWidth={1} />
            <line x1={P(0, i + 1)[0]} y1={P(0, i + 1)[1]} x2={P(N, i + 1)[0]} y2={P(N, i + 1)[1]} stroke={st.ink} strokeOpacity={0.06} strokeWidth={1} />
          </React.Fragment>
        ))}
        {blocks.map(({gx, gy, ti}) => {
          const id = `${seed}-${gx}-${gy}`;
          const rnd = random(id);
          const mid = 1 - Math.hypot(gx - (N - 1) / 2, gy - (N - 1) / 2) / (N * 0.75);
          const isT = ti >= 0;
          const col = isT ? HUE[items[ti]?.color] || HUE[TONES[ti % TONES.length]] : '';
          const hFull = isT ? hMax * share(ti) : hMax * (n ? 0.4 : 0.8) * (0.14 + 0.86 * rnd * rnd) * (0.45 + 0.75 * Math.max(0, mid));
          const start = isT ? itemAt(it, ti, n, dur, fps) : 1 + (gx + gy) * 1.5 + random(id + 'd') * 8;
          const k = k01(lf, start, start + (isT ? 26 : 20));
          const h = hFull * k;
          if (k <= 0) return null;
          const x0 = gx + g, x1 = gx + 1 - g, y0 = gy + g, y1 = gy + 1 - g;
          const base = isT ? col : ['#3d362e', '#463e35', '#353028', '#514636'][Math.floor(rnd * 4)];
          const left = [P(x0, y1), P(x1, y1), P(x1, y1, h), P(x0, y1, h)];
          const right = [P(x1, y0), P(x1, y1), P(x1, y1, h), P(x1, y0, h)];
          const top = [P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)];
          // windows on the two faces that look at us: short dashes, a few of them lit, more as time passes
          const win: React.ReactNode[] = [];
          const rows = Math.floor(hFull / (th * 0.52));
          if (rows >= 2) {
            for (let face = 0; face < 2; face++) {
              for (let row = 0; row < rows; row++) {
                const hy = (row + 0.6) * (hFull / rows);
                if (hy + (hFull / rows) * 0.3 > h) continue;
                for (let c = 0; c < 2; c++) {
                  const wr = random(`${id}-${face}-${row}-${c}`);
                  const on = wr < (isT ? 0.5 : 0.3) && lf > start + 20 + random(`${id}-t-${face}-${row}-${c}`) * dur * 0.75;
                  const a0 = 0.18 + c * 0.38, a1 = a0 + 0.26, hh = (hFull / rows) * 0.34;
                  const q = face === 0 ? [P(x0 + (x1 - x0) * a0, y1, hy), P(x0 + (x1 - x0) * a1, y1, hy), P(x0 + (x1 - x0) * a1, y1, hy + hh), P(x0 + (x1 - x0) * a0, y1, hy + hh)] : [P(x1, y0 + (y1 - y0) * a0, hy), P(x1, y0 + (y1 - y0) * a1, hy), P(x1, y0 + (y1 - y0) * a1, hy + hh), P(x1, y0 + (y1 - y0) * a0, hy + hh)];
                  win.push(<polygon key={`${face}-${row}-${c}`} points={pts(q)} fill={on ? (isT ? '#F6F1E7' : '#F2B45A') : '#000'} opacity={on ? (isT ? 0.7 : 0.7) : 0.22} />);
                }
              }
            }
          }
          if (isT) {
            const tp = P(gx + 0.5, gy + 0.5, h);
            const kl = k01(lf, start + 14, start + 30);
            const label = itemText(items[ti]), value = String(items[ti]?.value ?? '');
            const fsV = 76 * u, fsL = Math.min(26 * u, fit(label.toUpperCase() || 'X', W * (tall ? 0.3 : 0.2), 26 * u, st.heavy, 0.24));
            const lead = (tall ? 60 : 46) * u;
            labels.push(
              <div key={ti} style={{position: 'absolute', left: tp[0] + drift - 300 * u, width: 600 * u, top: tp[1] - lead - (value ? fsV * 1.15 : 0) - (label ? fsL * 1.6 : 0), textAlign: 'center', opacity: kl, transform: `translateY(${(1 - kl) * 14 * u}px)`}}>
                {value && <div style={{...type(st, fsV, col), fontVariantNumeric: 'tabular-nums'}}>{value}</div>}
                {label && <div style={{...caps(st, fsL, ink), marginTop: 4 * u}}>{label}</div>}
              </div>,
            );
            labels.push(<div key={'l' + ti} style={{position: 'absolute', left: tp[0] + drift - Math.max(0.75, u), top: tp[1] - lead * 0.82 * kl, width: Math.max(1.5, 2 * u), height: lead * 0.7 * kl, background: col, opacity: 0.8}} />);
          }
          return (
            <g key={id}>
              <polygon points={pts(left)} fill={shade(base, isT ? 0.46 : 0.5)} />
              <polygon points={pts(right)} fill={shade(base, isT ? 0.7 : 0.74)} />
              {win}
              <polygon points={pts(top)} fill={isT ? shade(base, 1.08) : shade(base, 1.12)} stroke={isT ? shade(base, 1.3) : 'rgba(235,226,210,0.16)'} strokeWidth={Math.max(1, 1.2 * u)} strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      {labels}
      {(it.text || it.sub) && (
        <div style={{position: 'absolute', left: r[0], top: r[1], width: r[2]}}>
          {it.sub && <div style={{...caps(st, 26 * u, st.accentHi), opacity: k01(lf, 4, 16)}}>{String(it.sub)}</div>}
          {it.text && <div style={{...type(st, fit(String(it.text), r[2] * (tall ? 1 : 0.5), 64 * u, st.weight, st.tracking), ink), marginTop: 10 * u, opacity: k01(lf, 8, 22)}}>{String(it.text)}</div>}
        </div>
      )}
    </div>
  );
};
export default IsoCity;

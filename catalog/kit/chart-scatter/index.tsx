// Scatter: dots settle on the plane from left to right, then the trend line (least squares, worked out from
// your points) draws through them and thin stems show how far each dot sits from it. Ours.
import React from 'react';
import {Box, HUE, SceneProps, caps, hexA, hueOf, k01} from '../../../src/catalog/ui';
import {Stage, num, useSvgId} from '../../../src/parts/Picture';

const ChartScatter: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W: FW, H: FH, tall}) => {
  const pts: number[][] = (Array.isArray(it.points) ? it.points : []).map((p: any) => [num(p?.[0] ?? p?.x), num(p?.[1] ?? p?.y)]).slice(0, 80);
  const N = Math.max(1, pts.length);
  const col = hueOf(it, HUE.sky), col2 = hueOf(it, HUE.coral, 'color2');
  const lx = String(it.label || ''), ly = String(it.label2 || '');
  const W = r[2], H = r[3];
  const px0 = W * 0.03, px1 = W * 0.97, py0 = H * (ly ? 0.12 : 0.05), py1 = H * (lx ? 0.88 : 0.95);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1e-6), y0 = Math.min(...ys), y1 = Math.max(...ys, y0 + 1e-6);
  const padX = (px1 - px0) * 0.08, padY = (py1 - py0) * 0.12;
  const X = (v: number) => px0 + padX + ((v - x0) / (x1 - x0)) * (px1 - px0 - 2 * padX);
  const Y = (v: number) => py1 - padY - ((v - y0) / (y1 - y0)) * (py1 - py0 - 2 * padY);
  // least squares
  const mx = xs.reduce((a, b) => a + b, 0) / N, my = ys.reduce((a, b) => a + b, 0) / N;
  const sxx = xs.reduce((a, b) => a + (b - mx) * (b - mx), 0) || 1e-6;
  const slope = xs.reduce((a, b, i) => a + (b - mx) * (ys[i] - my), 0) / sxx;
  const fy = (x: number) => my + slope * (x - mx);
  const order = pts.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  const rank = new Map(order.map((i, k) => [i, k]));
  const tA = dur * 0.52, tB = dur * 0.76;
  const lineK = k01(lf, tA, tB);
  const ex0 = x0 - (x1 - x0) * 0.06, ex1 = x1 + (x1 - x0) * 0.06;
  const R = (tall ? 22 : 19) * u;
  // how wide the cloud sits around the line (standard deviation of the distances)
  const sd = Math.sqrt(pts.reduce((a, p) => a + (p[1] - fy(p[0])) ** 2, 0) / N);
  const band = `M ${X(ex0)} ${Y(fy(ex0) + sd)} L ${X(ex1)} ${Y(fy(ex1) + sd)} L ${X(ex1)} ${Y(fy(ex1) - sd)} L ${X(ex0)} ${Y(fy(ex0) - sd)} Z`;
  const id = useSvgId('sc');
  const axK = k01(lf, 0, 18);
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="slate" glow={col} lf={lf} x={55} y={45} strength={0.16} />
      <Box r={r}>
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          <line x1={px0} y1={py1} x2={px0 + (px1 - px0) * axK} y2={py1} stroke={st.cardLine} strokeWidth={Math.max(1, 1.5 * u)} />
          <line x1={px0} y1={py1} x2={px0} y2={py1 - (py1 - py0) * axK} stroke={st.cardLine} strokeWidth={Math.max(1, 1.5 * u)} />
          <defs><clipPath id={id}><rect x={px0} y={py0 - 40 * u} width={(px1 - px0) * lineK} height={py1 - py0 + 40 * u} /></clipPath></defs>
          {Array.from({length: 4}, (_, i) => <line key={'g' + i} x1={px0} y1={py0 + ((py1 - py0) * (i + 0.5)) / 4} x2={px0 + (px1 - px0) * k01(lf, i * 2, 20 + i * 2)} y2={py0 + ((py1 - py0) * (i + 0.5)) / 4} stroke={st.ink} strokeOpacity={0.06} strokeWidth={Math.max(1, u)} />)}
          <path d={band} fill={col2} fillOpacity={0.1} clipPath={`url(#${id})`} />
          {pts.map((p, i) => {
            const k = k01(lf, tB - 4 + (rank.get(i)! / N) * 10, tB + 12 + (rank.get(i)! / N) * 10);
            const x = X(p[0]), y = Y(p[1]) + Math.sin(lf / 24 + i * 1.7) * 2.5 * u, ty = Y(fy(p[0]));
            return <line key={'s' + i} x1={x} y1={y} x2={x} y2={y + (ty - y) * k} stroke={hexA(col2, 0.5)} strokeWidth={Math.max(1, 1.5 * u)} strokeDasharray={`${3 * u} ${5 * u}`} />;
          })}
          <line x1={X(ex0)} y1={Y(fy(ex0))} x2={X(ex0 + (ex1 - ex0) * lineK)} y2={Y(fy(ex0 + (ex1 - ex0) * lineK))} stroke={col2} strokeWidth={Math.max(3, 5 * u)} strokeLinecap="round" opacity={lineK > 0 ? 1 : 0} />
          {pts.map((p, i) => {
            const f = (rank.get(i)! / N) * dur * 0.46;
            const k = k01(lf, f, f + 14);
            const x = X(p[0]), y = Y(p[1]) + Math.sin(lf / 24 + i * 1.7) * 2.5 * u - (1 - k) * 46 * u;
            return (
              <g key={i} opacity={k}>
                <circle cx={x} cy={y} r={R * 1.7} fill={col} fillOpacity={0.12} />
                <circle cx={x} cy={y} r={R} fill={col} />
                <circle cx={x - R * 0.28} cy={y - R * 0.3} r={R * 0.3} fill="#fff" fillOpacity={0.35} />
              </g>
            );
          })}
        </svg>
        {lx && <div style={{position: 'absolute', right: W - px1, top: py1 + 18 * u, ...caps(st, 26 * u, st.dim), opacity: k01(lf, 6, 20)}}>{lx}</div>}
        {ly && <div style={{position: 'absolute', left: px0, top: py0 - 50 * u, ...caps(st, 26 * u, st.dim), opacity: k01(lf, 6, 20)}}>{ly}</div>}
      </Box>
    </>
  );
};
export default ChartScatter;

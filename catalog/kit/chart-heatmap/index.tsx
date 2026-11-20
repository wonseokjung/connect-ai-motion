// Heat map: a grid of cells lights up in a wave; how strong a cell is shows its value. Then a slow scan keeps
// walking over the columns. The values are yours (a table, a week, the pixels of a picture). Ours.
import React from 'react';
import {Box, FONT, HUE, SceneProps, caps, fit, hexA, hueOf, itemText, k01, type} from '../../../src/catalog/ui';
import {Stage, num} from '../../../src/parts/Picture';

const ChartHeatmap: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W: FW, H: FH, tall}) => {
  const raw: any[] = Array.isArray(it.values) ? it.values : [];
  const cols0 = Math.max(1, Number(it.cols) || 0);
  // values: rows of numbers, or one flat list cut into rows of "cols"
  const grid: number[][] = Array.isArray(raw[0]) ? raw.map((row: any[]) => row.map((v) => num(v))) : Array.from({length: Math.ceil(raw.length / cols0)}, (_, i) => raw.slice(i * cols0, (i + 1) * cols0).map((v) => num(v)));
  const R = Math.max(1, grid.length), C = Math.max(1, ...grid.map((g) => g.length));
  const flat = grid.flat();
  const lo = Math.min(...flat, 0), hi = Math.max(...flat, lo + 1e-6);
  const col = hueOf(it, HUE.coral), col2 = hueOf(it, HUE.goldHi, 'color2');
  const rowLab = (Array.isArray(it.items) ? it.items : []).slice(0, R).map(itemText);
  const colLab = (Array.isArray(it.lines) ? it.lines : []).slice(0, C).map(itemText);
  const head = String(it.text || '');
  const W = r[2], H = r[3];
  const labW = rowLab.length ? W * (tall ? 0.3 : 0.2) : 0;
  const fsR = rowLab.length ? Math.min(...rowLab.map((t: string) => fit(t, labW - 20 * u, 36 * u, 300, st.tracking))) : 0;
  const gy = (head ? 62 * u : 0), colH = colLab.length ? 52 * u : 0;
  const gx = labW, gw = W - gx, gh = H - gy - colH;
  const cw = gw / C, ch = gh / R, gap = Math.max(3, Math.min(8 * u, cw * 0.1, ch * 0.1));
  const rad = Math.min(st.radius * u * 0.7, cw * 0.22, ch * 0.22);
  const span = dur * 0.6;
  const mark: number[] | null = Array.isArray(it.hi) ? it.hi.map(Number) : null;
  const showNum = it.numbers === true;
  const fsN = Math.min(ch * 0.42, cw * 0.42);
  // after the wave: a quiet scan, one column at a time
  const scanT = (lf - span - 6) / Math.max(1, dur * 0.42);
  const scan = scanT > 0 ? Math.min(C - 1, Math.floor((scanT % 1.4) * C)) : -1;
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="wine" glow={col} lf={lf} x={60} y={48} strength={0.12} />
      <Box r={r}>
        {head && <div style={{position: 'absolute', left: 0, top: 0, ...caps(st, 28 * u, hexA(col2, 0.95)), opacity: k01(lf, 0, 12)}}>{head}</div>}
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          {grid.map((row, ri) => row.map((v, ci) => {
            const f = (ci / C) * span * 0.78 + (ri / R) * span * 0.22;
            const k = k01(lf, f, f + 12);
            const t = (v - lo) / (hi - lo);
            const x = gx + ci * cw + gap / 2, y = gy + ri * ch + gap / 2, w = cw - gap, h = ch - gap;
            const s = 0.55 + 0.45 * k;
            const lit = ci === scan ? 0.14 : 0;
            return (
              <g key={ri + '-' + ci} opacity={k} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s})`}>
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rad} fill={st.card} stroke={st.cardLine} strokeWidth={Math.max(1, u)} />
                {t > 0.001 && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rad} fill={t > 0.85 ? col2 : col} fillOpacity={Math.min(1, (t > 0.85 ? 0.92 : 0.12 + 0.86 * t) + lit)} />}
                {showNum && <text textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={fsN} fontWeight={300} fill={t > 0.6 ? st.inkOnLight : ink} fillOpacity={t > 0.6 ? 0.9 : 0.6} style={{fontVariantNumeric: 'tabular-nums'}}>{String(grid[ri][ci])}</text>}
              </g>
            );
          }))}
          {scan >= 0 && <rect x={gx + scan * cw + 1} y={gy + 1} width={cw - 2} height={gh - 2} rx={rad + gap / 2} fill="none" stroke={ink} strokeOpacity={0.4} strokeWidth={Math.max(1, 1.5 * u)} />}
          {mark && mark[0] < R && mark[1] < C && <rect x={gx + mark[1] * cw - 1} y={gy + mark[0] * ch - 1} width={cw + 2} height={ch + 2} rx={rad + gap / 2} fill="none" stroke={st.accentHi} strokeWidth={Math.max(2, 3 * u)} opacity={k01(lf, span, span + 12)} />}
        </svg>
        {rowLab.map((t: string, i: number) => {
          const f = (i / R) * span * 0.22;
          return <div key={'r' + i} style={{position: 'absolute', left: 0, top: gy + i * ch + ch / 2 - fsR * 0.6, width: labW - 20 * u, textAlign: 'right', ...type(st, fsR, mark && mark[0] === i ? ink : st.dim, 300), opacity: k01(lf, f, f + 12)}}>{t}</div>;
        })}
        {colLab.map((t: string, i: number) => {
          const f = (i / C) * span * 0.78;
          return <div key={'c' + i} style={{position: 'absolute', left: gx + i * cw, top: gy + gh + 12 * u, width: cw, textAlign: 'center', ...type(st, Math.min(30 * u, cw * 0.5), i === scan || (mark && mark[1] === i) ? ink : st.dim, 300), fontVariantNumeric: 'tabular-nums', opacity: k01(lf, f, f + 12)}}>{t}</div>;
        })}
      </Box>
    </>
  );
};
export default ChartHeatmap;

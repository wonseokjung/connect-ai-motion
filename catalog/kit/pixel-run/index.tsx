// A tiny game drawn with squares: the world scrolls, a small hero runs and jumps every block in its way.
// Everything is a grid of big pixels (far hills, near hills, ground, blocks, hero). Ours.
import React from 'react';
import {random} from 'remotion';
import {Box, HUE, SceneProps, Words, caps, fitLines, hueOf, k01, type} from '../../../src/catalog/ui';

// hero sprite, 8 x 9 pixels, two running poses and one jumping pose (1 = body, 2 = eye)
const POSE = [
  ['..1111..', '.111211.', '.111111.', '..1111..', '.111111.', '1.1111.1', '..1111..', '..1..1..', '.11..11.'],
  ['..1111..', '.111211.', '.111111.', '..1111..', '.111111.', '.11111.1', '..1111..', '.1....1.', '11.....1'],
  ['..1111..', '.111211.', '.111111.', '1.1111.1', '.111111.', '..1111..', '..1111..', '.1....1.', '.1....1.'],
];

const PixelRun: React.FC<SceneProps> = ({it, r, lf, st, ink, u, W, H, tall}) => {
  const hero = hueOf(it, HUE.coral);
  const land = HUE[String(it.ground || 'teal')] || String(it.ground || HUE.teal);
  const px = Math.round((tall ? 30 : 34) * u); // one game pixel
  const cols = Math.ceil(W / px) + 2, rows = Math.ceil(H / px);
  const floorRow = Math.round(rows * (tall ? 0.6 : 0.68));
  const f = Math.max(0, lf);
  const speed = 0.34; // pixels per frame
  const scroll = f * speed;
  const heroCol = Math.round(cols * (tall ? 0.3 : 0.28));
  // blocks on the ground every 22-30 columns, 1-3 pixels tall; the same world every render
  const seed = String(it.seed || it.text || 'run');
  const blocks: {c: number; h: number}[] = [];
  let c = 20;
  for (let i = 0; i < 40; i++) { blocks.push({c, h: 1 + Math.floor(random(`${seed}-h${i}`) * 3)}); c += 22 + Math.floor(random(`${seed}-g${i}`) * 9); }
  // the hero jumps so that the top of the arc is over each block
  const JUMP = 30; // frames in the air
  let air = 0;
  let inAir = false;
  for (const b of blocks) {
    const tPeak = (b.c + 0.5 - heroCol) / speed;
    const t = (f - (tPeak - JUMP / 2)) / JUMP;
    if (t > 0 && t < 1) { air = Math.sin(Math.PI * t) * (b.h + 2.6); inAir = true; }
  }
  const heroY = floorRow - 9 - Math.round(air);
  const pose = inAir ? POSE[2] : POSE[Math.floor(f / 5) % 2];
  const cells: React.ReactNode[] = [];
  const rect = (x: number, y: number, w: number, h: number, fill: string, key: string, op = 1) => cells.push(<rect key={key} x={x * px} y={y * px} width={w * px + 0.5} height={h * px + 0.5} fill={fill} opacity={op} />);
  // far and near hills: columns of pixels, scrolling slower than the ground
  for (const [layer, par, base, amp, op] of [[0, 0.18, 0.44, 5, 0.16], [1, 0.42, 0.56, 4, 0.3]] as number[][]) {
    const off = scroll * par, whole = Math.floor(off), frac = off - whole;
    for (let x = -1; x < cols; x++) {
      const wx = x + whole;
      const h = Math.round(amp * (0.5 + 0.5 * Math.sin(wx * (layer ? 0.21 : 0.13) + layer * 2)) + amp * 0.5 * Math.sin(wx * (layer ? 0.07 : 0.05)));
      const topRow = Math.round(rows * base) - h;
      rect(x - frac, topRow, 1, floorRow - topRow, land, `h${layer}-${x}`, op);
    }
  }
  // ground + blocks
  const whole = Math.floor(scroll), frac = scroll - whole;
  for (let x = -1; x < cols; x++) {
    const wx = x + whole;
    rect(x - frac, floorRow, 1, 1, land, `g${x}`, 1);
    rect(x - frac, floorRow + 1, 1, rows - floorRow, land, `d${x}`, wx % 4 === 0 ? 0.3 : 0.42);
  }
  for (const b of blocks) {
    const x = b.c - scroll;
    if (x < -2 || x > cols) continue;
    rect(x, floorRow - b.h, 1, b.h, HUE.sand, `b${b.c}`);
  }
  // hero
  pose.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') rect(heroCol + x - 4, heroY + y, 1, 1, ch === '2' ? '#14110E' : hero, `p${x}-${y}`); }));
  const text = String(it.text || ''), sub = String(it.sub || '');
  const {fs, lines} = fitLines(text, r[2] * (tall ? 1 : 0.6), r[3] * 0.16, 2, st.weight, st.tracking);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: String(it.sky || '#0C1420')}}>
      <svg width={W} height={H} shapeRendering="crispEdges" style={{position: 'absolute', left: 0, top: 0, opacity: k01(lf, -2, 8)}}>{cells}</svg>
      <Box r={r}>
        <div style={{position: 'absolute', left: 0, top: tall ? r[3] * 0.02 : 0}}>
          {sub && <div style={{...caps(st, 26 * u, HUE.sand), marginBottom: 14 * u, opacity: k01(lf, 6, 18)}}>{sub}</div>}
          {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={8 + i * 5} /></div>)}
        </div>
      </Box>
    </div>
  );
};
export default PixelRun;

// A custom scene for this film only: three things that move, as three drawn curves. Each curve is drawn when he
// says its name: down (coral) or up (teal), with a dot riding the tip. Shapes, not data: no axes, no numbers.
import React from 'react';
import {Box, SceneProps, fit, hexA, itemAt, itemText, itemsOf, k01, type} from 'connect-ai-motion/ui';

const Trends: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const items = itemsOf(it).slice(0, 3);
  const n = Math.max(1, items.length);
  const W = r[2], H = r[3];
  const cw = tall ? W : (W - (n - 1) * 60 * u) / n, ch = tall ? (H - (n - 1) * 40 * u) / n : H * 0.78;
  const fs = Math.min(...items.map((x) => fit(itemText(x), cw * (tall ? 0.42 : 0.9), (tall ? 76 : 84) * u, st.weight, st.tracking)));
  return (
    <Box r={r}>
      {items.map((x, i) => {
        const up = x?.dir === 'up';
        const col = up ? '#3FB7A6' : '#E0605A';
        const f = itemAt(it, i, n, dur, fps);
        const k = k01(lf, f, f + 26);
        const x0 = tall ? 0 : i * (cw + 60 * u), y0 = tall ? i * (ch + 40 * u) : (H - ch) / 2;
        // the curve lives in the upper part of its cell (the right part in 9:16)
        const gw = tall ? cw * 0.5 : cw, gh = tall ? ch * 0.8 : ch * 0.62, gx = tall ? cw * 0.5 : 0, gy = tall ? ch * 0.1 : 0;
        const a = up ? gh * 0.88 : gh * 0.1, b = up ? gh * 0.1 : gh * 0.88;
        const d = `M ${gw * 0.06} ${a} C ${gw * 0.42} ${a}, ${gw * 0.5} ${b}, ${gw * 0.94} ${b}`;
        // point on the cubic at k
        const p = (t: number, p0: number, p1: number, p2: number, p3: number) => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3;
        const hx = p(k, gw * 0.06, gw * 0.42, gw * 0.5, gw * 0.94), hy = p(k, a, a, b, b);
        const breathe = 1 + Math.sin(Math.max(0, lf - f) / 9) * 0.08;
        return (
          <div key={i} style={{position: 'absolute', left: x0, top: y0, width: cw, height: ch, opacity: k01(lf, f - 2, f + 8)}}>
            <svg width={gw} height={gh} style={{position: 'absolute', left: gx, top: gy, overflow: 'visible'}}>
              <line x1={0} y1={gh} x2={gw} y2={gh} stroke={st.cardLine} strokeWidth={Math.max(1, 1.5 * u)} />
              <path d={`${d} L ${gw * 0.94} ${gh} L ${gw * 0.06} ${gh} Z`} fill={hexA(col, 0.1 * k)} />
              <path d={d} fill="none" stroke={col} strokeWidth={Math.max(4, 7 * u)} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
              <circle cx={hx} cy={hy} r={13 * u * breathe} fill={col} />
              <circle cx={hx} cy={hy} r={5 * u} fill="#F6F1E7" />
            </svg>
            <div style={tall ? {position: 'absolute', left: 0, top: (ch - fs * 1.1) / 2, ...type(st, fs, ink)} : {position: 'absolute', left: 0, right: 0, top: gh + 34 * u, textAlign: 'center', ...type(st, fs, ink)}}>{itemText(x)}</div>
          </div>
        );
      })}
    </Box>
  );
};
export default Trends;

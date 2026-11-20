// A custom scene for this film only: "the cost is almost nothing". One tall bar (the cost) falls to a sliver at the
// "drop" cue; a dashed ghost keeps its old height so the difference stays visible. No numbers: he gave none.
import React from 'react';
import {Box, INOUT, SceneProps, Words, caps, cueAt, fitLines, hexA, hueOf, k01, type} from 'connect-ai-motion/ui';

const Cost: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const col = hueOf(it, '#E0605A');
  const drop = cueAt(it, 'drop', Math.round(dur * 0.4));
  const W = r[2], H = r[3];
  const bw = (tall ? 230 : 250) * u, base = H * (tall ? 0.6 : 0.82), full = H * (tall ? 0.5 : 0.66);
  const bx = tall ? (W - bw) / 2 : W * 0.16;
  const grow = k01(lf, 0, 14);
  const k = k01(lf, drop, drop + 18, INOUT);
  const settle = Math.sin(Math.max(0, lf - drop - 18) / 5) * Math.exp(-Math.max(0, lf - drop - 18) / 14) * 0.012;
  const h = full * grow * (1 - 0.955 * k + settle);
  const text = String(it.text || ''), label = String(it.label || '');
  const {fs, lines} = fitLines(text, tall ? W : W * 0.52, tall ? H * 0.18 : H * 0.44, 2, st.weight, st.tracking);
  const hi = String(it.hi || '').toLowerCase();
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: bx - 60 * u, top: base, width: (bw + 120 * u) * k01(lf, 0, 16), height: Math.max(1.5, 2 * u), background: st.cardLine}} />
      <div style={{position: 'absolute', left: bx, top: base - full, width: bw, height: full, borderRadius: 14 * u, border: `${Math.max(1.5, 2 * u)}px dashed ${hexA(col, 0.55)}`, opacity: k}} />
      <div style={{position: 'absolute', left: bx, top: base - h, width: bw, height: h, borderRadius: Math.min(14 * u, h / 2), background: `linear-gradient(180deg, ${col}, ${hexA(col, 0.72)})`, boxShadow: `0 ${20 * u}px ${60 * u}px ${hexA(col, 0.25)}`}} />
      {label && <div style={{position: 'absolute', left: bx - 100 * u, width: bw + 200 * u, top: base + 26 * u, textAlign: 'center', ...caps(st, 28 * u, st.dim), opacity: k01(lf, 4, 16)}}>{label}</div>}
      <div style={{position: 'absolute', left: tall ? 0 : W * 0.44, width: tall ? W : W * 0.56, top: tall ? H * 0.72 : (H - lines.length * fs * 1.12) / 2, textAlign: tall ? 'center' : 'left'}}>
        {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={drop + 6 + i * 5} hi={hi} hiColor={st.accentHi} /></div>)}
      </div>
    </Box>
  );
};
export default Cost;

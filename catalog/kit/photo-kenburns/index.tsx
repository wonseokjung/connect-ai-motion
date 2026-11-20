// Photo, slowly moving: one picture fills the frame and the camera drifts across it (the Ken Burns move).
// A thin caption sits on a soft shade at the bottom. Ours.
import React from 'react';
import {Img} from 'remotion';
import {Box, SceneProps, Words, caps, cueAt, fitLines, k01, media, mix, type} from '../../../src/catalog/ui';

const MOVES: Record<string, number[]> = {
  // [scale0, scale1, x0, x1, y0, y1] in % of the frame
  in: [1.06, 1.2, 0, 0, 0, -1.5],
  out: [1.22, 1.06, 0, 0, -1.5, 0],
  left: [1.16, 1.16, 3.4, -3.4, 0, 0],
  right: [1.16, 1.16, -3.4, 3.4, 0, 0],
  up: [1.16, 1.2, 0, 0, 3, -3],
};

const PhotoKenburns: React.FC<SceneProps> = ({it, r, lf, dur, st, u, W, H, tall}) => {
  const m = MOVES[String(it.move || 'in')] || MOVES.in;
  const k = Math.max(0, Math.min(1, (lf + 12) / (dur + 24)));
  const text = String(it.text || ''), sub = String(it.sub || '');
  const {fs, lines} = fitLines(text, r[2] * (tall ? 1 : 0.62), r[3] * 0.2, 2, st.weight, st.tracking);
  const focus = String(it.focus || '50% 50%');
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: '#000'}}>
      <Img src={media(it.src)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: focus, transform: `translate(${mix(m[2], m[3], k)}%, ${mix(m[4], m[5], k)}%) scale(${mix(m[0], m[1], k)})`, opacity: k01(lf, -2, 10)}} />
      {(text || sub) && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%', background: 'linear-gradient(0deg, rgba(8,7,6,0.82) 0%, rgba(8,7,6,0.5) 42%, transparent 100%)'}} />}
      <Box r={r}>
        <div style={{position: 'absolute', left: 0, bottom: tall ? r[3] * 0.04 : 0}}>
          {sub && <div style={{...caps(st, 26 * u, st.accentHi), marginBottom: 16 * u, opacity: k01(lf, 8, 20)}}>{sub}</div>}
          {lines.map((l, i) => <div key={i} style={{...type(st, fs, '#F6F1E7')}}><Words text={l} lf={lf} start={cueAt(it, 'words', 10) + i * 6} /></div>)}
          <div style={{width: 120 * u * k01(lf, 14, 36), height: Math.max(2, 3 * u), background: st.accent, marginTop: 20 * u}} />
        </div>
      </Box>
    </div>
  );
};
export default PhotoKenburns;

// A custom scene for this film only: the "generated video" he talks about. A player card with a rabbit running
// on a plain screen; the colour of the screen is one prop. Drawn with circles and ellipses, moved by the frame.
import React from 'react';
import {Box, SceneProps, caps, cueAt, fit, hexA, hueOf, k01, type} from 'connect-ai-motion/ui';

const Bunny: React.FC<{f: number; color: string; eye: string}> = ({f, color, eye}) => {
  const p = (f / 11) % 1; // one hop = 11 frames
  const air = Math.sin(Math.PI * p);
  const tilt = Math.cos(2 * Math.PI * p) * 9;
  const front = 38 * Math.cos(2 * Math.PI * p), hind = -34 * Math.cos(2 * Math.PI * p);
  return (
    <g transform={`translate(0 ${-air * 46}) rotate(${-tilt} 190 190)`} fill={color}>
      <ellipse cx={124} cy={244} rx={48} ry={15} transform={`rotate(${hind} 150 222)`} />
      <ellipse cx={252} cy={236} rx={13} ry={36} transform={`rotate(${front} 250 206)`} />
      <circle cx={70} cy={164} r={19} />
      <circle cx={132} cy={182} r={60} />
      <ellipse cx={192} cy={172} rx={96} ry={62} />
      <ellipse cx={288} cy={124} rx={50} ry={43} />
      <ellipse cx={266} cy={52} rx={15} ry={52} transform={`rotate(${-14 - air * 10} 268 98)`} />
      <ellipse cx={300} cy={50} rx={14} ry={50} transform={`rotate(${8 - air * 14} 300 98)`} />
      <circle cx={304} cy={114} r={5.5} fill={eye} />
    </g>
  );
};

const Rabbit: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const screen = hueOf(it, '#050505', 'screen');
  const next = it.next ? hueOf(it, '#D8433B', 'next') : null;
  const aAt = cueAt(it, 'first', 99999), bAt = cueAt(it, 'second', 99999);
  const a = k01(lf, aAt, aAt + 10), b = k01(lf, bAt, bAt + 10);
  // "mode": "big" shows the text as one large word under the card instead of colour chips
  const big = it.mode === 'big' || it.mode === 'wait' || it.mode === 'wish' ? String(it.text || '') : '';
  // "mode": "wish": the colour he would like comes in from the right, up to the middle (a wish, not yet the video)
  const wishAt = cueAt(it, 'wish', 12), wishK = it.mode === 'wish' ? k01(lf, wishAt, wishAt + 16) : 0;
  const label = big ? '' : String(it.text || ''), label2 = String(it.sub || '');
  const cw = tall ? r[2] : Math.min(r[2] * 0.82, ((r[3] - (label || big ? 150 * u : 0)) * 16) / 9), ch = (cw * 9) / 16;
  const below = label || big ? (tall ? 190 : 150) * u : 0;
  const wait = it.mode === 'wait';
  const x = (r[2] - cw) / 2, y = (r[3] - ch - below) / 2;
  const inK = k01(lf, 0, 12);
  const f = Math.max(0, lf);
  const spin = (f / 30) * 360;
  const dash = (f * 16) % 120;
  const chip = (text: string, col: string, k: number) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, opacity: k, transform: `translateY(${(1 - k) * 14 * u}px)`}}>
      <div style={{width: 44 * u, height: 44 * u, borderRadius: 10 * u, background: col, border: `${Math.max(1, 1.5 * u)}px solid ${st.cardLine}`}} />
      <div style={{...type(st, 64 * u, ink, 300)}}>{text}</div>
    </div>
  );
  const bfs = big ? fit(big, r[2] * 0.9, 120 * u, st.weight, st.tracking) : 0;
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: x, top: y, width: cw, height: ch, borderRadius: 22 * u, overflow: 'hidden', background: screen, border: `${Math.max(1, 1.5 * u)}px solid ${st.cardLine}`, boxShadow: `0 ${30 * u}px ${90 * u}px rgba(0,0,0,0.55)`, opacity: inK, transform: `scale(${0.96 + 0.04 * inK})`}}>
        {it.mode === 'wish' && next && <div style={{position: 'absolute', right: 0, top: 0, width: `${wishK * 50}%`, height: '100%', background: next}} />}
        {it.mode === 'wish' && <div style={{position: 'absolute', right: `${wishK * 50}%`, top: 0, width: Math.max(2, 3 * u), height: '100%', background: '#F6F1E7', opacity: wishK > 0 ? 1 : 0}} />}
        <svg width={cw} height={ch} viewBox="0 0 800 450" style={{position: 'absolute'}}>
          {!wait && Array.from({length: 9}, (_, i) => <line key={i} x1={i * 120 - dash} y1={352} x2={i * 120 - dash + 54} y2={352} stroke="#F6F1E7" strokeOpacity={0.3} strokeWidth={3} strokeLinecap="round" />)}
          <g transform="translate(215 62)" opacity={wait ? 0.18 : 1}><Bunny f={wait ? 3 : f} color="#F6F1E7" eye={screen} /></g>
          {wait && (
            <g transform={`translate(400 215) rotate(${spin})`}>
              <circle r={62} fill="none" stroke="#F6F1E7" strokeOpacity={0.18} strokeWidth={7} />
              <path d="M0 -62 A62 62 0 0 1 62 0" fill="none" stroke="#F2B45A" strokeWidth={7} strokeLinecap="round" />
            </g>
          )}
        </svg>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: ch * 0.11, background: 'linear-gradient(0deg, rgba(0,0,0,0.5), transparent)'}} />
        <div style={{position: 'absolute', left: cw * 0.04, right: cw * 0.04, bottom: ch * 0.05, height: Math.max(2, 3 * u), background: hexA('#F6F1E7', 0.25)}}>
          <div style={{width: `${wait ? 0 : Math.min(100, (f / Math.max(1, dur)) * 100)}%`, height: '100%', background: '#F6F1E7'}} />
        </div>
      </div>
      {label && (
        <div style={{position: 'absolute', left: 0, right: 0, top: y + ch + 44 * u, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34 * u}}>
          {chip(label, screen, a)}
          {label2 && next && (
            <>
              <svg width={70 * u} height={30 * u} viewBox="0 0 70 30" style={{opacity: b}}><path d={`M2 15 H${2 + 60 * b} M52 5 L64 15 L52 25`} fill="none" stroke={st.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
              {chip(label2, next, b)}
            </>
          )}
        </div>
      )}
      {big && <div style={{position: 'absolute', left: 0, right: 0, top: y + ch + 30 * u, textAlign: 'center', ...type(st, bfs, ink), opacity: k01(lf, 6, 18), transform: `translateY(${(1 - k01(lf, 6, 20)) * 18 * u}px)`}}>{big}</div>}
      {it.label && <div style={{position: 'absolute', left: x, top: y - 46 * u, ...caps(st, 26 * u, st.dim), opacity: inK}}>{String(it.label)}</div>}
    </Box>
  );
};
export default Rabbit;

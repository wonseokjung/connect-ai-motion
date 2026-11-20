// A character made of one shape: a body you choose (circle, square, triangle, pill), two eyes, two thin legs.
// It walks in, and at the "act" cue it jumps, waves or looks around. Not a brand mascot: a stand-in you colour
// and name yourself. Drawn with SVG, moved by the frame. Ours.
import React from 'react';
import {Box, SceneProps, Words, caps, cueAt, fitLines, hexA, hueOf, k01, type} from '../../../src/catalog/ui';

const Body: React.FC<{shape: string; s: number; fill: string}> = ({shape, s, fill}) => {
  if (shape === 'square') return <rect x={-s / 2} y={-s} width={s} height={s} rx={s * 0.16} fill={fill} />;
  if (shape === 'triangle') return <path d={`M0 ${-s * 1.05} L${s * 0.62} 0 L${-s * 0.62} 0 Z`} fill={fill} stroke={fill} strokeWidth={s * 0.12} strokeLinejoin="round" />;
  if (shape === 'pill') return <rect x={-s * 0.36} y={-s * 1.2} width={s * 0.72} height={s * 1.2} rx={s * 0.36} fill={fill} />;
  return <circle cx={0} cy={-s / 2} r={s / 2} fill={fill} />;
};

const Actor: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const shape = String(it.shape || 'circle');
  const col = hueOf(it, '#E0605A');
  const action = String(it.action || 'jump');
  const act = cueAt(it, 'act', Math.round(dur * 0.45));
  const f = Math.max(0, lf);
  const text = String(it.text || ''), sub = String(it.sub || '');
  const W = r[2], H = r[3];
  const aw = tall ? W : W * (text ? 0.56 : 1), ah = tall ? H * (text ? 0.62 : 1) : H;
  const S = Math.min(aw * 0.36, ah * 0.4);
  const floor = ah * 0.78;
  // walks in from the left, arrives a little before the cue, keeps a small idle sway
  const arrive = Math.max(12, act - 8);
  const walkK = k01(lf, 0, arrive, (t) => t);
  const walking = lf < arrive;
  const cx = aw * (-0.25 + 0.75 * walkK) + Math.sin(f / 36) * 4 * u * (walking ? 0 : 1);
  const step = (f / 7) * Math.PI;
  const bob = walking ? Math.abs(Math.sin(step)) * S * 0.05 : Math.sin(f / 16) * S * 0.012;
  // the action
  const t = lf - act;
  const jumpT = action === 'jump' && t >= 0 ? (t % 26) / 18 : -1;
  const air = jumpT >= 0 && jumpT <= 1 ? Math.sin(Math.PI * jumpT) : 0;
  const crouch = action === 'jump' && t >= -5 && t < 0 ? (t + 5) / 5 : jumpT > 1 ? Math.max(0, 1 - (jumpT - 1) * 4) * 0.7 : 0;
  const look = action === 'look' && t >= 0 ? Math.sin(t / 9) : walking ? 1 : Math.sin(f / 40) * 0.5;
  const wave = action === 'wave' && t >= 0 ? Math.sin(t / 3.2) : 0;
  const y = floor - bob - air * S * 0.95;
  const sy = 1 - crouch * 0.16 + air * 0.06, sx = 1 + crouch * 0.12 - air * 0.04;
  const blink = f % 84 > 79 ? 0.12 : 1;
  const legLen = S * 0.34, legGap = S * 0.2;
  const leg = (side: number) => {
    const sw = walking ? Math.sin(step + (side > 0 ? Math.PI : 0)) : 0;
    const lift = air > 0.05 ? 0.5 : 0;
    const x0 = cx + side * legGap, y0 = y - S * 0.04;
    const x1 = x0 + sw * legLen * 0.7, y1 = Math.min(floor + legLen * 0.0, y0 + legLen * (1 - lift) - Math.max(0, sw) * legLen * 0.25) + (air > 0.05 ? 0 : bob);
    return <path key={side} d={`M${x0} ${y0} L${x1} ${air > 0.05 ? y0 + legLen * 0.55 : floor} l${S * 0.1} 0`} fill="none" stroke={col} strokeWidth={S * 0.07} strokeLinecap="round" strokeLinejoin="round" />;
  };
  const eyeY = shape === 'triangle' ? -S * 0.42 : shape === 'pill' ? -S * 0.86 : -S * 0.6;
  const eyeGap = shape === 'triangle' || shape === 'pill' ? S * 0.13 : S * 0.17;
  const eyeR = S * 0.075;
  const dash = (f * (walking ? 10 : 0) * u) % (100 * u);
  const armY = shape === 'pill' ? -S * 0.6 : -S * 0.42;
  const {fs, lines} = fitLines(text, tall ? W : W * 0.4, tall ? H * 0.2 : H * 0.42, tall ? 2 : 3, st.weight, st.tracking);
  return (
    <Box r={r}>
      <svg width={aw} height={ah} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <line x1={0} y1={floor + S * 0.02} x2={aw * k01(lf, 0, 16)} y2={floor + S * 0.02} stroke={hexA(st.ink, 0.22)} strokeWidth={Math.max(1.5, 2 * u)} />
        {Array.from({length: Math.ceil(aw / (100 * u)) + 2}, (_, i) => <line key={i} x1={i * 100 * u - dash} y1={floor + S * 0.12} x2={i * 100 * u - dash + 36 * u} y2={floor + S * 0.12} stroke={hexA(st.ink, 0.14)} strokeWidth={Math.max(1.5, 2 * u)} strokeLinecap="round" />)}
        <ellipse cx={cx} cy={floor + S * 0.03} rx={S * 0.42 * (1 - air * 0.4)} ry={S * 0.05} fill="rgba(0,0,0,0.5)" />
        {leg(-1)}
        {leg(1)}
        <g transform={`translate(${cx} ${y - legLen * 0.72}) scale(${sx} ${sy})`}>
          {action === 'wave' && t >= 0 && <path d={`M${S * 0.36} ${armY} l${S * 0.26} ${-S * 0.24 - wave * S * 0.05} l${S * 0.04 + wave * S * 0.1} ${-S * 0.2}`} fill="none" stroke={col} strokeWidth={S * 0.07} strokeLinecap="round" strokeLinejoin="round" />}
          <Body shape={shape} s={S} fill={col} />
          <g transform={`translate(${look * S * 0.06} ${eyeY})`}>
            {[-1, 1].map((sd) => (
              <g key={sd} transform={`translate(${sd * eyeGap} 0) scale(1 ${blink})`}>
                <circle r={eyeR} fill="#F6F1E7" />
                <circle cx={look * eyeR * 0.35} cy={air > 0.1 ? -eyeR * 0.25 : 0} r={eyeR * 0.5} fill="#14110E" />
              </g>
            ))}
          </g>
        </g>
      </svg>
      {(text || sub) && (
        <div style={{position: 'absolute', left: tall ? 0 : W * 0.6, width: tall ? W : W * 0.4, top: tall ? ah + 10 * u : (H - lines.length * fs * 1.12) / 2 - (sub ? 24 * u : 0), textAlign: tall ? 'center' : 'left'}}>
          {sub && <div style={{...caps(st, 26 * u, col), marginBottom: 16 * u, opacity: k01(lf, 8, 20)}}>{sub}</div>}
          {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={10 + i * 5} /></div>)}
        </div>
      )}
    </Box>
  );
};
export default Actor;

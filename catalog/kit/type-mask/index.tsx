// A word as a window: the picture is only visible through the letters, then the camera goes through the word
// and the picture fills the frame. Ours (SVG clipPath on text: no CSS mask, so every frame is exact).
import React from 'react';
import {Img} from 'remotion';
import {FONT, IN, SceneProps, caps, cueAt, fit, k01, media, mix} from '../../../src/catalog/ui';
import {Box} from '../../../src/catalog/ui';
import {useSvgId} from '../../../src/parts/Picture';

const TypeMask: React.FC<SceneProps> = ({it, r, lf, dur, st, u, W, H, tall}) => {
  const id = useSvgId('tm');
  const words = String(it.text || '').toUpperCase().split(/\s+/).filter(Boolean);
  const lines = tall || words.length > 2 ? words : [words.join(' ')];
  const at = cueAt(it, 'open', Math.round(dur * 0.62));
  const open = it.open === false ? 0 : k01(lf, at, at + 22, IN);
  const fs = Math.min(...lines.map((l) => fit(l, W * 0.94, (tall ? 420 : 560) * u, 800, -0.02)), (H * (tall ? 0.5 : 0.62)) / lines.length);
  const lh = fs * 0.92;
  const y0 = H * 0.5 - ((lines.length - 1) * lh) / 2;
  const pan = Math.max(0, Math.min(1, (lf + 10) / (dur + 20)));
  const s = 1 + open * 5;
  const inK = k01(lf, 0, 16);
  const pic: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: W, height: H, objectFit: 'cover', objectPosition: String(it.focus || '50% 50%'), transform: `scale(${1.22 - 0.14 * pan}) translate(${mix(2.5, -2.5, pan)}%, 0)`};
  const sub = String(it.sub || '');
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: st.bg}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <clipPath id={id}>
            {lines.map((l, i) => (
              <text key={i} x={W / 2} y={y0 + i * lh} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={800} fontSize={fs} letterSpacing={`${-0.02 + (1 - inK) * 0.1}em`} transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-W / 2} ${-H / 2})`}>{l}</text>
            ))}
          </clipPath>
        </defs>
      </svg>
      {/* the same picture, far back and dark, so the frame is never empty around the word; it comes up as the word opens */}
      <Img src={media(it.src)} style={{...pic, filter: `brightness(${0.2 + 0.8 * open * open}) saturate(${0.7 + 0.3 * open})`, opacity: inK}} />
      {open < 0.999 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `url(#${id})`, opacity: inK * (1 - open * open)}}>
          <Img src={media(it.src)} style={{...pic, filter: `brightness(${Number(it.gain ?? 1.25)})`}} />
        </div>
      )}
      {/* a hairline around the letters keeps the word readable where the picture is dark */}
      {open < 0.999 && (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: inK * 0.6 * (1 - open)}}>
          {lines.map((l, i) => (
            <text key={i} x={W / 2} y={y0 + i * lh} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={800} fontSize={fs} letterSpacing={`${-0.02 + (1 - inK) * 0.1}em`} fill="none" stroke="#F6F1E7" strokeWidth={Math.max(1.5, 2 * u)} transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-W / 2} ${-H / 2})`}>{l}</text>
          ))}
        </svg>
      )}
      {sub && (
        <Box r={r}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: tall ? r[3] * 0.08 : 0, textAlign: 'center', ...caps(st, 28 * u, open > 0.5 ? '#F6F1E7' : st.dim), opacity: k01(lf, 12, 26)}}>{sub}</div>
        </Box>
      )}
    </div>
  );
};
export default TypeMask;

// A lens on your picture: a round glass travels to one spot and shows it bigger; the rest steps back. Ours.
import React from 'react';
import {Img} from 'remotion';
import {Box, INOUT, SceneProps, Words, caps, cueAt, fitLines, k01, media, mix, type} from '../../../src/catalog/ui';

const ZoomLens: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W, H, tall}) => {
  const at = cueAt(it, 'look', Math.round(dur * 0.28));
  const z = Number(it.zoom ?? 2.2);
  const tx = Number(it.x ?? 0.62), ty = Number(it.y ?? 0.42);
  const text = String(it.text || ''), sub = String(it.sub || '');
  const words = !!(text || sub);
  // with words the picture is a card and the words sit under it; without, the picture fills the frame
  const c = !words ? [0, 0, W, H] : tall ? [r[0], r[1], r[2], r[3] * 0.66] : [W * 0.11, H * 0.07, W * 0.78, H * 0.68];
  const k = k01(lf, at - 16, at + 6, INOUT);
  const wob = Math.max(0, lf - at) / 34; // the lens never rests: a small slow circle around its target
  const cx = c[0] + c[2] * (mix(0.2, tx, k) + Math.sin(wob) * 0.012 * k);
  const cy = c[1] + c[3] * (mix(0.8, ty, k) + Math.cos(wob * 0.8) * 0.016 * k);
  const R = Math.min(c[2], c[3]) * (tall ? 0.3 : 0.33) * (0.86 + 0.14 * k);
  const pan = Math.max(0, Math.min(1, (lf + 10) / (dur + 20)));
  const s = 1.02 + 0.03 * pan;
  const src = media(it.src);
  const {fs, lines} = fitLines(text, r[2] * (tall ? 1 : 0.7), (tall ? r[3] * 0.14 : H * 0.1), tall ? 2 : 1, st.weight, st.tracking);
  const img: React.CSSProperties = {position: 'absolute', width: c[2], height: c[3], objectFit: 'cover', objectPosition: String(it.focus || '50% 50%')};
  const inK = k01(lf, -2, 10);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: c[0], top: c[1], width: c[2], height: c[3], overflow: 'hidden', borderRadius: words ? 18 * u : 0, background: '#000', boxShadow: words ? `0 ${30 * u}px ${90 * u}px rgba(0,0,0,0.55), 0 0 0 ${Math.max(1, 1.5 * u)}px ${st.cardLine}` : undefined, opacity: inK, transform: `scale(${0.97 + 0.03 * inK})`}}>
        <Img src={src} style={{...img, left: 0, top: 0, transform: `scale(${s})`, filter: `brightness(${1 - 0.45 * k})`}} />
      </div>
      <div style={{position: 'absolute', left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: '50%', overflow: 'hidden', background: '#000', boxShadow: `0 0 0 ${Math.max(2, 3 * u)}px #F6F1E7, 0 ${24 * u}px ${70 * u}px rgba(0,0,0,0.6)`, opacity: k01(lf, 0, 10)}}>
        <Img src={src} style={{...img, left: c[0] - (cx - R), top: c[1] - (cy - R), transformOrigin: `${cx - c[0]}px ${cy - c[1]}px`, transform: `scale(${s * mix(1.25, z, k)})`}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.14), transparent 46%)'}} />
      </div>
      {words && (
        <div style={{position: 'absolute', left: tall ? r[0] : c[0], width: tall ? r[2] : c[2], top: c[1] + c[3] + (tall ? 44 : 30) * u, textAlign: tall ? 'left' : 'center'}}>
          {sub && <div style={{...caps(st, 24 * u, st.accentHi), marginBottom: 10 * u, opacity: k01(lf, at, at + 12)}}>{sub}</div>}
          {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={at + 2 + i * 5} /></div>)}
        </div>
      )}
    </div>
  );
};
export default ZoomLens;

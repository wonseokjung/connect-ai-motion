// Phone: your vertical screenshot (or clip) inside a phone that tilts in and floats. Ours.
import React from 'react';
import {Phone} from '../../../src/parts/Devices';
import {Box, SceneProps, Words, caps, fitLines, hueOf, k01, media, mix, type} from '../../../src/catalog/ui';

const DevicePhone: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W, H, tall}) => {
  const text = String(it.text || ''), sub = String(it.sub || '');
  const has = !!(text || sub);
  const col = hueOf(it, st.accent);
  const ph = tall ? (has ? H * 0.6 : H * 0.76) : H * 0.84;
  const pw = (ph * 9) / 19.3;
  const cx = tall ? W / 2 : has ? W * 0.31 : W / 2;
  const top = tall ? (has ? r[1] - 30 * u : (H - ph) / 2) : (H - ph) / 2;
  const k = k01(lf, 0, 30);
  const ry = mix(tall ? -30 : -40, tall ? -7 : -15, k) + Math.sin(lf / 62) * 2.2;
  const rx = mix(16, 5, k) + Math.cos(lf / 80) * 1.2;
  const lift = (1 - k) * 110 * u + Math.sin(lf / 44) * 7 * u;
  const tw = tall ? r[2] : W - r[0] - (cx + pw * 0.72);
  const {fs, lines} = fitLines(text || 'X', tw, tall ? r[3] * 0.12 : r[3] * 0.46, tall ? 2 : 3, st.weight, st.tracking);
  const tx = tall ? r[0] : cx + pw * 0.72, ty = tall ? top + ph + 44 * u : (H - lines.length * fs * 1.12) / 2 - (sub ? 24 * u : 0);
  let n = 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <div style={{position: 'absolute', left: cx - pw * 0.8, top: top + ph * 0.97, width: pw * 1.6, height: ph * 0.09, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)', opacity: k}} />
      <div style={{position: 'absolute', left: cx - pw / 2, top, width: pw, height: ph, perspective: 1900 * u}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: pw, height: ph, transform: `translateY(${lift}px) rotateY(${ry}deg) rotateX(${rx}deg)`, opacity: k01(lf, 0, 8)}}>
          <Phone w={pw} h={ph} src={media(it.src)} file={String(it.src)} pan={Math.max(0, Math.min(1, lf / Math.max(1, dur)))} sheen={(lf - 16) / 34} position={String(it.focus || '50% 0%')} />
        </div>
      </div>
      {has && (
        <div style={{position: 'absolute', left: tx, top: ty, width: tw, textAlign: tall ? 'center' : 'left'}}>
          {sub && <div style={{...caps(st, 26 * u, col), marginBottom: 18 * u, opacity: k01(lf, 12, 24)}}>{sub}</div>}
          {text && lines.map((l, i) => {
            const start = 12 + n * 3;
            n += l.split(/\s+/).length;
            return <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={start} /></div>;
          })}
          {!tall && <div style={{width: 110 * u * k01(lf, 20, 40), height: Math.max(2, 3 * u), background: col, marginTop: 24 * u}} />}
        </div>
      )}
    </div>
  );
};
export default DevicePhone;

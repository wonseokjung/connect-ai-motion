// Browser window: your screenshot inside a plain window. The page scrolls slowly, a cursor comes in and clicks,
// and the page answers by scrolling on. Ours.
import React from 'react';
import {Img} from 'remotion';
import {INOUT, SceneProps, Words, caps, cueAt, fit, hueOf, k01, media, mix, type} from '../../../src/catalog/ui';

const DeviceBrowser: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W, H, tall}) => {
  const text = String(it.text || ''), sub = String(it.sub || ''), label = String(it.label || '');
  const col = hueOf(it, st.accent);
  const click = cueAt(it, 'click', Math.round(dur * 0.55));
  const capH = text || sub ? (tall ? 210 : 150) * u : 0;
  const ww = tall ? W * 0.92 : W * (capH ? 0.74 : 0.82);
  const wh = tall ? Math.min(H * 0.56, r[3] - capH) : H * (capH ? 0.68 : 0.8);
  const x = (W - ww) / 2, y = tall ? r[1] + (r[3] - wh - capH) / 2 : (H - wh - capH) / 2;
  const bar = 66 * u, vw = ww, vh = wh - bar;
  const kIn = k01(lf, 0, 18);
  // the page: a slow scroll, then a longer one right after the click
  const travel = Math.max(0.05, Number(it.scroll ?? (it.page ? 0.4 : 0.24)));
  const prog = 0.3 * Math.max(0, Math.min(1, lf / Math.max(1, click))) + 0.7 * k01(lf, click + 3, click + 32, INOUT);
  const at: number[] = Array.isArray(it.at) ? it.at : [60, 60];
  const tx = (vw * Number(at[0])) / 100, ty = (vh * Number(at[1])) / 100;
  const kc = k01(lf, click - 24, click - 2);
  const cx = mix(vw * 0.94, tx, kc), cy = mix(vh * 1.08, ty, kc) + Math.sin(kc * Math.PI) * -40 * u;
  const press = lf >= click && lf < click + 5 ? 0.82 : 1;
  const dot = lf >= click ? Math.max(0, 1 - (lf - click) / 12) : 0;
  const fs = fit(text || 'X', tall ? r[2] : ww * 0.8, 62 * u, st.weight, st.tracking);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <div style={{position: 'absolute', left: x, top: y, width: ww, height: wh, perspective: 2600 * u}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: ww, height: wh, borderRadius: 20 * u, overflow: 'hidden', background: '#161412', boxShadow: `0 0 0 ${Math.max(1, 1.5 * u)}px ${st.cardLine}, 0 ${40 * u}px ${120 * u}px rgba(0,0,0,0.6)`, opacity: k01(lf, 0, 8), transform: `translateY(${(1 - kIn) * 46 * u}px) scale(${0.955 + 0.045 * kIn}) rotateY(${Math.sin(lf / 80) * 1.1}deg) rotateX(${1.2 + Math.cos(lf / 95) * 0.7}deg)`}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: ww, height: bar, background: 'linear-gradient(180deg, #25211d, #1b1815)', borderBottom: `${Math.max(1, u)}px solid rgba(235,226,210,0.1)`}}>
            {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: (26 + i * 26) * u, top: bar / 2 - 7 * u, width: 14 * u, height: 14 * u, borderRadius: 7 * u, background: 'rgba(235,226,210,0.2)'}} />)}
            <div style={{position: 'absolute', left: ww * 0.24, top: bar * 0.2, width: ww * 0.52, height: bar * 0.6, borderRadius: bar * 0.3, background: 'rgba(235,226,210,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {label && <div style={{...type(st, Math.min(24 * u, fit(label, ww * 0.46, 24 * u, 300, 0)), st.dim, 300), letterSpacing: '0.02em'}}>{label}</div>}
            </div>
          </div>
          <div style={{position: 'absolute', left: 0, top: bar, width: vw, height: vh, overflow: 'hidden', background: '#0b0a09'}}>
            {it.page ? (
              <Img src={media(it.src)} style={{position: 'absolute', left: 0, top: 0, width: '100%', display: 'block', transform: `translateY(${-prog * travel * 100}%)`}} />
            ) : (
              <Img src={media(it.src)} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: vh * (1 + travel), objectFit: 'cover', objectPosition: '50% 0%', transform: `translateY(${-prog * travel * vh}px)`}} />
            )}
            {dot > 0 && <div style={{position: 'absolute', left: tx - 26 * u, top: ty - 26 * u, width: 52 * u, height: 52 * u, borderRadius: 26 * u, background: col, opacity: 0.5 * dot}} />}
            <svg width={44 * u} height={62 * u} viewBox="0 0 15 21" style={{position: 'absolute', left: cx, top: cy, overflow: 'visible', opacity: k01(lf, click - 24, click - 16), transform: `scale(${press})`, transformOrigin: '0 0'}}>
              <path d="M1 1 L1 17 L5.2 13 L8 19.6 L10.6 18.5 L7.8 12 L13.6 12 Z" fill="#F6F1E7" stroke="#0B0A09" strokeWidth={1.1} strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      {capH > 0 && (
        <div style={{position: 'absolute', left: tall ? r[0] : x, top: y + wh + 36 * u, width: tall ? r[2] : ww}}>
          {sub && <div style={{...caps(st, 26 * u, col), marginBottom: 12 * u, opacity: k01(lf, 8, 20)}}>{sub}</div>}
          {text && <div style={{...type(st, fs, ink)}}><Words text={text} lf={lf} start={10} /></div>}
        </div>
      )}
    </div>
  );
};
export default DeviceBrowser;

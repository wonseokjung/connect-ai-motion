// Film strip: your stills pass through the frame as frames of a strip of film, with two more strips far behind
// running the other way. The picture for "video". Ours.
import React from 'react';
import {Img} from 'remotion';
import {Box, SceneProps, Words, caps, fitLines, k01, media, type} from '../../../src/catalog/ui';

const Strip: React.FC<{urls: string[]; vertical: boolean; thick: number; span: number; offset: number; base: string; hole: string; first?: number}> = ({urls, vertical, thick, span, offset, base, hole, first = 0}) => {
  // along = the direction the film runs; frames keep the pictures' 16:9 shape
  const fa = vertical ? (thick * 0.7 * 9) / 16 : (thick * 0.7 * 16) / 9;
  const gap = thick * 0.045, pitch = fa + gap;
  const hp = thick * 0.105, hw = thick * 0.05, hh = thick * 0.07;
  const j0 = Math.floor(offset / pitch) - 1, count = Math.ceil(span / pitch) + 3;
  const h0 = Math.floor(offset / hp) - 1, hc = Math.ceil(span / hp) + 3;
  const n = Math.max(1, urls.length);
  const box = (along: number, across: number, la: number, lc: number): React.CSSProperties => (vertical ? {left: across, top: along, width: lc, height: la} : {left: along, top: across, width: la, height: lc});
  return (
    <div style={{position: 'absolute', ...box(-span / 2, -thick / 2, span, thick), background: base, overflow: 'hidden', boxShadow: `0 ${thick * 0.06}px ${thick * 0.16}px rgba(0,0,0,0.55)`}}>
      {Array.from({length: hc}, (_, i) => {
        const a = (h0 + i) * hp - offset + (hp - hw) / 2;
        return (
          <React.Fragment key={'h' + (h0 + i)}>
            <div style={{position: 'absolute', ...box(a, thick * 0.04, hw, hh), borderRadius: hw * 0.22, background: hole}} />
            <div style={{position: 'absolute', ...box(a, thick * 0.96 - hh, hw, hh), borderRadius: hw * 0.22, background: hole}} />
          </React.Fragment>
        );
      })}
      {Array.from({length: count}, (_, i) => {
        const j = j0 + i;
        const a = j * pitch - offset + gap / 2;
        return (
          <div key={'f' + j} style={{position: 'absolute', ...box(a, thick * 0.15, fa, thick * 0.7), borderRadius: thick * 0.012, overflow: 'hidden', background: '#000'}}>
            <Img src={urls[(((j + first) % n) + n) % n]} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        );
      })}
    </div>
  );
};

const PhotoStrip: React.FC<SceneProps> = ({it, r, lf, st, u, W, H, tall}) => {
  const urls = (Array.isArray(it.images) ? it.images : []).slice(0, 8).map((x: any) => media(x));
  const text = String(it.text || ''), sub = String(it.sub || '');
  const speed = Number(it.speed ?? 1);
  const long = Math.hypot(W, H) * 1.25;
  const thick = tall ? W * 0.74 : H * 0.6;
  // the film runs fast as the scene opens and settles to a steady pace
  const move = (lf * 7.5 * speed + 520 * k01(lf, 0, 34)) * u;
  const tilt = tall ? 4 : -4.5;
  const {fs, lines} = fitLines(text || 'X', r[2] * (tall ? 1 : 0.6), r[3] * 0.16, 2, st.weight, st.tracking);
  const side = (pos: number, k: number, t: number, first: number) => (
    <div style={{position: 'absolute', left: tall ? W * pos : W / 2, top: tall ? H / 2 : H * pos, transform: `rotate(${t}deg)`, opacity: 0.4, filter: `blur(${3 * u}px)`}}>
      <Strip urls={urls} vertical={tall} thick={thick * 0.42} span={long} offset={-move * 0.5 * k + 4000 * u} base="#191613" hole="#060505" first={first} />
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      {side(tall ? 0.06 : 0.04, 1, tilt + (tall ? 5 : 6), 2)}
      {side(tall ? 0.95 : 0.97, 0.7, tilt - (tall ? 4 : 3), 1)}
      <div style={{position: 'absolute', left: W / 2, top: H * (tall ? 0.5 : text || sub ? 0.46 : 0.5), transform: `rotate(${tilt}deg)`, opacity: k01(lf, 0, 6)}}>
        <Strip urls={urls} vertical={tall} thick={thick} span={long} offset={move} base="#1d1a16" hole="#070606" />
      </div>
      {(text || sub) && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', background: 'linear-gradient(0deg, rgba(8,7,6,0.88) 0%, rgba(8,7,6,0.5) 45%, transparent 100%)'}} />}
      {(text || sub) && (
        <Box r={r}>
          <div style={{position: 'absolute', left: 0, bottom: tall ? r[3] * 0.02 : 0}}>
            {sub && <div style={{...caps(st, 26 * u, st.accentHi), marginBottom: 14 * u, opacity: k01(lf, 8, 20)}}>{sub}</div>}
            {text && lines.map((l, i) => <div key={i} style={{...type(st, fs, '#F6F1E7')}}><Words text={l} lf={lf} start={10 + i * 6} /></div>)}
          </div>
        </Box>
      )}
    </div>
  );
};
export default PhotoStrip;

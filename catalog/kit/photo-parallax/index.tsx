// Depth from flat pictures: two to five layers (back to front) slide at different speeds as the camera moves,
// and the words stand between the layers. Ours.
import React from 'react';
import {Img} from 'remotion';
import {Box, SceneProps, Words, caps, fitLines, k01, media, type} from '../../../src/catalog/ui';

const PhotoParallax: React.FC<SceneProps> = ({it, r, lf, dur, st, u, W, H, tall}) => {
  const layers: any[] = (Array.isArray(it.layers) ? it.layers : []).slice(0, 5);
  const n = Math.max(1, layers.length);
  const t = (lf + 12) / (dur + 24) - 0.5; // -0.5 .. 0.5 over the beat
  const dir = it.move === 'up' ? [0, 1] : it.move === 'right' ? [1, 0] : [-1, 0];
  const amount = Number(it.depth ?? 1);
  const text = String(it.text || ''), sub = String(it.sub || '');
  const {fs, lines} = fitLines(text, r[2] * 0.9, r[3] * (tall ? 0.22 : 0.3), 2, st.weight, st.tracking);
  const mid = Math.min(n - 1, Math.max(1, Number(it.behind ?? n - 1))); // the words go under the layers from this one on
  const layer = (x: any, i: number) => {
    const d = n === 1 ? 0.5 : i / (n - 1); // 0 = far, 1 = near
    const shift = (2 + d * 9) * amount; // % of the frame over the whole beat
    return (
      <Img key={i} src={media(x)} style={{position: 'absolute', left: '-7%', top: '-7%', width: '114%', height: '114%', objectFit: 'cover', objectPosition: '50% 100%', transform: `translate(${dir[0] * t * shift}%, ${dir[1] * t * shift}%) scale(${1 + d * 0.06 + (t + 0.5) * 0.03 * (0.4 + d)})`, opacity: k01(lf, -2 + i * 2, 8 + i * 2)}} />
    );
  };
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: String(it.sky || '#0B0A09')}}>
      {layers.slice(0, mid).map((x, i) => layer(x, i))}
      <Box r={r}>
        <div style={{position: 'absolute', left: 0, right: 0, top: r[3] * (tall ? 0.2 : 0.16), textAlign: 'center', transform: `translateY(${-t * 30 * u}px)`}}>
          {sub && <div style={{...caps(st, 26 * u, st.accentHi), marginBottom: 14 * u, opacity: k01(lf, 6, 18)}}>{sub}</div>}
          {lines.map((l, i) => <div key={i} style={{...type(st, fs, '#F6F1E7')}}><Words text={l} lf={lf} start={8 + i * 5} /></div>)}
        </div>
      </Box>
      {layers.slice(mid).map((x, i) => layer(x, i + mid))}
    </div>
  );
};
export default PhotoParallax;

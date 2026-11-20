// Lottie adapter: any Lottie .json (After Effects / LottieFiles export) through @remotion/lottie, as a scene:
// the animation in the middle of the safe box, and if the line has "text" / "sub", the words under it.
// The animation plays once over the beat unless meta.loop is true. (Same adapter idea as connect-ai-video-motion.)
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {Lottie, LottieAnimationData} from '@remotion/lottie';
import {assetName} from '../core/assets.mjs';
import {kindOf} from '../core/catalog.mjs';
import {Words, caps, fit, k01, type} from '../catalog/ui';

export const LottieFile: React.FC<any> = ({it, r, lf, dur, fps, st, ink, u, tall}) => {
  const mt = it.meta || {};
  const kind = kindOf(it.kind);
  const file = kind === 'lottie' ? assetName('lottie', it.src) : assetName(kind, mt.src);
  const [data, setData] = useState<LottieAnimationData | null>(null);
  const [h] = useState(() => delayRender(`Lottie ${file}`));
  useEffect(() => {
    fetch(staticFile('fm-assets/' + file))
      .then((x) => x.json())
      .then((j) => {
        setData(j);
        continueRender(h);
      })
      .catch((e) => {
        console.error('Lottie failed', e);
        continueRender(h);
      });
  }, [file]);
  if (!data) return null;
  const text = String(it.text || ''), sub = String(it.sub || '');
  const frames = (data as any).op - (data as any).ip || 60;
  const own = frames / ((data as any).fr || 30);
  const play = Math.min(dur / fps, mt.play || own * 1.2);
  const rate = mt.loop ? 1 : own / Math.max(0.1, play);
  const side = Math.min(r[2], r[3]) * (it.scale ?? (text ? (tall ? 0.8 : 0.62) : 0.8));
  const fs = text ? fit(text, r[2] * 0.92, r[3] * 0.16, st.weight, st.tracking) : 0;
  const block = side + (text ? fs * 1.5 : 0) + (sub ? 50 * u : 0);
  const top = r[1] + (r[3] - block) / 2;
  return (
    <>
      <div style={{position: 'absolute', left: r[0] + (r[2] - side) / 2, top, width: side, height: side}}>
        <Lottie animationData={data} playbackRate={rate} loop={!!mt.loop} style={{width: '100%', height: '100%'}} />
      </div>
      {text && <div style={{position: 'absolute', left: r[0], width: r[2], top: top + side + fs * 0.2, textAlign: 'center', ...type(st, fs, ink)}}><Words text={text} lf={lf} start={12} /></div>}
      {sub && <div style={{position: 'absolute', left: r[0], width: r[2], top: top + side + fs * 1.55, textAlign: 'center', ...caps(st, 28 * u, st.accentHi), opacity: k01(lf, 24, 36)}}>{sub}</div>}
    </>
  );
};

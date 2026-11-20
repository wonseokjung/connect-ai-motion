// Clip adapter: a video made by any other tool (Manim, Motion Canvas, Blender, a screen recording, a lesson-2 film)
// becomes a scene. {"kind": "clip", "src": "./input/manim.mp4", "fit": "cover" | "contain", "from": seconds, "sound": false}
import React from 'react';
import {OffthreadVideo, staticFile} from 'remotion';
import {assetName} from '../core/assets.mjs';

export const ClipScene: React.FC<any> = ({it, r, full, lf, fps, st}) => {
  const box: number[] = it.fit === 'contain' ? r : full;
  const start = Math.max(0, Math.round((Number(it.from) || 0) * fps));
  return (
    <div style={{position: 'absolute', left: box[0], top: box[1], width: box[2], height: box[3], overflow: 'hidden', borderRadius: it.fit === 'contain' ? st.radius : 0, background: '#000'}}>
      <OffthreadVideo src={staticFile('fm-assets/' + assetName('clip', it.src))} startFrom={start} muted={it.sound !== true} style={{width: '100%', height: '100%', objectFit: it.fit === 'contain' ? 'contain' : 'cover'}} />
    </div>
  );
};

// Collage: your pictures land one by one like prints on a table and build a wall that fills the frame. Ours.
import React from 'react';
import {Img, random} from 'remotion';
import {SceneProps, caps, itemAt, itemsOf, k01, media, mix} from '../../../src/catalog/ui';

// [x, y, w, h] of each print as a share of the frame, for 3-6 pictures
const WIDE: Record<number, number[][]> = {
  1: [[0.08, 0.08, 0.84, 0.84]],
  2: [[0.03, 0.12, 0.47, 0.76], [0.5, 0.12, 0.47, 0.76]],
  3: [[0.025, 0.05, 0.57, 0.9], [0.615, 0.05, 0.36, 0.43], [0.615, 0.52, 0.36, 0.43]],
  4: [[0.03, 0.05, 0.46, 0.43], [0.51, 0.05, 0.46, 0.43], [0.03, 0.52, 0.46, 0.43], [0.51, 0.52, 0.46, 0.43]],
  5: [[0.025, 0.05, 0.47, 0.45], [0.505, 0.05, 0.47, 0.45], [0.025, 0.54, 0.31, 0.41], [0.345, 0.54, 0.31, 0.41], [0.665, 0.54, 0.31, 0.41]],
  6: [[0.025, 0.05, 0.31, 0.43], [0.345, 0.05, 0.31, 0.43], [0.665, 0.05, 0.31, 0.43], [0.025, 0.52, 0.31, 0.43], [0.345, 0.52, 0.31, 0.43], [0.665, 0.52, 0.31, 0.43]],
};
const TALL: Record<number, number[][]> = {
  1: [[0.06, 0.25, 0.88, 0.4]],
  2: [[0.05, 0.12, 0.9, 0.36], [0.05, 0.5, 0.9, 0.36]],
  3: [[0.05, 0.06, 0.9, 0.28], [0.05, 0.36, 0.9, 0.28], [0.05, 0.66, 0.9, 0.28]],
  4: [[0.04, 0.06, 0.92, 0.29], [0.04, 0.37, 0.45, 0.25], [0.51, 0.37, 0.45, 0.25], [0.04, 0.64, 0.92, 0.29]],
  5: [[0.04, 0.05, 0.92, 0.29], [0.04, 0.36, 0.45, 0.27], [0.51, 0.36, 0.45, 0.27], [0.04, 0.65, 0.45, 0.27], [0.51, 0.65, 0.45, 0.27]],
  6: [[0.04, 0.05, 0.45, 0.28], [0.51, 0.05, 0.45, 0.28], [0.04, 0.35, 0.45, 0.28], [0.51, 0.35, 0.45, 0.28], [0.04, 0.65, 0.45, 0.28], [0.51, 0.65, 0.45, 0.28]],
};

const PhotoCollage: React.FC<SceneProps> = ({it, lf, dur, st, u, fps, W, H, tall}) => {
  const items = itemsOf(it).slice(0, 6);
  const n = Math.max(1, items.length);
  const cells = (tall ? TALL : WIDE)[n] || WIDE[4];
  const seed = String(it.seed ?? 'prints');
  const paper = '#EFE8DA';
  const edge = 11 * u;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      {items.map((x, i) => {
        const c = cells[i];
        const f = itemAt(it, i, n, dur, fps);
        const k = k01(lf, f, f + 18);
        const ang = (random(`${seed}-${i}`) - 0.5) * 6.4;
        const dx = (random(`${seed}-x-${i}`) - 0.5) * 22 * u, dy = (random(`${seed}-y-${i}`) - 0.5) * 18 * u;
        const label = x && typeof x === 'object' ? String(x.text || '') : '';
        const w = c[2] * W * 1.035, h = c[3] * H * 1.035;
        const foot = label ? 46 * u : edge;
        const sway = Math.sin((lf + i * 31) / 64) * 0.35;
        return (
          <div key={i} style={{position: 'absolute', left: c[0] * W - c[2] * W * 0.0175 + dx, top: c[1] * H - c[3] * H * 0.0175 + dy, width: w, height: h, background: paper, boxShadow: `0 ${mix(60, 14, k) * u}px ${mix(90, 30, k) * u}px rgba(0,0,0,${mix(0.25, 0.55, k)})`, opacity: k01(lf, f, f + 5), transform: `translateY(${(1 - k) * -60 * u}px) rotate(${ang + sway + (1 - k) * (i % 2 ? 9 : -9)}deg) scale(${mix(1.3, 1, k)})`}}>
            <div style={{position: 'absolute', left: edge, top: edge, right: edge, bottom: foot, overflow: 'hidden', background: '#1a1714'}}>
              <Img src={media(x)} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 - 0.06 * Math.max(0, Math.min(1, (lf - f) / Math.max(1, dur - f)))})`}} />
            </div>
            {label && <div style={{position: 'absolute', left: edge + 4 * u, right: edge, bottom: 0, height: 46 * u, display: 'flex', alignItems: 'center', ...caps(st, 20 * u, '#2a2520'), overflow: 'hidden'}}>{label}</div>}
          </div>
        );
      })}
    </div>
  );
};
export default PhotoCollage;

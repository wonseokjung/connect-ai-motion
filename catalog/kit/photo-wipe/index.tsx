// Two pictures, one line between them: the line sweeps across and the second picture takes over.
// With "wire": true and no second picture, the same picture turns into its drawing: grey, a tint and a grid
// (real on one side, virtual on the other). Ours.
import React from 'react';
import {Img} from 'remotion';
import {Box, INOUT, SceneProps, caps, cueAt, hexA, hueOf, k01, media, mix} from '../../../src/catalog/ui';

const PhotoWipe: React.FC<SceneProps> = ({it, r, lf, dur, st, u, W, H, tall}) => {
  const col = hueOf(it, '#3FB7A6');
  const at = cueAt(it, 'wipe', Math.round(dur * 0.3));
  const to = Number(it.stop ?? 0.5);
  // the line comes in from the right edge, lands, then keeps drifting a little: never a still frame
  const k = k01(lf, at, at + 26, INOUT);
  const drift = Math.sin(Math.max(0, lf - at - 26) / 38) * 0.035 * k;
  const x = W * (mix(1.02, to, k) + drift);
  const pan = Math.max(0, Math.min(1, (lf + 10) / (dur + 20)));
  const move = `scale(${1.08 + 0.05 * pan}) translate(${-1.2 * pan}%, ${-0.6 * pan}%)`;
  const img: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: W, height: H, objectFit: 'cover', objectPosition: String(it.focus || '50% 50%'), transform: move};
  const a = media(it.src), b = it.src2 ? media(it.src2) : a;
  const wire = !it.src2 || it.wire === true;
  const step = (tall ? 90 : 96) * u;
  const nx = Math.ceil(W / step) + 1, ny = Math.ceil(H / step) + 1;
  const label = String(it.label || ''), label2 = String(it.label2 || '');
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: '#000'}}>
      <Img src={a} style={{...img, opacity: k01(lf, -2, 8)}} />
      <div style={{position: 'absolute', left: x, top: 0, width: Math.max(0, W - x), height: H, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -x, top: 0, width: W, height: H}}>
          <Img src={b} style={{...img, filter: wire ? 'grayscale(1) contrast(1.35) brightness(0.5)' : undefined}} />
          {wire && (
            <>
              <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: hexA(col, 0.3), mixBlendMode: 'screen'}} />
              <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
                {Array.from({length: nx}, (_, i) => <line key={'v' + i} x1={i * step} y1={0} x2={i * step} y2={H} stroke={col} strokeOpacity={0.5} strokeWidth={Math.max(1, 1.2 * u)} />)}
                {Array.from({length: ny}, (_, i) => <line key={'h' + i} x1={0} y1={i * step} x2={W} y2={i * step} stroke={col} strokeOpacity={0.5} strokeWidth={Math.max(1, 1.2 * u)} />)}
                {Array.from({length: nx * ny}, (_, i) => {
                  const cx = (i % nx) * step, cy = Math.floor(i / nx) * step;
                  const on = k01(lf, at + 10 + ((cx / W) * 18 + (cy / H) * 8), at + 22 + ((cx / W) * 18 + (cy / H) * 8));
                  return <rect key={i} x={cx - 3 * u} y={cy - 3 * u} width={6 * u} height={6 * u} fill="#F6F1E7" opacity={on * 0.9} />;
                })}
              </svg>
            </>
          )}
        </div>
      </div>
      <div style={{position: 'absolute', left: x - Math.max(1, 1.5 * u), top: 0, width: Math.max(2, 3 * u), height: H, background: '#F6F1E7', opacity: k01(lf, at - 2, at + 4)}} />
      <div style={{position: 'absolute', left: x - 13 * u, top: H * 0.5 - 46 * u, width: 26 * u, height: 92 * u, borderRadius: 13 * u, background: '#F6F1E7', opacity: k01(lf, at - 2, at + 4), boxShadow: `0 ${6 * u}px ${24 * u}px rgba(0,0,0,0.45)`}} />
      {(label || label2) && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%', background: 'linear-gradient(0deg, rgba(8,7,6,0.72), transparent)'}} />}
      <Box r={r}>
        {label && <div style={{position: 'absolute', left: 0, bottom: 0, ...caps(st, (tall ? 30 : 32) * u, '#F6F1E7'), opacity: k01(lf, 4, 16)}}>{label}</div>}
        {label2 && <div style={{position: 'absolute', right: 0, bottom: 0, ...caps(st, (tall ? 30 : 32) * u, col), opacity: k01(lf, at + 14, at + 28)}}>{label2}</div>}
      </Box>
    </div>
  );
};
export default PhotoWipe;

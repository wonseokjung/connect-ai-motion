// Device frames drawn with plain boxes: a phone body and a laptop. The picture inside is yours.
// No brand marks, no fake interface: only the glass, the edge and the light.
import React from 'react';
import {Img, OffthreadVideo} from 'remotion';

const VIDEO = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

/** a picture or a clip that covers its box; `pan` (0-1) drifts it a little so a still stays alive */
export const Screen: React.FC<{src: string; file?: string; pan?: number; zoom?: number; position?: string}> = ({src, file, pan = 0, zoom = 1.06, position = '50% 0%'}) => {
  const style: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, transform: `scale(${zoom - (zoom - 1) * pan}) translateY(${-pan * 1.2}%)`, transformOrigin: '50% 30%'};
  return VIDEO.test(file || src) ? <OffthreadVideo src={src} muted style={style} /> : <Img src={src} style={style} />;
};

/** phone: w x h box. Children go on top of the screen (inside the glass). */
export const Phone: React.FC<{w: number; h: number; src: string; file?: string; pan?: number; sheen?: number; edge?: string; position?: string}> = ({w, h, src, file, pan = 0, sheen = -1, edge = '#8a7f70', position}) => {
  const b = w * 0.032;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: w * 0.15, background: 'linear-gradient(145deg, #4a443c 0%, #1c1a17 38%, #2b2723 100%)', boxShadow: `0 0 0 ${Math.max(1.5, w * 0.006)}px ${edge}, ${-w * 0.02}px ${w * 0.012}px 0 #3a352e, ${-w * 0.036}px ${w * 0.022}px 0 #24211c, 0 ${w * 0.2}px ${w * 0.34}px rgba(0,0,0,0.6)`}}>
      <div style={{position: 'absolute', left: b, top: b, right: b, bottom: b, borderRadius: w * 0.12, overflow: 'hidden', background: '#050505'}}>
        <Screen src={src} file={file} pan={pan} position={position} />
        <div style={{position: 'absolute', left: '50%', top: w * 0.035, width: w * 0.26, height: w * 0.072, marginLeft: -w * 0.13, borderRadius: w * 0.04, background: '#050505'}} />
        {sheen >= 0 && sheen <= 1 && <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.11) 50%, transparent 62%)', transform: `translateX(${-120 + 240 * sheen}%)`}} />}
      </div>
    </div>
  );
};

/** laptop: the screen is w wide; `open` 0-1 lifts the lid. Total height is about w * 0.68. */
export const Laptop: React.FC<{w: number; src: string; file?: string; pan?: number; open?: number; edge?: string}> = ({w, src, file, pan = 0, open = 1, edge = '#8a7f70'}) => {
  const sh = w * 0.625, b = w * 0.016;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: sh + w * 0.05, perspective: w * 2.4, perspectiveOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: sh, borderRadius: `${w * 0.022}px ${w * 0.022}px 0 0`, background: '#1c1a17', boxShadow: `0 0 0 ${Math.max(1.5, w * 0.003)}px ${edge}`, transformOrigin: '50% 100%', transform: `rotateX(${-86 * (1 - open)}deg)`, opacity: Math.min(1, open * 4)}}>
        <div style={{position: 'absolute', left: b, top: b, right: b, bottom: b * 1.4, borderRadius: w * 0.01, overflow: 'hidden', background: '#050505'}}>
          <Screen src={src} file={file} pan={pan} />
        </div>
      </div>
      <div style={{position: 'absolute', left: -w * 0.08, top: sh, width: w * 1.16, height: w * 0.028, borderRadius: `0 0 ${w * 0.03}px ${w * 0.03}px`, background: 'linear-gradient(180deg, #a09584 0%, #4a443c 22%, #24211c 100%)', boxShadow: `0 ${w * 0.05}px ${w * 0.09}px rgba(0,0,0,0.6)`}}>
        <div style={{position: 'absolute', left: '50%', top: 0, width: w * 0.16, height: w * 0.008, marginLeft: -w * 0.08, borderRadius: `0 0 ${w * 0.008}px ${w * 0.008}px`, background: '#0f0e0c'}} />
      </div>
    </div>
  );
};

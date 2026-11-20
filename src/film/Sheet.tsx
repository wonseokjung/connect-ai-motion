// Sheet: stills of the film on one page, so a person (or an agent) can look at the whole thing at once.
//   mode "beats":   one still per beat at the moment it is finished, with its id, kind and time; red = check error
//   mode "seconds": one still every N seconds (a contact sheet for pacing)
import React from 'react';
import {AbsoluteFill, CalculateMetadataFunction, Freeze} from 'remotion';
import {Film, FilmProps, timelineFor} from './Film';
import {peakFrame} from '../core/timeline.mjs';
import {FONT} from '../catalog/ui';

export type SheetProps = FilmProps & {mode?: 'beats' | 'seconds'; every?: number; cols?: number; bad?: string[]; title?: string; cells?: {f: number; id: string; label: string; sub: string}[]; cw?: number};

export const calcSheet: CalculateMetadataFunction<SheetProps> = async ({props}) => {
  const tl = timelineFor(props.data, props.aspect);
  const cells =
    props.mode === 'seconds'
      ? Array.from({length: Math.max(1, Math.ceil(tl.seconds / (props.every || 1)))}, (_, i) => {
          const f = Math.min(tl.frames - 1, Math.round((i * (props.every || 1) + 0.5 * (props.every || 1)) * tl.fps));
          const b = tl.beats.find((x: any) => f >= x.f0 && f < x.f1) || tl.beats[tl.beats.length - 1];
          return {f, id: b.id, label: `${(f / tl.fps).toFixed(1)} s`, sub: b.id};
        })
      : tl.beats.map((b: any, i: number) => ({f: peakFrame(tl, i), id: b.id, label: `${b.id} · ${b.t0.toFixed(1)}-${b.t1.toFixed(1)} s`, sub: `${b.kind}${b.tr ? '  ← ' + b.tr.kind : ''}`}));
  const tall = tl.H > tl.W;
  const cols = props.cols || (tall ? Math.min(8, Math.max(4, Math.ceil(Math.sqrt(cells.length * 2.4)))) : Math.min(5, Math.max(2, Math.ceil(Math.sqrt(cells.length)))));
  const cw = tall ? 250 : 440;
  const ch = Math.round((cw * tl.H) / tl.W);
  const rows = Math.ceil(cells.length / cols);
  // as long as the film (the still is frame 0): the scenes inside are sequences, and a sequence is cut to the composition's length
  return {durationInFrames: tl.frames, fps: tl.fps, width: cols * (cw + 14) + 14, height: 62 + rows * (ch + 52) + 10, props: {...props, tl, cells, cols, cw}};
};

export const Sheet: React.FC<SheetProps> = (p) => {
  const tl = p.tl;
  const cells = p.cells || [];
  const cols = p.cols || 4, cw = p.cw || 440, ch = Math.round((cw * tl.H) / tl.W), k = cw / tl.W;
  return (
    <AbsoluteFill style={{background: '#0B0A09', fontFamily: FONT, color: '#EBE2D2'}}>
      <div style={{position: 'absolute', left: 16, top: 16, fontSize: 22, fontWeight: 300, whiteSpace: 'nowrap'}}>{p.title || 'connect-ai-motion sheet'}</div>
      {cells.map((c, i) => {
        const x = 14 + (i % cols) * (cw + 14), y = 62 + Math.floor(i / cols) * (ch + 52);
        const bad = (p.bad || []).includes(c.id);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: cw}}>
            <div style={{width: cw, height: ch, overflow: 'hidden', position: 'relative', outline: bad ? '3px solid #E0605A' : '1px solid #2a2622'}}>
              <div style={{width: tl.W, height: tl.H, transform: `scale(${k})`, transformOrigin: '0 0', position: 'absolute'}}>
                <Freeze frame={c.f}>
                  <Film data={p.data ? {...p.data, voiceFile: null, sfxFile: null} : null} aspect={p.aspect} tl={tl} captions={p.captions} />
                </Freeze>
              </div>
            </div>
            <div style={{marginTop: 6, fontSize: 13, color: bad ? '#E0605A' : '#F2B45A', whiteSpace: 'nowrap', overflow: 'hidden'}}>{c.label}</div>
            <div style={{fontSize: 11, color: 'rgba(235,226,210,0.55)', whiteSpace: 'nowrap', overflow: 'hidden'}}>{c.sub}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

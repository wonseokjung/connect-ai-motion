// Film: the whole storyboard as one composition. Layers, bottom to top:
//   the style's base colour -> the film's continuous background ("bg") -> the scenes (one per beat, cut or
//   transition between them) -> sweeps (light passing over a cut) -> grain + vignette -> voice and sound.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {METAS} from '../catalog/metas.generated.mjs';
import {SCENES, BGS, TRANSITIONS, SWEEPS} from '../catalog/registry.generated';
import {USER} from '../catalog/user.generated';
import {buildTimeline, seriesPlan} from '../core/timeline.mjs';
import {metaFor} from '../core/catalog.mjs';
import {toWords} from '../core/words.mjs';
import {getStyle} from '../styles/presets.mjs';
import {Grain, Vignette} from '../parts/Atmos';
import {HyperFramesBlock} from '../adapters/HyperFrames';
import {LottieFile} from '../adapters/Lottie';
import {ClipScene} from '../adapters/Clip';
import {FONT, INOUT} from '../catalog/ui';
import {fontsReady} from '../brand';

export type FilmData = {story: any; words?: any; info?: any; voiceSeconds?: number; voiceFile?: string | null; sfxFile?: string | null};
export type FilmProps = {data: FilmData | null; aspect: '16x9' | '9x16' | '1x1'; tl?: any; captions?: boolean; clean?: boolean};

export const EMPTY: FilmData = {story: {beats: [{id: 'empty', kind: 'kit/ident', text: 'connect-ai-motion', sub: 'no storyboard yet'}]}};

export const timelineFor = (data: FilmData | null, aspect: string) => {
  const d = data || EMPTY;
  return buildTimeline({story: d.story, metas: METAS, words: d.words || null, voiceSeconds: d.voiceSeconds || 0, aspect});
};

export const calcFilm: CalculateMetadataFunction<FilmProps> = async ({props}) => {
  const tl = timelineFor(props.data, props.aspect);
  return {durationInFrames: tl.frames, fps: tl.fps, width: tl.W, height: tl.H, props: {...props, tl}};
};

export const sceneFor = (it: any): React.FC<any> | null => {
  const k = String(it.kind);
  if (k === 'custom') return (USER as any)[it.component] || null;
  if (k === 'hyperframes') return HyperFramesBlock;
  if (k === 'lottie') return LottieFile;
  if (k === 'clip') return ClipScene;
  return (SCENES as any)[k] || null;
};

const Layer: React.FC<{kind: any; frame: number; dur: number; W: number; H: number; st: any; safe: number[]}> = ({kind, frame, dur, W, H, st, safe}) => {
  const line = typeof kind === 'string' ? {kind} : kind || {};
  const G = (BGS as any)[line.kind];
  if (!G) return null;
  const u = Math.min(W, H) / 1080;
  return <G it={{...line, meta: metaFor(line, METAS)}} r={safe} full={[0, 0, W, H]} lf={frame} dur={dur} st={st} ink={st.ink} scrim={0} u={u} fps={30} W={W} H={H} tall={H > W * 1.2} />;
};

const SceneHost: React.FC<{b: any; lead: number; tl: any; st: any; words: any[]; captions?: boolean; push?: boolean}> = ({b, lead, tl, st, words, captions, push = true}) => {
  const f = useCurrentFrame();
  const lf = f - lead;
  const {W, H, fps} = tl;
  const u = Math.min(W, H) / 1080;
  const G = sceneFor(b.it);
  const w = words.filter((x) => x.t0 >= b.t0 - 0.05 && x.t0 < b.t1).map((x) => ({w: x.w, t0: x.t0 - b.t0, t1: x.t1 - b.t0}));
  return (
    <AbsoluteFill style={{background: b.it.bg ? st.bg : undefined}}>
      {b.it.bg && <Layer kind={b.it.bg} frame={Math.max(0, lf)} dur={b.dur} W={W} H={H} st={st} safe={tl.safe} />}
      {G ? (
        // a very slow push-in keeps a finished scene alive (motion, not slides); "push": false in the storyboard turns it off
        <AbsoluteFill style={{transform: push ? `scale(${1 + 0.028 * Math.max(0, Math.min(1, lf / Math.max(1, b.dur)))})` : undefined}}>
          <G it={b.it} r={tl.safe} full={[0, 0, W, H]} lf={lf} dur={b.dur} st={st} ink={st.ink} scrim={0} u={u} fps={fps} W={W} H={H} tall={H > W * 1.2} words={w} />
        </AbsoluteFill>
      ) : (
        <div style={{position: 'absolute', left: tl.safe[0], top: tl.safe[1], fontFamily: FONT, color: '#E0605A', fontSize: 34 * u}}>{b.id}: no scene called {String(b.kind)}</div>
      )}
      {captions && <Caption b={b} tl={tl} st={st} />}
    </AbsoluteFill>
  );
};

// gallery label: kind, where it comes from, licence
const Caption: React.FC<{b: any; tl: any; st: any}> = ({b, tl, st}) => {
  const m = (b.it.cap && (METAS as any)[b.it.cap]) || b.meta || {};
  const u = Math.min(tl.W, tl.H) / 1080;
  const src = m.source?.package || m.source?.repo || m.source?.type || '';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: `${60 * u}px ${44 * u}px ${30 * u}px`, background: `linear-gradient(0deg, rgba(0,0,0,0.72), transparent)`, fontFamily: FONT, color: st.name === 'paper' ? '#F2ECE0' : st.ink, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
      <div>
        <div style={{fontSize: 30 * u, fontWeight: 300}}>{m.title || b.kind}</div>
        <div style={{fontSize: 19 * u, marginTop: 6 * u, opacity: 0.75, letterSpacing: '0.03em'}}>kind <span style={{color: '#F2B45A'}}>{m.kind || b.kind}</span> · {src} · {m.license}</div>
      </div>
      <div style={{fontSize: 19 * u, opacity: 0.6, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.1em'}}>{String(b.idx + 1).padStart(2, '0')} / {tl.beats.length}</div>
    </div>
  );
};

export const Film: React.FC<FilmProps> = ({data, aspect, tl: given, captions, clean}) => {
  const frame = useCurrentFrame();
  // scenes fit their words by measuring them, so nothing is drawn until the font is loaded
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const go = () => setReady(true);
    fontsReady.then(go, go);
  }, []);
  // the font hold is let go only after the scenes are on the page: a scene that loads something (a model, a texture)
  // has asked for its own hold by then, so no frame is taken in between
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  const d = data || EMPTY;
  const tl = given || timelineFor(d, aspect);
  const st = getStyle(d.story?.style || d.info?.style);
  const {W, H} = tl;
  const plan = seriesPlan(tl);
  const words = d.words ? toWords(d.words) : [];
  const kids: React.ReactNode[] = [];
  tl.beats.forEach((b: any, i: number) => {
    if (i > 0 && plan[i].T > 0) {
      const make = (TRANSITIONS as any)[b.tr.kind];
      if (make) kids.push(<TransitionSeries.Transition key={'t' + b.id} presentation={make(W, H, b.tr.it)} timing={linearTiming({durationInFrames: plan[i].T, easing: INOUT})} />);
    }
    kids.push(
      <TransitionSeries.Sequence key={b.id} durationInFrames={Math.round(plan[i].frames)}>
        <SceneHost b={b} lead={plan[i].lead} tl={tl} st={st} words={words} captions={captions} push={d.story?.push !== false && b.it.push !== false && b.meta?.push !== false} />
      </TransitionSeries.Sequence>,
    );
  });
  const fade = d.story?.fadeOut === false ? 1 : Math.min(1, (tl.frames - frame) / 10);
  return (
    <AbsoluteFill style={{background: st.bg}}>
      <AbsoluteFill style={{opacity: fade}}>
        {tl.bg && <Layer kind={tl.bg} frame={frame} dur={tl.frames} W={W} H={H} st={st} safe={tl.safe} />}
        {ready && <TransitionSeries>{kids}</TransitionSeries>}
        {tl.beats.map((b: any) => {
          if (!b.tr || b.tr.role !== 'sweep') return null;
          const S = (SWEEPS as any)[b.tr.kind];
          const n = b.tr.frames * 2;
          return S ? (
            <Sequence key={'s' + b.id} from={b.f0 - n / 2} durationInFrames={n} layout="none">
              <SweepHost S={S} it={b.tr.it} n={n} W={W} H={H} st={st} />
            </Sequence>
          ) : null;
        })}
        {!clean && st.vignette > 0 && <Vignette amount={st.vignette} />}
        {!clean && st.grain > 0 && <Grain opacity={st.grain} />}
      </AbsoluteFill>
      {d.voiceFile && <Audio src={staticFile(d.voiceFile)} />}
      {d.sfxFile && <Audio src={staticFile(d.sfxFile)} />}
    </AbsoluteFill>
  );
};

const SweepHost: React.FC<{S: React.FC<any>; it: any; n: number; W: number; H: number; st: any}> = ({S, it, n, W, H, st}) => {
  const lf = useCurrentFrame();
  return <S it={it} r={[0, 0, W, H]} full={[0, 0, W, H]} lf={lf} dur={n} st={st} ink={st.ink} scrim={0} u={Math.min(W, H) / 1080} fps={30} W={W} H={H} tall={H > W * 1.2} />;
};

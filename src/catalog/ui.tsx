// Shared pieces for catalog scenes: the props every scene gets, timing curves, type fitting, word reveals.
// Same contract as connect-ai-video-motion's GraphicProps (it, r, lf, dur, st, ink, scrim, u, fps, W, H), so a
// graphic written for one kit can be used in the other. In this kit `r` is the safe box of the whole frame.
import React from 'react';
import {Easing, interpolate, random, staticFile} from 'remotion';
import {fitText, measureText} from '@remotion/layout-utils';
import {FONT, MONO} from '../brand';
import {HUE as HUES, STAGE as STAGES} from '../styles/presets.mjs';
import {itemFrames, itemText} from '../core/timeline.mjs';
import {mediaName} from '../core/assets.mjs';

export type SceneProps = {
  it: any; // the storyboard line (text, sub, value, items ...) + it.meta (the catalog meta.json)
  r: number[]; // [x, y, w, h] safe box in output px: keep words inside it
  full: number[]; // [0, 0, W, H]: backgrounds and pictures may fill it
  lf: number; // frame since this beat's cut (negative while a transition is bringing it in)
  dur: number; // frames until the next cut
  st: any; // style tokens (styles/presets.mjs)
  ink: string; // text colour
  scrim: number; // kept for compatibility with connect-ai-video-motion graphics (always 0 here)
  u: number; // 1 = 1080 px short side
  fps: number;
  W: number;
  H: number;
  tall: boolean; // 9:16
  words?: {w: string; t0: number; t1: number}[]; // voice words inside this beat, seconds from the cut
};
export type GraphicProps = SceneProps;

export {FONT, MONO, itemText};
export const HUE = HUES as Record<string, string>;
export const STAGE = STAGES as Record<string, string>;
/** ground colour of a picture scene: "stage" in the storyboard (a name from STAGE or any colour), else `d`, else nothing */
export const stageOf = (it: any, d: string | null = null) => (it.stage ? STAGE[it.stage] || it.stage : d ? STAGE[d] || d : null);
/** URL of a picture / clip / model a storyboard line points to (the field must be listed in the scene's meta "media") */
export const media = (src: any) => staticFile('fm-assets/' + mediaName(String(src && typeof src === 'object' ? src.src : src)));
export const hueOf = (it: any, d: string, field = 'color') => (it[field] && HUE[it[field]]) || it[field] || d;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const IN = Easing.bezier(0.55, 0, 1, 0.45);
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const SNAP = Easing.bezier(0.34, 1.56, 0.64, 1);
export const k01 = (lf: number, a: number, b: number, e: (t: number) => number = OUT) => interpolate(lf, [a, b], [0, 1], {...clamp, easing: e});
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

export const measure = (text: string, fs: number, weight = 200, tracking = 0, font = FONT) => {
  try {
    return measureText({text: text || 'X', fontFamily: font, fontSize: fs, fontWeight: weight, letterSpacing: `${tracking}em`, validateFontIsLoaded: false}).width;
  } catch {
    return (text || 'X').length * fs * 0.52;
  }
};
/** biggest font size (up to `size`) at which `text` fits in `width` on one line */
export const fit = (text: string, width: number, size: number, weight = 200, tracking = 0, font = FONT) => {
  try {
    return Math.min(size, fitText({text: text || 'X', withinWidth: Math.max(10, width), fontFamily: font, fontWeight: weight, letterSpacing: `${tracking}em`, validateFontIsLoaded: false}).fontSize);
  } catch {
    return Math.min(size, Math.max(10, width) / (Math.max(1, (text || 'X').length) * 0.52));
  }
};
/** break words into at most `maxLines` lines of about the same length */
export const balance = (text: string, maxLines: number) => {
  // split on plain spaces only: a no-break space keeps two words on one line
  const ws = String(text).split(/[ \t\n]+/).filter(Boolean);
  const n = Math.max(1, Math.min(maxLines, ws.length));
  const total = ws.join(' ').length;
  const lines: string[] = [];
  let cur: string[] = [];
  let used = 0;
  ws.forEach((w, i) => {
    cur.push(w);
    used += w.length + 1;
    const left = ws.length - i - 1;
    const linesLeft = n - lines.length - 1;
    if (linesLeft > 0 && (used >= (total + 1) * ((lines.length + 1) / n) - 2 || left <= linesLeft - 1) && left >= linesLeft) {
      lines.push(cur.join(' '));
      cur = [];
    }
  });
  if (cur.length) lines.push(cur.join(' '));
  return lines;
};
/** font size for a paragraph: break into lines, fit the longest */
export const fitLines = (text: string, width: number, height: number, maxLines: number, weight = 200, tracking = 0, lh = 1.12) => {
  let best = {fs: 0, lines: [String(text)]};
  for (let n = 1; n <= maxLines; n++) {
    const lines = balance(text, n);
    const longest = lines.reduce((a, b) => (measure(a, 100, weight, tracking) > measure(b, 100, weight, tracking) ? a : b));
    const fs = Math.min(fit(longest, width, height / (lines.length * lh), weight, tracking), height / (lines.length * lh));
    if (fs > best.fs * 1.04) best = {fs, lines};
  }
  return best;
};

export const type = (st: any, fs: number, color: string, weight?: number): React.CSSProperties => ({fontFamily: FONT, fontSize: fs, fontWeight: weight ?? st.weight, letterSpacing: `${st.tracking}em`, color, whiteSpace: 'nowrap', lineHeight: 1.12});
export const caps = (st: any, fs: number, color: string): React.CSSProperties => ({fontFamily: FONT, fontSize: fs, fontWeight: st.heavy, letterSpacing: '0.24em', textTransform: 'uppercase', color, whiteSpace: 'nowrap', lineHeight: 1.2});

export const textOf = (it: any, d = '') => String(it.text ?? it.value ?? d);
export const numOf = (it: any, d = 0, field = 'value') => {
  const n = parseFloat(String(it[field] ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : d;
};
export const itemsOf = (it: any, d: any[] = []): any[] => (Array.isArray(it.items) ? it.items : Array.isArray(it.lines) ? it.lines : d);
/** frame (after the cut) when item i appears: the storyboard's time if it gave one, else spread by the kit */
export const itemAt = (it: any, i: number, n: number, dur: number, fps: number) => (Array.isArray(it._if) && it._if[i] != null ? it._if[i] : itemFrames(n, dur, fps)[i]);
export const cueAt = (it: any, name: string, d: number) => (it._cue && it._cue[name] != null ? it._cue[name] : d);

/** the safe box, as a positioned div */
export const Box: React.FC<{r: number[]; children?: React.ReactNode; style?: React.CSSProperties; scrim?: number; u?: number}> = ({r, children, style}) => (
  <div style={{position: 'absolute', left: r[0], top: r[1], width: r[2], height: r[3], ...style}}>{children}</div>
);

/** words come in one by one: blur to sharp, a little rise (the kit's default entrance) */
export const Words: React.FC<{text: string; lf: number; start?: number; gap?: number; style?: React.CSSProperties; hi?: string; hiColor?: string; rise?: number}> = ({text, lf, start = 0, gap = 3, style, hi, hiColor, rise = 0.28}) => {
  const ws = String(text).split(/(\s+)/);
  let n = 0;
  const hs = String(hi || '').toLowerCase().split(/\s+/).filter(Boolean);
  return (
    <span style={{...style, display: 'inline-block'}}>
      {ws.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i} style={{whiteSpace: 'pre'}}>{w}</span>;
        const k = k01(lf, start + n * gap, start + n * gap + 12);
        n++;
        const on = hs.includes(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
        return (
          <span key={i} style={{display: 'inline-block', opacity: k, filter: k < 1 ? `blur(${(1 - k) * 14}px)` : undefined, transform: `translateY(${(1 - k) * rise}em)`, color: on ? hiColor : undefined}}>
            {w}
          </span>
        );
      })}
    </span>
  );
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+-';
/** letters cycle through random glyphs, then lock left to right. Deterministic: same frame = same letters. */
export const Scramble: React.FC<{text: string; lf: number; start?: number; frames?: number; style?: React.CSSProperties}> = ({text, lf, start = 0, frames = 12, style}) => {
  const t = (lf - start) / frames;
  if (t < 0) return <span style={{...style, opacity: 0}}>{text}</span>;
  const out = [...text].map((ch, i) => (ch === ' ' || t >= (i + 1) / text.length ? ch : GLYPHS[Math.floor(random(`${text}-${i}-${Math.floor(lf)}`) * GLYPHS.length)])).join('');
  return <span style={{...style, opacity: Math.min(1, t * 3)}}>{out}</span>;
};

/** a thin rule that draws from the left */
export const Rule: React.FC<{x: number; y: number; w: number; k: number; color: string; h?: number}> = ({x, y, w, k, color, h = 2}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w * k, height: h, background: color}} />
);

export const hexA = (hex: string, a: number) => {
  const h = String(hex).replace('#', '');
  if (!/^[0-9a-f]{3,6}$/i.test(h)) return hex;
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// gallery: the catalog itself as a film. Every playable item gets one beat with its own example, so the gallery is
// rendered by the same engine as your film. Scenes play as they are; a background is shown under a key word;
// a transition is shown between two key words.
import fs from 'node:fs';
import path from 'node:path';
import {ffmpeg} from './ffmpeg.mjs';
import {playable, leadOf} from '../src/core/catalog.mjs';
import {shownText} from '../src/core/timeline.mjs';
import {countWords} from '../src/core/text.mjs';

const ORDER = ['kit', 'remotion', 'hyperframes', 'lottie', 'shader'];
const bySource = (a, b) => ORDER.indexOf(a.kind.split('/')[0]) - ORDER.indexOf(b.kind.split('/')[0]) || (a.kind < b.kind ? -1 : 1);

export function galleryStory(metas, {sources = [], role = 'scene', secs = 0, style = 'connect', bg = 'kit/bg-pool', lead = null} = {}) {
  const all = Object.values(metas).filter((m) => playable(m) && (!sources.length || sources.some((s) => m.kind === s || m.kind.startsWith(s + '/')))).sort(bySource);
  const beats = [];
  const slug = (k) => k.replace(/[^a-z0-9]+/gi, '-');
  if (role === 'scene') {
    // pictures first (objects, drawings, charts, photos, 3D), then the scenes that are carried by words
    const USE = ['hero3d', 'picture', 'device', 'character', 'chart', 'data', 'map', 'diagram', 'flow', 'timeline', 'code', 'prompt'];
    const rank = (m) => (leadOf(m) === 'picture' ? 0 : 100) + (USE.indexOf(m.use) < 0 ? 50 : USE.indexOf(m.use));
    const scenes = all.filter((x) => x.role === 'scene' && (!lead || leadOf(x) === lead)).sort((a, b) => rank(a) - rank(b) || bySource(a, b));
    // word scenes stand on grounds of different colours, so a row of them is never one amber wall
    const GROUNDS = [{kind: 'kit/bg-pool'}, {kind: 'kit/bg-pool', color: 'teal', x: 34}, {kind: 'remotion/bg-noise-contour', color: 'blue'}, {kind: 'kit/bg-pool', color: 'coral', x: 66}, {kind: 'remotion/bg-noise-dots', color: 'violet'}, {kind: 'kit/bg-pool', color: 'leaf', y: 40}];
    let g = 0;
    for (const m of scenes) {
      const it = {id: slug(m.kind), kind: m.kind, ...(m.example || {}), free: true};
      if (leadOf(m) === 'type' && !it.bg && bg) it.bg = GROUNDS[g++ % GROUNDS.length];
      const need = 0.7 + 0.22 * countWords(shownText(it).join(' '));
      beats.push({...it, dur: secs || Math.max(2.6, m.dur || 2.6, need)});
    }
  } else if (role === 'bg') {
    for (const m of all.filter((x) => x.role === 'bg')) beats.push({id: slug(m.kind), kind: 'kit/keyword', text: m.title, sub: m.source?.package || m.source?.type, bg: {kind: m.kind, ...(m.example || {})}, cap: m.kind, free: true, dur: secs || 3});
  } else {
    const tr = all.filter((x) => x.role === 'transition' || x.role === 'sweep');
    beats.push({id: 'start', kind: 'kit/keyword', text: 'Cut', sub: 'the default', free: true, dur: 1.6, bg: 'kit/bg-pool'});
    tr.forEach((m, i) => beats.push({id: slug(m.kind), kind: 'kit/keyword', text: m.title, sub: m.source?.package || m.source?.type, in: {kind: m.kind, ...(m.example || {})}, cap: m.kind, free: true, dur: secs || 2.4, bg: i % 2 ? 'kit/bg-pool' : 'remotion/bg-noise-contour', color: ['teal', 'coral', 'blue', 'violet', 'leaf', 'gold'][i % 6]}));
  }
  return {version: 1, title: `catalog: ${role}`, style, bg: role === 'scene' ? bg : null, sound: false, allowRepeat: true, rhythm: 99, fadeOut: false, beats};
}

/** cut the rendered gallery into one small looping clip per item (for the catalog page) */
export async function splitClips(file, tl, outDir, {width = 640, log = () => {}} = {}) {
  fs.mkdirSync(outDir, {recursive: true});
  const made = [];
  for (const b of tl.beats) {
    if (b.id === 'start') continue;
    const lead = b.tr ? b.tr.frames / tl.fps : 0;
    const t0 = Math.max(0, b.t0 - lead), d = b.t1 - t0 - 1 / tl.fps;
    const out = path.join(outDir, `${b.id}.mp4`);
    await ffmpeg(['-y', '-ss', t0.toFixed(3), '-i', file, '-t', d.toFixed(3), '-an', '-vf', `scale=${width}:-2`, '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
    const poster = path.join(outDir, `${b.id}.jpg`);
    await ffmpeg(['-y', '-ss', (t0 + d * 0.82).toFixed(3), '-i', file, '-frames:v', '1', '-vf', `scale=${width}:-2`, '-q:v', '4', poster]);
    made.push({id: b.id, kind: b.it.cap || b.kind, file: path.basename(out), poster: path.basename(poster), seconds: +d.toFixed(2), shown: shownText(b.it)});
    log(`  ${path.basename(out)}`);
  }
  return made;
}

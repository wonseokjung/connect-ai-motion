// render: one bundle, then film.mp4 (+ film_9x16.mp4, film_1x1.mp4) and the sheets. Remotion does all of it.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import {bundle, webpack} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {KIT, moduleDirs} from './project.mjs';
import {buildCatalog, prepareProject, writeUser} from './catalog-build.mjs';
import {buildTimeline} from '../src/core/timeline.mjs';
import {synth, writeWav} from './sound.mjs';

// WebGL / WebGPU scenes (three.js, light leaks, shaders) need a GPU-backed browser: ANGLE works on macOS, Windows, Linux.
export const chromiumOptions = {gl: 'angle'};
// your own scenes may live anywhere: let webpack find remotion / react in the kit's node_modules
// and import the kit's helpers as 'connect-ai-motion/ui'
// your own scenes come from this run's own registry file (never a file shared by two renders)
const webpackOverride = (userRegistry) => (c) => ({
  ...c,
  resolve: {...c.resolve, alias: {...((c.resolve && c.resolve.alias) || {}), 'connect-ai-motion/ui': path.join(KIT, 'src', 'catalog', 'ui.tsx')}, modules: [...moduleDirs(), 'node_modules', ...((c.resolve && c.resolve.modules) || [])]},
  plugins: [...(c.plugins || []), new webpack.NormalModuleReplacementPlugin(/[\\/]?user\.generated(\.tsx)?$/, userRegistry)],
});

// Each run gets its own folder in the system temp folder: the bundle (a copy of work/, often 50 MB and more) and the
// registry of your scenes. Two renders at once, or two projects with the same folder name, never meet. Removed at exit.
const RUNS = new Set();
const cleanup = () => { for (const d of RUNS) try { fs.rmSync(d, {recursive: true, force: true}); } catch {} RUNS.clear(); };
let hooked = false;
function runFolder(P) {
  if (!hooked) {
    hooked = true;
    process.once('exit', cleanup);
    for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => { cleanup(); process.exit(sig === 'SIGINT' ? 130 : 143); });
  }
  const tag = crypto.createHash('sha256').update(path.resolve(P.dir)).digest('hex').slice(0, 10);
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `connect-ai-motion-${tag}-`));
  RUNS.add(d);
  return d;
}

let cached = null;
export async function getBundle(P, story) {
  // Remotion keeps its browser in the node_modules/.remotion of the folder it runs from: run from the kit, so a
  // project folder never gets its own copy
  if (process.cwd() !== KIT) process.chdir(KIT);
  const {metas} = buildCatalog();
  const prep = prepareProject(P, story, metas);
  if (prep.errors.length) throw new Error('storyboard: ' + prep.errors.join('; '));
  const key = P.work + '|' + prep.users.map((x) => x.abs).join('|');
  if (cached && cached.key === key) return cached.url;
  const run = runFolder(P);
  const registry = path.join(run, 'user.generated.tsx');
  writeUser(prep.users, registry);
  const url = await bundle({entryPoint: path.join(KIT, 'src', 'index.ts'), publicDir: P.work, webpackOverride: webpackOverride(registry), outDir: path.join(run, 'bundle')});
  cached = {key, url};
  return url;
}

// a file appears under its real name only when it is complete (a stopped render never leaves a broken film.mp4)
const part = (file) => file.replace(/(\.[a-z0-9]+)$/i, '.part$1');
const finish = (file) => fs.renameSync(part(file), file);

export const concurrency = () => Number(process.env.CONNECT_AI_MOTION_CONCURRENCY) || Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2)));
const COMP = {'16x9': 'Film', '9x16': 'FilmShort', '1x1': 'FilmSquare'};
const NAME = {'16x9': 'film', '9x16': 'film_9x16', '1x1': 'film_1x1'};

/** code-made sound for the cuts -> work/sfx.wav (same for every shape) */
export function makeSound(P, data, metas) {
  const kind = data.story.sound;
  if (!kind || kind === 'none') return null;
  const tl = buildTimeline({story: data.story, metas, words: data.words, voiceSeconds: data.voiceSeconds, aspect: '16x9'});
  // under a voice the hits stay far below it
  writeWav(path.join(P.work, 'sfx.wav'), synth(tl, kind === true ? 'tones' : kind, {level: data.voiceFile ? 0.4 : 1}));
  return 'sfx.wav';
}

export async function render(P, data, {aspects = ['16x9'], only = null, scale = 1, sheet = true, media = true, bad = [], captions = false, crf = 18, log = console.log, name = null, seconds = 0} = {}) {
  const {metas} = buildCatalog();
  data.sfxFile = makeSound(P, data, metas);
  const serveUrl = await getBundle(P, data.story);
  const outs = [];
  for (const aspect of aspects) {
    const inputProps = {data, aspect, captions};
    const base = (name || NAME[aspect]) + (name && aspect !== '16x9' ? '_' + aspect : '');
    if (media) {
      const comp = await selectComposition({serveUrl, id: COMP[aspect], inputProps, chromiumOptions});
      let frameRange = null, tag = '';
      if (only) {
        const b = comp.props.tl.beats.find((x) => x.id === only);
        if (!b) throw new Error(`--only ${only}: no beat with this id in storyboard.json`);
        frameRange = [Math.max(0, b.f0 - 12), Math.min(comp.durationInFrames - 1, b.f1 + 12)];
        tag = `_only_${only}`;
      }
      const file = path.join(P.out, `${base}${tag}.mp4`);
      const t = Date.now();
      await renderMedia({composition: comp, serveUrl, codec: 'h264', crf, outputLocation: part(file), inputProps, concurrency: concurrency(), scale, frameRange, chromiumOptions, logLevel: 'error'});
      finish(file);
      log(`  ${path.relative(P.dir, file)}  (${((Date.now() - t) / 1000).toFixed(0)} s)`);
      outs.push(file);
    }
    if (sheet) {
      for (const [mode, suffix] of [['beats', 'sheet'], ...(seconds ? [['seconds', `sheet_${seconds}s`]] : [])]) {
        const props = {data, aspect, captions, mode, every: seconds || 1, bad, title: `${path.basename(P.dir)} · ${aspect} · ${mode === 'beats' ? 'one still per beat, when it is finished · red = check error' : `one still every ${seconds} s`}`};
        const comp = await selectComposition({serveUrl, id: 'Sheet', inputProps: props, chromiumOptions});
        const file = path.join(P.out, `${base === NAME[aspect] ? (aspect === '16x9' ? suffix : `${suffix}_${aspect}`) : `${base}_${suffix}`}.jpg`);
        await renderStill({composition: comp, serveUrl, output: part(file), inputProps: props, imageFormat: 'jpeg', jpegQuality: 88, chromiumOptions, logLevel: 'error'});
        finish(file);
        log(`  ${path.relative(P.dir, file)}`);
        outs.push(file);
      }
    }
  }
  return outs;
}

export async function renderStillAt(P, data, {aspect = '16x9', frame = 0, file, captions = false}) {
  const serveUrl = await getBundle(P, data.story);
  const inputProps = {data: {...data, voiceFile: null, sfxFile: null}, aspect, captions};
  const comp = await selectComposition({serveUrl, id: COMP[aspect], inputProps, chromiumOptions});
  await renderStill({composition: comp, serveUrl, output: file, inputProps, frame: Math.min(frame, comp.durationInFrames - 1), imageFormat: 'jpeg', jpegQuality: 90, chromiumOptions, logLevel: 'error'});
  return file;
}
export {fs};

// A project is a folder: storyboard.json (the plan), my-info.json, input/ (voice, subtitles, your own files),
// work/ (what the kit makes on the way), out/ (film, sheet, report).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseSrt} from '@remotion/captions';
import {spreadCues, vttToSrt} from '../src/core/words.mjs';
import {ffprobe} from './ffmpeg.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const KIT = path.resolve(HERE, '..');
// Where a package really is. Run from a clone, packages sit in <kit>/node_modules; run through npx, they sit next to
// the kit (<cache>/node_modules/connect-ai-motion and <cache>/node_modules/remotion). Walk up like Node does.
export function pkgDir(name, from = KIT) {
  let d = from;
  for (let i = 0; i < 8; i++) {
    const c = path.join(d, 'node_modules', name);
    if (fs.existsSync(path.join(c, 'package.json'))) return c;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
}
/** the node_modules folders the kit can see, nearest first */
export function moduleDirs() {
  const out = [];
  let d = KIT;
  for (let i = 0; i < 8; i++) {
    const c = path.join(d, 'node_modules');
    if (fs.existsSync(c) && !out.includes(c)) out.push(c);
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  if (path.basename(path.dirname(KIT)) === 'node_modules' && !out.includes(path.dirname(KIT))) out.unshift(path.dirname(KIT));
  return out;
}
export const AUDIO = /\.(wav|mp3|m4a|aac|flac|ogg)$/i;

// Files a storyboard names stay inside its project folder (or the kit's own examples for "kit:..."). A storyboard
// you were sent cannot reach ~/.ssh or a file behind a symbolic link that points out of the folder.
// To use a file from elsewhere, copy it into input/. `--outside-files` on the command line lifts this for one run.
export const outsideAllowed = () => process.env.CONNECT_AI_MOTION_OUTSIDE_FILES === '1';
const real = (p) => {
  try { return fs.realpathSync(p); } catch { return null; }
};
const within = (root, p) => {
  const rel = path.relative(root, p);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};
/**
 * The real path of a file a storyboard names, or {error}. `kit:` paths may only point into the kit's examples/.
 * @returns {{abs: string} | {error: string, abs?: string}}
 */
export function userFile(dir, name, {kit = true} = {}) {
  const n = String(name ?? '');
  if (!n) return {error: 'no file name'};
  if (kit && n.startsWith('kit:')) {
    const root = real(path.join(KIT, 'examples'));
    const abs = path.join(KIT, n.slice(4));
    const r = real(abs);
    if (!r) return {error: `${n} not found in the kit`, abs};
    if (!root || !within(root, r)) return {error: `${n}: "kit:" files come from the kit's examples/ folder only`, abs};
    return {abs: r};
  }
  const abs = path.resolve(dir, n);
  const r = real(abs);
  if (!r) return {error: `${n} not found (looked at ${abs})`, abs};
  if (!fs.statSync(r).isFile()) return {error: `${n} is a folder, not a file`, abs};
  const root = real(dir) || path.resolve(dir);
  if (!within(root, r) && !outsideAllowed()) return {error: `${n} is outside the project folder. Copy it into ${path.join(path.basename(dir), 'input')}/ and use "input/${path.basename(r)}" (or run with --outside-files if you trust this storyboard)`, abs};
  return {abs: r};
}

export function projectPaths(dir) {
  const p = {dir, input: path.join(dir, 'input'), work: path.join(dir, 'work'), out: path.join(dir, 'out')};
  for (const k of ['input', 'work', 'out']) fs.mkdirSync(p[k], {recursive: true});
  return p;
}
export const readJson = (f, d = null) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
export const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');

export function readStory(P) {
  const f = path.join(P.dir, 'storyboard.json');
  if (!fs.existsSync(f)) throw new Error(`No storyboard.json in ${P.dir}. Make one from your script: draft <script.md>, or run demo to see one.`);
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    throw new Error(`storyboard.json is not valid JSON: ${e.message}`);
  }
}
export const myInfo = (P) => readJson(path.join(P.dir, 'my-info.json')) || readJson(path.join(KIT, 'my-info.json'), {});

/** the voice file of a project: storyboard "voice", else the first audio file in input/ */
export function findVoice(P, story) {
  if (story?.voice === false) return null;
  if (story?.voice) {
    const f = userFile(P.dir, story.voice, {kit: false});
    // a storyboard can travel without its audio (a repository, a hand-over): it still checks and makes stills
    if (f.error && fs.existsSync(f.abs || '')) throw new Error(`"voice": ${f.error}`);
    return f.error ? null : f.abs;
  }
  const a = fs.readdirSync(P.input).filter((f) => AUDIO.test(f) && !f.startsWith('.')).sort();
  if (!a.length) return null;
  const f = userFile(P.dir, path.join('input', a[0]), {kit: false});
  if (f.error) throw new Error(`input/${a[0]}: ${f.error}`);
  return f.abs;
}

/** words.json for the voice: <voice>.words.json (tier A), .srt / .vtt (tier B), else nothing (tier C) */
export function findWords(P, voice) {
  const cand = [];
  if (voice) for (const ext of ['.words.json', '.srt', '.vtt']) cand.push(voice.replace(AUDIO, ext));
  for (const f of fs.readdirSync(P.input).sort()) if (/\.(words\.json|srt|vtt)$/i.test(f)) cand.push(path.join(P.input, f));
  for (const f of cand) {
    if (!fs.existsSync(f)) continue;
    const ok = userFile(P.dir, path.relative(P.dir, f), {kit: false});
    if (ok.error) throw new Error(`${path.basename(f)}: ${ok.error}`);
    if (/\.words\.json$/i.test(f)) {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      // accepted: Remotion captions [{text, startMs, endMs}], whisper-style [{word, start, end}], or {captions: [...]}
      const list = Array.isArray(j) ? j : j.captions || j.words || [];
      const captions = list.map((w) => (w.startMs != null ? {text: String(w.text).trim(), startMs: w.startMs, endMs: w.endMs, timestampMs: w.timestampMs ?? null, confidence: w.confidence ?? null} : {text: String(w.word ?? w.text).trim(), startMs: Math.round(w.start * 1000), endMs: Math.round(w.end * 1000), timestampMs: null, confidence: null}));
      return {tier: 'A', source: path.basename(f), captions};
    }
    const raw = fs.readFileSync(f, 'utf8');
    const cues = parseSrt({input: /\.vtt$/i.test(f) ? vttToSrt(raw) : raw}).captions;
    return {tier: 'B', source: path.basename(f), captions: spreadCues(cues), cues: cues.map((c) => ({text: c.text, startMs: c.startMs, endMs: c.endMs}))};
  }
  return null;
}

export async function audioSeconds(file) {
  const j = JSON.parse(await ffprobe(['-print_format', 'json', '-show_format', file]));
  return Number(j.format?.duration || 0);
}

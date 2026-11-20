// The beat director: storyboard.json -> a timeline of full-frame scenes. Pure JS (Node + browser), so the check
// and the render use exactly the same numbers.
//
// One line of the script = one beat = one scene. When does a beat start?
//   tier A  "at": {"text": "red", "near": 12.4}   the moment you say that word (voice + word times)
//   tier B  the same, from sentence subtitles (.srt / .vtt): about +-0.2 s
//   tier C  no voice: each beat lasts as long as its line takes to read ("dur" overrides)
import {metaFor, kindOf, playable, TEXT_FIELDS, LIST_FIELDS} from './catalog.mjs';
import {toWords, resolveAt} from './words.mjs';
import {readingSeconds} from './text.mjs';
import {SIZES, safeBox} from './zones.mjs';

export const FPS = 30;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const even = (n) => 2 * Math.round(n / 2);

/** frames (after the cut) when item i of n appears, when the storyboard gives no time for it */
export function itemFrames(n, dur, fps = FPS, lead = 8) {
  const gap = Math.min(fps * 1.4, Math.max(4, (dur * 0.72 - lead) / Math.max(1, n)));
  return Array.from({length: n}, (_, i) => Math.round(lead + i * gap));
}

const itemsOf = (it) => (Array.isArray(it.items) ? it.items : Array.isArray(it.lines) ? it.lines : null);
export const itemText = (x) => (x && typeof x === 'object' ? String(x.text ?? x.value ?? '') : String(x ?? ''));

/** every piece of text a line puts on screen, as one string per field */
export function shownText(it) {
  const out = [];
  for (const k of TEXT_FIELDS) if (it[k] != null && it[k] !== '') out.push(String(it[k]));
  for (const k of LIST_FIELDS) if (Array.isArray(it[k])) for (const x of it[k]) { out.push(itemText(x)); if (x && typeof x === 'object' && x.sub) out.push(String(x.sub)); }
  return out;
}

/**
 * @returns {{fps, W, H, aspect, frames, seconds, beats: Array, bg, tier, problems: Array<{id, what, msg}>, changes: number[], voice}}
 */
export function buildTimeline({story, metas, words = null, voiceSeconds = 0, aspect = '16x9', fps = FPS}) {
  const [W, H] = SIZES[aspect] || SIZES['16x9'];
  const problems = [];
  const wl = words ? toWords(words) : [];
  const tierOfWords = words?.tier || 'C';
  const src = Array.isArray(story?.beats) ? story.beats : [];
  const beats = [];
  let t = 0;

  const when = (at, id, what) => {
    try {
      const r = resolveAt(at, wl);
      return {t: r.t, tier: r.manual ? 'C' : tierOfWords};
    } catch (e) {
      problems.push({id, what: 'time', msg: `${id}: ${what}: ${e.message}. Use a word that is in the subtitles, or seconds.`});
      return null;
    }
  };

  // 1. start of every beat
  const starts = src.map((b, i) => {
    if (b.at == null) return null;
    return when(b.at, b.id || `b${i + 1}`, '"at"');
  });

  src.forEach((b, i) => {
    const id = String(b.id || `b${i + 1}`);
    const meta = metaFor(b, metas);
    const say = String(b.say ?? '');
    let start = starts[i] ? starts[i].t : t;
    if (i === 0 && !starts[i]) start = 0;
    if (start < t - 1e-6) {
      problems.push({id, what: 'time', msg: `${id}: starts at ${start.toFixed(2)} s, before the beat in front of it ends (${t.toFixed(2)} s). Check "at" or remove "dur" from the beat before.`});
      start = t;
    }
    // length: "dur" > until the next beat that has "at" > reading time of the line
    let nextAt = null;
    for (let j = i + 1; j < src.length; j++) if (starts[j]) { nextAt = j === i + 1 ? starts[j].t : null; break; }
    let dur;
    let how;
    if (b.dur != null) { dur = Number(b.dur); how = 'dur'; }
    else if (nextAt != null && nextAt > start + 0.3) { dur = nextAt - start; how = 'next'; }
    else {
      const shown = shownText(b).join(' ');
      const base = say || shown ? Math.max(readingSeconds(say), readingSeconds(shown) * 0.9) : meta?.dur || 2.6;
      dur = clampN(base, meta?.minDur || 1.8, meta?.maxDur || 6.5);
      // a beat timed by the kit never outstays the rhythm limit: at most `limit` seconds after its last change
      const limit = Number(story?.rhythm ?? 3) - 0.1;
      const ch = meta?.changes;
      const nItems = (itemsOf(b) || []).length;
      const nWords = Math.max(1, shown.split(/\s+/).filter(Boolean).length);
      let cap = limit;
      if (ch === 'items' && nItems) cap = itemFrames(nItems, Math.round(dur * fps), fps)[nItems - 1] / fps + limit;
      else if (ch === 'words') cap = Math.min(dur * 0.7, (nWords - 1) * 0.3) + limit;
      else if (Array.isArray(ch) && ch.length) cap = limit / Math.max(0.05, 1 - Math.max(...ch));
      dur = Math.min(dur, Math.max(meta?.minDur || 1.8, cap));
      how = 'read';
    }
    if (!(dur > 0.2)) { problems.push({id, what: 'time', msg: `${id}: "dur" must be more than 0.2 s`}); dur = 1; }
    beats.push({id, idx: i, kind: kindOf(b.kind), meta, it: {...b, id, meta}, say, t0: start, t1: start + dur, how, tier: starts[i] ? starts[i].tier : how === 'next' ? tierOfWords : 'C'});
    t = start + dur;
  });

  // the voice decides the length when there is one
  let seconds = t;
  if (voiceSeconds > 0) {
    const tail = Number(story?.tail ?? 0.4);
    if (beats.length && seconds < voiceSeconds + tail) { beats[beats.length - 1].t1 = voiceSeconds + tail; seconds = voiceSeconds + tail; }
  }
  const frames = Math.max(1, Math.round(seconds * fps));

  // 2. frames, transitions, things that change inside a scene
  const cutF = beats.map((b) => Math.round(b.t0 * fps));
  cutF.push(frames);
  beats.forEach((b, i) => {
    b.f0 = cutF[i];
    b.f1 = cutF[i + 1];
    b.dur = Math.max(1, b.f1 - b.f0);
  });
  beats.forEach((b, i) => {
    const src0 = b.it.in;
    let tr = null;
    if (i > 0 && src0 && src0 !== 'cut') {
      const line = typeof src0 === 'string' ? {kind: src0} : {...src0};
      const tm = metaFor(line, metas);
      if (!tm || !playable(tm) || !['transition', 'sweep'].includes(tm.role)) {
        problems.push({id: b.id, what: 'kind', msg: `${b.id}: "in": "${line.kind}" is not a transition in the catalog. Run the catalog command and pick one with role transition or sweep, or remove "in" for a hard cut.`});
      } else {
        const want = Math.round((line.dur ?? tm.dur ?? 0.5) * fps);
        const room = Math.floor(Math.min(b.dur, beats[i - 1].dur) * 0.45);
        tr = {kind: tm.kind, meta: tm, role: tm.role, frames: Math.max(4, even(Math.min(want, room))), it: {...line, meta: tm}};
      }
    }
    b.tr = tr;
    // per-item times: {text, at} items follow the voice; plain items are spread by the kit
    const items = itemsOf(b.it);
    if (items) {
      const auto = itemFrames(items.length, b.dur, fps);
      b.it._if = items.map((x, k) => {
        if (x && typeof x === 'object' && x.at != null) {
          const r = when(x.at, b.id, `item ${k + 1} "at"`);
          if (r) return clampN(Math.round(r.t * fps) - b.f0, 0, b.dur - 1);
        }
        return auto[k];
      });
    }
    // named moments inside a scene ("cues": {"swap": {"text": "red", "near": 20.1}})
    b.it._cue = {};
    for (const [name, at] of Object.entries(b.it.cues || {})) {
      const r = when(at, b.id, `cue "${name}"`);
      if (r) b.it._cue[name] = clampN(Math.round(r.t * fps) - b.f0, 0, b.dur - 1);
    }
    b.it._t0 = b.t0;
  });

  // 3. moments when the picture changes its content (for the rhythm check)
  const changes = [];
  for (const b of beats) {
    changes.push(b.f0);
    const m = b.meta || {};
    const cueF = Object.values(b.it._cue || {});
    if (b.it._if && m.changes === 'items') changes.push(...b.it._if.map((f) => b.f0 + f));
    else if (m.changes === 'words') {
      const n = Math.max(1, shownText(b.it).join(' ').split(/\s+/).filter(Boolean).length);
      const span = Math.min(b.dur * 0.7, n * 0.3 * fps);
      for (let k = 1; k < n; k++) changes.push(Math.round(b.f0 + (k / n) * span));
    } else if (Array.isArray(m.changes)) {
      if (cueF.length) changes.push(...cueF.map((f) => b.f0 + f));
      else changes.push(...m.changes.map((x) => Math.round(b.f0 + x * b.dur)));
    }
  }
  changes.sort((a, b) => a - b);

  const tiers = beats.map((b) => b.tier);
  const tier = tiers.includes('A') ? 'A' : tiers.includes('B') ? 'B' : 'C';
  return {fps, W, H, aspect, frames, seconds: frames / fps, beats, bg: story?.bg || null, tier, problems, changes, voice: voiceSeconds > 0, safe: safeBox(W, H)};
}

/** Sequence lengths for <TransitionSeries>: transitions sit centred on the cuts, so cuts stay where the timeline put them. */
export function seriesPlan(tl) {
  const T = tl.beats.map((b) => (b.tr && b.tr.role === 'transition' ? b.tr.frames : 0));
  return tl.beats.map((b, i) => {
    const before = T[i] / 2, after = (T[i + 1] || 0) / 2;
    return {id: b.id, lead: before, frames: b.dur + before + after, T: T[i]};
  });
}

/** the frame of a beat that shows it finished (for stills and sheets) */
export function peakFrame(tl, i) {
  const b = tl.beats[i];
  const next = tl.beats[i + 1];
  const cutNext = next?.tr ? next.tr.frames / 2 + 1 : 1;
  return Math.max(b.f0, Math.min(b.f1 - cutNext - 1, b.f0 + Math.round(b.dur * 0.82)));
}

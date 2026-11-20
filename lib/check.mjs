// check: read the storyboard the way a picky editor would, before any rendering. Two grades:
//   ERROR  = fix before you render (the sentence says how)
//   advice = worth a look
// The rules are editing rules, not taste: the picture changes at least every 3 s, each design is used once,
// only words from the script are on screen, few words per scene, hard cuts by default.
import fs from 'node:fs';
import path from 'node:path';
import {buildTimeline, shownText} from '../src/core/timeline.mjs';
import {metaFor, playable} from '../src/core/catalog.mjs';
import {notSaid, countWords, tokens} from '../src/core/text.mjs';
import {SIZES} from '../src/core/zones.mjs';
import {buildCatalog, prepareProject} from './catalog-build.mjs';
import {readStory, myInfo, findVoice, findWords, audioSeconds, readJson, writeJson} from './project.mjs';

const fmt = (t) => t.toFixed(1);

/** Everything the render needs, read from the project folder. */
export async function loadData(P, {story = null} = {}) {
  const s = story || readStory(P);
  const info = myInfo(P);
  const voice = findVoice(P, s);
  const words = findWords(P, voice);
  let voiceSeconds = 0, voiceFile = null;
  if (voice) {
    voiceSeconds = await audioSeconds(voice);
    voiceFile = 'voice' + path.extname(voice).toLowerCase();
    const to = path.join(P.work, voiceFile);
    if (!fs.existsSync(to) || fs.statSync(to).size !== fs.statSync(voice).size) fs.copyFileSync(voice, to);
  }
  if (words) writeJson(path.join(P.work, 'words.json'), words);
  const voiceMissing = !voice && s.voice ? String(s.voice) : null;
  return {story: s, info, words, voiceSeconds, voiceFile, sfxFile: null, voicePath: voice, voiceMissing};
}

// edit distance, for "did you mean"
const lev = (a, b) => {
  const d = Array.from({length: a.length + 1}, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const closest = (kind, metas, role) => {
  const [src, name = ''] = String(kind).includes('/') ? String(kind).split('/') : ['', String(kind)];
  return Object.values(metas)
    .filter((m) => playable(m) && m.role === role)
    .map((m) => ({k: m.kind, s: lev(name, m.kind.split('/')[1]) + (m.kind.startsWith(src + '/') ? 0 : 2)}))
    .sort((x, y) => x.s - y.s)
    .slice(0, 3)
    .map((x) => x.k);
};

/**
 * @returns {{ok, errors: [{id, what, msg, t}], advice: [...], facts: string[], timelines: {aspect: tl}}}
 */
export async function check(P, {aspects = ['16x9'], data = null, write = true, measured = null} = {}) {
  const {metas, errors: catErrors} = buildCatalog();
  const d = data || (await loadData(P));
  const story = d.story;
  const errors = [], advice = [], facts = [];
  const E = (id, what, msg, t = null) => errors.push({id, what, msg, t});
  const A = (id, what, msg, t = null) => advice.push({id, what, msg, t});
  for (const e of catErrors) A('catalog', 'catalog', `catalog: ${e}`);
  if (d.voiceMissing) A('film', 'voice', `the voice file ${d.voiceMissing} is not here: beats are timed from the subtitles next to it, and a render would be silent. Put the recording back before the final render.`);

  if (!Array.isArray(story.beats) || !story.beats.length) E('storyboard', 'empty', 'storyboard.json has no "beats". Each beat is one line: {"say": "the line", "kind": "kit/ident", "text": "words on screen"}.');
  const prep = prepareProject(P, story, metas);
  for (const e of prep.errors) E('files', 'file', e);
  const ids = new Set();
  const allow = [...(story.allow || []), ...(d.info?.allow || []), d.info?.name, d.info?.role, ...(d.info?.links || [])].filter(Boolean).join(' ');
  const timelines = {};

  aspects.forEach((aspect, ai) => {
    const tl = buildTimeline({story, metas, words: d.words, voiceSeconds: d.voiceSeconds, aspect});
    timelines[aspect] = tl;
    const tag = aspects.length > 1 ? ` [${aspect}]` : '';
    if (ai > 0) return checkShape(tl, tag);
    for (const p of tl.problems) E(p.id, p.what, p.msg);

    const seenFamily = new Map();
    const short = tl.beats.length <= 24 && story.allowRepeat !== true;
    tl.beats.forEach((b) => {
      const {id, meta: m, it} = b;
      if (ids.has(id)) E(id, 'id', `${id}: two beats have this id. Give each beat its own "id".`);
      ids.add(id);
      // 1. the scene exists and can play
      if (!it.kind) return E(id, 'kind', `${id}: no "kind". Pick a scene from the catalog command, for example "kit/ident" or "remotion/title-blur".`, b.t0);
      if (!m) return E(id, 'kind', `${id}: there is no scene called "${it.kind}". Close ones: ${closest(it.kind, metas, 'scene').join(', ')}. The catalog command lists all of them.`, b.t0);
      if (!playable(m)) return E(id, 'kind', `${id}: "${it.kind}" is listed but cannot play here (${m.status}): ${(m.reasons || []).join('; ')}`, b.t0);
      if (m.role !== 'scene') return E(id, 'kind', `${id}: "${it.kind}" is a ${m.role}, not a scene. Use it as ${m.role === 'bg' ? '"bg"' : '"in"'} of a beat, and pick a scene for "kind".`, b.t0);
      for (const need of m.needs || []) if (it[need] == null || it[need] === '' || (Array.isArray(it[need]) && !it[need].length)) E(id, 'field', `${id}: "${it.kind}" needs "${need}" (${m.props?.[need] || 'see the catalog'}).`, b.t0);
      if (it.bg) {
        const bm = metaFor(typeof it.bg === 'string' ? {kind: it.bg} : it.bg, metas);
        if (!bm || !playable(bm) || bm.role !== 'bg') E(id, 'kind', `${id}: "bg": "${typeof it.bg === 'string' ? it.bg : it.bg.kind}" is not a background in the catalog. Close ones: ${closest(typeof it.bg === 'string' ? it.bg : it.bg.kind, metas, 'bg').join(', ')}.`, b.t0);
      }
      // 2. only what the script says
      const shown = shownText(it);
      if (it.free === true) A(id, 'said', `${id}: "free": true, so the words on screen were not compared with the script.`, b.t0);
      else {
        const extra = notSaid(shown.join(' '), `${b.say} ${allow}`);
        if (extra.length && !b.say) E(id, 'said', `${id}: shows "${shown.join(' / ')}" but the beat has no "say". Write the script line in "say" (the words on screen must come from it).`, b.t0);
        else if (extra.length) E(id, 'said', `${id}: the screen shows ${extra.map((w) => `"${w}"`).join(', ')} but the line does not say ${extra.length > 1 ? 'them' : 'it'} ("${b.say}"). Use words from the line, or add a name to "allow" if it is your brand.`, b.t0);
      }
      // 3. few words
      const nw = countWords(shown.join(' '));
      const max = m.maxWords || 10;
      if (nw > max) E(id, 'words', `${id}: ${nw} words on screen, "${it.kind}" reads well up to ${max}. Keep the key word, number or thing; the voice (or the next beat) carries the rest.`, b.t0);
      // 4. each design once
      const fam = m.family || it.kind;
      if (seenFamily.has(fam)) {
        const msg = `${id}: the design "${fam}" was already used in ${seenFamily.get(fam)}. Each design once per film: pick another scene for one of them (catalog --use ${m.use}).`;
        (short ? E : A)(id, 'repeat', msg, b.t0);
      } else seenFamily.set(fam, id);
      // 5. long enough to read, short enough to stay alive
      const need = 0.5 + 0.22 * nw;
      if (b.t1 - b.t0 < need - 1e-6) E(id, 'short', `${id}: on screen for ${fmt(b.t1 - b.t0)} s, but ${nw} words need about ${fmt(need)} s to read. Give it more time or fewer words.`, b.t0);
      if (m.aspects && !m.aspects.includes('16x9')) E(id, 'shape', `${id}: "${it.kind}" is made for ${m.aspects.join(', ')} only.`, b.t0);
    });

    // 6. rhythm: the content of the picture changes at least every N seconds (default 3)
    const limit = Number(story.rhythm ?? 3);
    const ch = [...tl.changes, tl.frames];
    for (let i = 0; i + 1 < ch.length; i++) {
      const gap = (ch[i + 1] - ch[i]) / tl.fps;
      if (gap > limit + 0.05) {
        const b = tl.beats.find((x) => ch[i] >= x.f0 && ch[i] < x.f1) || tl.beats[tl.beats.length - 1];
        E(b.id, 'rhythm', `${b.id}: nothing new on screen for ${fmt(gap)} s (from ${fmt(ch[i] / tl.fps)} s). The limit is ${limit} s. Split the line into two beats, or use a scene that builds in steps (steps, flow, list, compare).`, ch[i] / tl.fps);
      }
    }
    // 7. hard cuts are the default
    const withTr = tl.beats.filter((b) => b.tr);
    const cuts = Math.max(1, tl.beats.length - 1);
    if (withTr.length > Math.max(2, Math.ceil(cuts * 0.4))) A('film', 'transitions', `${withTr.length} of ${cuts} cuts use a transition. Hard cuts are the default; keep transitions for a change of topic.`);
    const trSeen = new Map();
    for (const b of withTr) {
      const f = b.tr.meta.family || b.tr.kind;
      if (trSeen.has(f)) A(b.id, 'repeat', `${b.id}: the transition "${b.tr.kind}" was already used before ${trSeen.get(f)}.`, b.t0);
      else trSeen.set(f, b.id);
    }
    // 8. length
    if (Array.isArray(story.target) && (tl.seconds < story.target[0] || tl.seconds > story.target[1])) A('film', 'length', `the film is ${fmt(tl.seconds)} s; "target" asks for ${story.target[0]}-${story.target[1]} s.`);
    if (tl.bg) {
      const bm = metaFor(typeof tl.bg === 'string' ? {kind: tl.bg} : tl.bg, metas);
      if (!bm || !playable(bm) || bm.role !== 'bg') E('film', 'kind', `"bg": "${typeof tl.bg === 'string' ? tl.bg : tl.bg.kind}" is not a background in the catalog. Close ones: ${closest(typeof tl.bg === 'string' ? tl.bg : tl.bg.kind, metas, 'bg').join(', ')}.`);
    }
    // facts
    const tierN = {A: 0, B: 0, C: 0};
    for (const b of tl.beats) tierN[b.tier]++;
    facts.push(`length: ${fmt(tl.seconds)} s, ${tl.beats.length} beats, ${withTr.length} transition${withTr.length === 1 ? '' : 's'} (the rest are hard cuts)`);
    facts.push(d.voicePath ? `voice: ${path.basename(d.voicePath)} (${fmt(d.voiceSeconds)} s)${d.words ? `, words from ${d.words.source} (tier ${d.words.tier})` : ', no subtitles or word times next to it (beats are timed by "at" seconds or reading time)'}` : 'voice: none (tier C: every beat lasts as long as its line takes to read)');
    facts.push(`timing: ${tierN.A} beat${tierN.A === 1 ? '' : 's'} on a spoken word (A), ${tierN.B} on a subtitle line (B), ${tierN.C} by reading time or seconds (C)`);
    const srcN = {};
    for (const b of tl.beats) if (b.meta) srcN[b.kind.split('/')[0]] = (srcN[b.kind.split('/')[0]] || 0) + 1;
    facts.push(`sources: ${Object.entries(srcN).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  });

  function checkShape(tl, tag) {
    for (const b of tl.beats) {
      const m = b.meta;
      if (m && m.aspects && !m.aspects.includes(tl.aspect)) E(b.id, 'shape', `${b.id}${tag}: "${b.kind}" is made for ${m.aspects.join(', ')} only. Pick another scene, or leave this shape out.`, b.t0);
    }
  }

  // measured from the rendered film (lib/measure.mjs), when there is one
  if (measured) {
    for (const x of measured.errors) E(x.id, x.what, x.msg, x.t);
    for (const x of measured.advice) A(x.id, x.what, x.msg, x.t);
    facts.push(...measured.facts);
  }

  const ok = errors.length === 0;
  const result = {ok, errors, advice, facts, timelines, data: d};
  if (write) writeReport(P, result, aspects);
  return result;
}

export function writeReport(P, r, aspects) {
  const tl = r.timelines[aspects[0]];
  const L = [];
  L.push(`# ${path.basename(P.dir)}: check ${r.ok ? 'PASS' : 'FAIL'}`, '');
  L.push(`${r.errors.length} error${r.errors.length === 1 ? '' : 's'}, ${r.advice.length} advice. Shapes: ${aspects.join(', ')}.`, '');
  if (r.errors.length) {
    L.push('## Fix these', '');
    for (const e of r.errors) L.push(`- **${e.what}** ${e.msg}`);
    L.push('');
  }
  if (r.advice.length) {
    L.push('## Worth a look', '');
    for (const a of r.advice) L.push(`- ${a.what}: ${a.msg}`);
    L.push('');
  }
  L.push('## Facts', '');
  for (const f of r.facts) L.push(`- ${f}`);
  L.push('', '## Beats', '', '| beat | from | to | scene | cut | timing | on screen |', '|---|---|---|---|---|---|---|');
  if (tl) for (const b of tl.beats) L.push(`| ${b.id} | ${b.t0.toFixed(2)} | ${b.t1.toFixed(2)} | ${b.kind} | ${b.tr ? b.tr.kind : 'cut'} | ${b.tier} (${b.how}) | ${shownText(b.it).join(' / ').replace(/\|/g, '/')} |`);
  L.push('');
  fs.writeFileSync(path.join(P.out, 'report.md'), L.join('\n'));
}

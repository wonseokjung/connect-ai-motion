// draft: a script (one line per beat, .md / .txt, or subtitles .srt) -> a first storyboard.json.
// It only chooses a scene per line and copies key words out of the line; it never writes new words.
// An agent (or you) then improves it: better scene per line, the one word that matters, where a transition belongs.
import fs from 'node:fs';
import {parseSrt} from '@remotion/captions';
import {tokens} from '../src/core/text.mjs';
import {playable} from '../src/core/catalog.mjs';

const STOP = new Set('a an the and or but so of to in on at for with from by as is are was were be been it this that these those you your we our i my they their he she his her not no yes do does did have has had will would can could should just very more most than then there here into about over out up down if when what which who how why all any some each one'.split(' '));

/** script text -> [{say, at?}] */
export function scriptLines(text, {srt = false} = {}) {
  if (srt) return parseSrt({input: text}).captions.map((c) => ({say: String(c.text).replace(/\s+/g, ' ').trim(), at: +(c.startMs / 1000).toFixed(2)})).filter((x) => x.say);
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*+]|#{1,6})\s+/, '').trim())
    .filter((l) => l && !/^(```|---|<!--)/.test(l))
    .map((say) => ({say}));
}

const keyWords = (say, n) => {
  const raw = say.split(/\s+/).filter(Boolean);
  const good = raw.filter((w) => !STOP.has(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')));
  const pick = (good.length ? good : raw).slice(0, n);
  return pick.join(' ').replace(/^[^\p{L}\p{N}"']+|[^\p{L}\p{N}"'%]+$/gu, '');
};

/** choose a scene for a line by what the line is: a number, a list, a contrast, a quote, a question ... */
export function draftStory(lines, metas, info = {}) {
  // the kit's own scenes and the Remotion ones first: they take any words; template blocks come after
  const rank = (m) => ['kit', 'remotion', 'lottie', 'hyperframes'].indexOf(m.kind.split('/')[0]);
  const pool = Object.values(metas).filter((m) => playable(m) && m.role === 'scene' && m.draft !== false).sort((a, b) => rank(a) - rank(b) || (a.kind < b.kind ? -1 : 1));
  const used = new Set();
  const take = (uses) => {
    for (const u of uses) {
      const m = pool.find((x) => x.use === u && !used.has(x.family));
      if (m) { used.add(m.family); return m; }
    }
    const any = pool.find((x) => !used.has(x.family) && ['statement', 'keyword', 'title', 'emphasis'].includes(x.use)) || pool.find((x) => !used.has(x.family)) || pool[0];
    if (any) used.add(any.family);
    return any;
  };
  const beats = lines.map((l, i) => {
    const say = l.say;
    const num = say.match(/(?:^|[\s(])([$₩€]?\d[\d,.]*\s?(?:%|[kKmMbB]\b|x\b)?)/);
    const parts = say.split(/\s*(?:,|;| and then | then |→|->)\s*/).map((s) => s.trim()).filter(Boolean);
    const versus = say.match(/^(.*?)\s+(?:vs\.?|versus|instead of|not)\s+(.*)$/i) || say.match(/^(?:from\s+)?(.+?)\s+(?:to|→|->)\s+(.+)$/i);
    const quote = say.match(/["“]([^"”]{6,})["”]/);
    let m, f = {};
    const sentences = say.split(/(?<=[.!?])\s+/).map((s) => s.replace(/[.!?]+$/, '').trim()).filter(Boolean);
    if (i === 0) {
      // "Name. What it is." opens as a brand card: the first sentence, the second one under it
      const two = sentences.length >= 2 && sentences[0].split(/\s+/).length <= 4 && sentences[1].split(/\s+/).length <= 6;
      m = take(two ? ['brand', 'title'] : ['title', 'brand']);
      f = two ? {text: sentences[0], sub: sentences[1]} : {text: keyWords(say, 5)};
    }
    else if (i === lines.length - 1 && lines.length > 2) { m = take(['end']); f = {text: keyWords(say, 4)}; }
    else if (quote) { m = take(['quote', 'statement']); f = {text: quote[1]}; }
    else if (num) { m = take(['number', 'chart']); const v = num[1].trim(); const after = say.slice(say.indexOf(num[1]) + num[1].length); f = {value: v, text: keyWords(after, 3) || keyWords(say.replace(num[1], ' '), 3)}; }
    else if (parts.length >= 3 && parts.every((p) => p.split(/\s+/).length <= 5)) { m = take(['steps', 'list', 'flow', 'timeline']); f = {items: parts.slice(0, 5).map((p) => keyWords(p, 3))}; }
    else if (versus && versus[1].split(/\s+/).length <= 6) { m = take(['compare']); f = {text: keyWords(versus[1], 3), sub: keyWords(versus[2], 3)}; }
    else if (say.split(/\s+/).length <= 4) { m = take(['keyword', 'emphasis', 'title']); f = {text: say.replace(/[.!?]+$/, '')}; }
    else { m = take(['statement', 'emphasis', 'keyword', 'title']); f = {text: keyWords(say, Math.min(6, m?.maxWords || 6))}; }
    // fill what the scene needs from the line, never from outside it
    const out = {id: `b${i + 1}`, say, kind: m?.kind || 'kit/ident', ...f};
    if (l.at != null) out.at = l.at;
    for (const need of m?.needs || []) {
      if (out[need] != null) continue;
      if (need === 'items') out.items = parts.slice(0, 4).map((p) => keyWords(p, 3));
      else if (need === 'sub') out.sub = keyWords(say.split(/\s+/).slice(-3).join(' '), 3);
      else if (need === 'value') out.value = num ? num[1].trim() : '';
      else if (need === 'text') out.text = keyWords(say, 4);
    }
    return out;
  });
  return {version: 1, title: info.title || (lines[0]?.say || '').slice(0, 60), style: info.style || 'connect', bg: 'remotion/bg-noise-contour', sound: false, beats};
}

export const readScript = (file) => scriptLines(fs.readFileSync(file, 'utf8'), {srt: /\.srt$/i.test(file)});

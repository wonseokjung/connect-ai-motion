// draft: a script (one line per beat, .md / .txt, or subtitles .srt) -> a first storyboard.json.
// It only chooses a scene per line and copies key words out of the line; it never writes new words.
// An agent (or you) then improves it: better scene per line, the one word that matters, where a transition belongs,
// and above all a picture where a line names a thing (a draft cannot know your pictures; check points at rows of
// word-only scenes).
import fs from 'node:fs';
import {parseSrt} from '@remotion/captions';
import {tokens} from '../src/core/text.mjs';
import {playable} from '../src/core/catalog.mjs';

const STOP = new Set('a an the and or but so of to in on at for with from by as is are was were be been it this that these those you your we our i my they their he she his her not no yes do does did have has had will would can could should just very more most than then there here into about over out up down if when what which who how why all any some each one'.split(' '));

/** script text -> [{say, at?}] */
export function scriptLines(text, {srt = false} = {}) {
  if (srt) {
    const caps = parseSrt({input: text}).captions.map((c) => ({say: String(c.text).replace(/\s+/g, ' ').trim(), s: c.startMs / 1000, e: c.endMs / 1000})).filter((x) => x.say);
    const out = [];
    for (const c of caps) {
      const prev = out[out.length - 1];
      // a beat under ~1.8 s (or a line cut mid-quote) takes the next cue too, up to ~4.5 s
      const open = prev && ((prev.say.match(/["“”]/g) || []).length % 2 === 1);
      if (prev && (prev.e - prev.s < 1.8 || open) && c.e - prev.s <= 4.5) { prev.say += ' ' + c.say; prev.e = c.e; }
      else out.push({...c});
    }
    const last = out[out.length - 1], before = out[out.length - 2];
    if (last && before && last.e - last.s < 1.2) { before.say += ' ' + last.say; before.e = last.e; out.pop(); }
    // each beat starts on its first spoken word (tier B/A), not on bare seconds
    return out.map((c) => {
      const w = c.say.split(/\s+/).map((x) => x.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')).find(Boolean);
      return {say: c.say, at: w ? {text: w, near: +c.s.toFixed(2)} : +c.s.toFixed(2)};
    });
  }
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*+]|#{1,6}|\d{1,2}[.)])\s+/, '').trim())
    .filter((l) => l && !/^(```|---|<!--)/.test(l))
    .map((say) => ({say}));
}

const HANGUL = /[가-힯]/;
// Korean counters that belong to the number on screen
const KO_COUNTER = /^\s?(?:시간|시|분|초|개월|개|명|원|만 원|만원|만|억|천|년|월|일|주|배|단계|가지|강|번|층|회|살|%)/;

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
  const FILL = new Set(['text', 'sub', 'items', 'hi', 'lines', 'value']);
  const pool = Object.values(metas).filter((m) => playable(m) && m.role === 'scene' && m.draft !== false && (m.needs || []).every((n) => FILL.has(n))).sort((a, b) => rank(a) - rank(b) || (a.kind < b.kind ? -1 : 1));
  const used = new Set();
  const take0 = (uses, ok = null) => {
    for (const u of uses) {
      const m = pool.find((x) => x.use === u && !used.has(x.family) && (!ok || ok(x)));
      if (m) { used.add(m.family); return m; }
    }
    const okk = (x) => !ok || ok(x);
    const any = pool.find((x) => !used.has(x.family) && okk(x) && ['statement', 'keyword', 'title', 'emphasis'].includes(x.use)) || pool.find((x) => !used.has(x.family) && okk(x))
      || pool.find((x) => !used.has(x.family)) || pool[0];
    if (any) used.add(any.family);
    return any;
  };
  const beats = lines.map((l, i) => {
    const say = l.say;
    const ko = HANGUL.test(say);
    // a number, with its Korean counter when there is one ("7시", "3단계", "10만 원")
    // "2D", "3D", "4K" are names, not numbers
    const num = say.match(/(?:^|[\s(])([$₩€]?\d[\d,.]*(?:\s?%|[kKmMbB]\b|x\b)?)(?![\d.,]*[A-Za-z])/) || say.match(/(?:^|[\s(])([$₩€]?\d[\d,.]*)(?=[가-힯])/);
    const counter = ko && num ? (say.slice(say.indexOf(num[1]) + num[1].length).match(KO_COUNTER) || [''])[0] : '';
    // a list: commas or arrows; each part ends at its own sentence end ("반죽, 발효, 굽기. 세 단계를 …" -> 굽기)
    const parts = say.split(/\s*(?:,|;|、| and then | then |→|->)\s*/).map((s) => s.split(/[.!?。](?:\s|$)/)[0].trim()).filter(Boolean);
    const versus = say.match(/^(.*?)\s+(?:vs\.?|versus|instead of|not)\s+(.*)$/i) || say.match(/^(?:from\s+)?(.+?)\s+(?:to|→|->)\s+(.+)$/i)
      || say.match(/^(.+?)(?:이|가)?\s*아니라,?\s*(.+)$/) || say.match(/^(.+?)\s+(?:대신|말고)\s+(.+)$/) || say.match(/^(.+?)에서\s+(.+?)(?:으로|로)\s/);
    const quote = say.match(/["“]([^"”]{6,})["”]/);
    let m, f = {};
    const hasNum = !!num && (say.match(/\d[\d,.]*/g) || []).length < 2;
    const take = (uses, ok = null) => take0(uses, (x) => (hasNum || !(x.needs || []).includes('value')) && (!ok || ok(x)));
    const sentences = say.split(/(?<=[.!?])\s+/).map((s) => s.replace(/[.!?]+$/, '').trim()).filter(Boolean);
    if (i === 0) {
      // "Name. What it is." opens as a brand card: the first sentence, the second one under it
      const two = sentences.length >= 2 && sentences[0].split(/\s+/).length <= 4 && sentences[1].split(/\s+/).length <= 6;
      m = take(two ? ['brand', 'title'] : ['title', 'brand']);
      f = two ? {text: sentences[0], sub: sentences[1]} : {text: keyWords(say, 5)};
    }
    else if (i === lines.length - 1 && lines.length > 2) {
      // the end card carries a name: a short last sentence ("…, 브레드 커피." / "… CONNECT AI LAB.") if there is one
      const last = sentences[sentences.length - 1] || say;
      const cparts = say.replace(/[.!?。]+$/, '').split(/\s*,\s*/).filter(Boolean);
      m = take(['end']);
      f = sentences.length > 1 && last.split(/\s+/).length <= 4 ? {text: last}
        : cparts.length === 2 && cparts[1].split(/\s+/).length <= 4 ? {text: cparts[1], sub: cparts[0]}
        : {text: keyWords(say, 6)};
    }
    else if (quote) { m = take(['quote', 'statement']); f = {text: quote[1]}; }
    else if (num && (say.match(/\d[\d,.]*/g) || []).length < 2) {
      const v = num[1].trim();
      m = take(['number', 'chart'], v.includes('%') ? null : (x) => !/pie|percent/i.test(x.kind + ' ' + (x.title || '')));
      const after = say.slice(say.indexOf(num[1]) + num[1].length + counter.length).replace(/^[가-힯]{0,2}(?=\s)/, '');
      f = {value: v + (counter && counter.length <= 3 ? counter : ''), text: keyWords(after, 3) || keyWords(say.replace(num[1], ' '), 3)};
    }
    else if (parts.length >= 3 && parts.every((p) => p.split(/\s+/).length <= 5)) { m = take(['flow', 'map', 'steps', 'list', 'diagram', 'timeline']); f = {items: parts.slice(0, 5).map((p) => keyWords(p, 3))}; }
    else if (versus && versus[1].split(/\s+/).length <= 6) { m = take(['compare']); f = {text: keyWords(versus[1], 3), sub: keyWords(versus[2], 3)}; }
    else if (say.split(/\s+/).length <= (ko ? 3 : 4)) { m = take(['keyword', 'emphasis', 'title']); f = {text: say.replace(/[.!?]+$/, '')}; }
    else {
      const whole = say.replace(/[.!?。]+$/, '');
      const nW = whole.split(/\s+/).length, fits = whole.length <= (ko ? 28 : 44) && nW <= (ko ? 8 : 6);
      // a short line keeps all its words: pick a scene that takes that many
      m = (fits && take(['statement', 'emphasis', 'keyword', 'title'], (x) => (x.maxWords || 99) >= nW)) || take(['statement', 'emphasis', 'keyword', 'title']);
      const max = Math.min(ko ? 8 : 6, m?.maxWords || 8);
      f = {text: fits && nW <= max ? whole : keyWords(say, Math.min(6, m?.maxWords || 6))};
    }
    // fill what the scene needs from the line, never from outside it
    const out = {id: `b${i + 1}`, say, kind: m?.kind || 'kit/ident', ...f};
    if (l.at != null) out.at = l.at;
    for (const need of m?.needs || []) {
      if (out[need] != null) continue;
      if (need === 'items') out.items = parts.slice(0, 4).map((p) => keyWords(p, 3));
      else if (need === 'sub') out.sub = keyWords(say.split(/\s+/).slice(-3).join(' '), 3);
      else if (need === 'value') out.value = num ? num[1].trim() : '';
      else if (need === 'text') out.text = keyWords(say, 4);
      else if (need === 'lines') {
        const ws = String(out.text || keyWords(say, 6)).split(/\s+/).filter(Boolean), n = Math.min(3, Math.max(2, Math.ceil(ws.length / 3)));
        out.lines = Array.from({length: n}, (_, k) => ws.slice(Math.round((k * ws.length) / n), Math.round(((k + 1) * ws.length) / n)).join(' ')).filter(Boolean);
        if (!(m.needs || []).includes('text')) delete out.text; // the lines are the words on screen
      }
      else if (need === 'hi') {
        // the phrase to mark: a word of the text itself (the one with a number, else the longest)
        const ws = String(out.text || '').split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}%]+$/gu, '')).filter(Boolean);
        out.hi = ws.find((w) => /\d/.test(w)) || ws.sort((a, b) => b.length - a.length)[0] || '';
      }
    }
    return out;
  });
  return {version: 1, title: info.title || (lines[0]?.say || '').slice(0, 60), style: info.style || 'connect', bg: 'remotion/bg-noise-contour', sound: false, beats};
}

export const readScript = (file) => scriptLines(fs.readFileSync(file, 'utf8'), {srt: /\.srt$/i.test(file)});

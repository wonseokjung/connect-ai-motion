// Words on screen must come from the script. Pure JS (Node + browser).
// A "word" is a run of letters or digits; Korean, Japanese and Chinese runs count as words too.
const WORD = /[\p{L}\p{N}]+(?:[.,][\p{N}]+)*/gu;

const NUM = {zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12', twenty: '20', thirty: '30', forty: '40', fifty: '50', hundred: '100', thousand: '1000'};
// "three" in the script covers "3" on screen (and the other way round); k / m / % are kept as separate words
export const norm = (w) => {
  const s = String(w).toLowerCase().normalize('NFKC').replace(/[.,]/g, '').replace(/['’]s$/u, '');
  return NUM[s] || s.replace(/^0+(\d)/, '$1');
};
export const tokens = (s) => (String(s ?? '').match(WORD) || []).map(norm).filter(Boolean);
export const countWords = (s) => tokens(s).length;

// very light stemming so "graphics" in the script covers "graphic" on screen (and the other way round)
const stem = (w) => (/[a-z]/.test(w) && w.length > 3 ? w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '') : w);

const CJK = /[぀-ヿ㐀-鿿가-힯]/;
// the line for matching inside: lower case, punctuation as spaces, but a decimal point between digits stays
const lineOf = (s) => ' ' + String(s ?? '').toLowerCase().normalize('NFKC').replace(/(\d),(?=\d{3})/g, '$1').replace(/(\d)\.(?=\d)/g, '$1\u0000').replace(/[^\p{L}\p{N}%\u0000]+/gu, ' ').replace(/\u0000/g, '.') + ' ';
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokenOf = (w) => String(w).toLowerCase().normalize('NFKC');

/** Words of `shown` that are not in `said` (after lower-casing and light stemming).
 * Korean, Japanese and Chinese words are matched inside the line, so particles and endings do not count
 * ("7시에" covers "7시", "생산이" covers "생산", "AI로" covers "AI"). A number must stand alone: "15명" is not in
 * "115명", "1.5배" is not "15배". A percent sign on screen needs one (or the word) in the line. */
export function notSaid(shown, said) {
  const pool = new Set();
  for (const r of String(said ?? '').match(WORD) || []) {
    if (/\d\.\d/.test(r)) continue; // "2.5" must not stand for "25": decimals are matched in the line below
    const w = norm(r);
    if (w) { pool.add(w); pool.add(stem(w)); }
  }
  const line = lineOf(said);
  const out = [];
  const raw = String(shown ?? '').toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+(?:[.,][\p{N}]+[\p{L}]*)*/gu) || [];
  for (const r of raw) {
    const w = norm(r);
    if (!w) continue;
    if (!/\d[.]\d/.test(r) && (pool.has(w) || pool.has(stem(w)))) continue;
    const t = tokenOf(r).replace(/,(?=\d)/g, '');
    // before: not a letter or digit of the same word (a Korean word may sit inside a longer one); after: particles are fine
    const before = CJK.test(t[0]) && !/^\d/.test(t) ? '(?<![\\d.])' : '(?<![\\p{L}\\p{N}.])';
    const after = /[\p{N}]$/u.test(t) ? '(?![\\d.]\\d|\\d)' : CJK.test(t[t.length - 1]) ? '' : '(?![a-z0-9])';
    if (new RegExp(before + escapeRe(t) + after, 'u').test(line)) continue;
    out.push(/[.,]/.test(r) ? r : w);
  }
  if (/%/.test(String(shown ?? '')) && !/%|퍼센트|프로|percent/i.test(String(said ?? ''))) out.push('%');
  return out;
}

/** Seconds a viewer needs to read a line once (about 175 words a minute plus a beat to land). */
export function readingSeconds(text) {
  const t = String(text ?? '');
  const cjk = (t.match(/[぀-ヿ㐀-鿿가-힯]/g) || []).length;
  const n = countWords(t.replace(/[぀-ヿ㐀-鿿가-힯]+/g, ' ')) + cjk / 2.6;
  return 1.1 + 0.34 * n;
}

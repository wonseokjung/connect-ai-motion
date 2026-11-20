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

/** Words of `shown` that are not in `said` (after lower-casing and light stemming). */
export function notSaid(shown, said) {
  const pool = new Set();
  for (const w of tokens(said)) { pool.add(w); pool.add(stem(w)); }
  const out = [];
  for (const w of tokens(shown)) if (!pool.has(w) && !pool.has(stem(w))) out.push(w);
  return out;
}

/** Seconds a viewer needs to read a line once (about 175 words a minute plus a beat to land). */
export function readingSeconds(text) {
  const t = String(text ?? '');
  const cjk = (t.match(/[぀-ヿ㐀-鿿가-힯]/g) || []).length;
  const n = countWords(t.replace(/[぀-ヿ㐀-鿿가-힯]+/g, ' ')) + cjk / 2.6;
  return 1.1 + 0.34 * n;
}

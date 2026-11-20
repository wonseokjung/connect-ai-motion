// Change one line of code: an editor card, one value swapped at the "swap" cue. Syntax colours by prismjs.
import React, {useMemo} from 'react';
// @ts-ignore prismjs ships no types
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import {Box, MONO, SceneProps, caps, cueAt, hexA, hueOf, k01, measure} from '../../../src/catalog/ui';

type Tok = {t: string; c: string};
const flat = (toks: any[], cls = ''): Tok[] => toks.flatMap((x) => (typeof x === 'string' ? [{t: x, c: cls}] : Array.isArray(x.content) ? flat(x.content, x.type) : [{t: String(x.content), c: x.type}]));

const CodeSwap: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const code = String(it.code || '').replace(/\t/g, '  ');
  const from = String(it.from ?? ''), to = String(it.to ?? '');
  const col = hueOf(it, st.accentHi);
  const swap = cueAt(it, 'swap', Math.round(dur * 0.5));
  const focus = k01(lf, cueAt(it, 'focus', swap - 18), cueAt(it, 'focus', swap - 18) + 10);
  const palette: Record<string, string> = {keyword: '#9B7BD8', string: '#7FB069', number: '#F2B45A', function: '#4C8CC6', comment: st.dim, punctuation: st.dim, operator: st.dim, property: ink, boolean: '#F2B45A', 'class-name': '#4C8CC6'};
  const lines = useMemo(() => {
    const g = (Prism.languages as any)[String(it.lang || 'javascript')] || Prism.languages.javascript;
    const out: Tok[][] = [[]];
    for (const tk of flat(Prism.tokenize(code, g))) {
      const parts = tk.t.split('\n');
      parts.forEach((p, i) => {
        if (i > 0) out.push([]);
        if (p) out[out.length - 1].push({t: p, c: tk.c});
      });
    }
    return out;
  }, [code, it.lang]);
  const hitLine = lines.findIndex((l) => from && l.map((x) => x.t).join('').includes(from));
  const longest = Math.max(...lines.map((l) => l.map((x) => x.t).join('').length), 12) + Math.max(0, to.length - from.length);
  const maxW = r[2] * (tall ? 1 : 0.92), pad = 48 * u, bar = 58 * u;
  const fs = Math.min((maxW - pad * 2) / ((longest + 4) * 0.602), (r[3] * (tall ? 0.6 : 0.82) - bar - pad * 2) / (lines.length * 1.6), (tall ? 46 : 78) * u);
  // the card hugs its code (plus room for the longer new value), so it never sits in a half-empty box
  const cardW = Math.min(maxW, Math.max(r[2] * 0.5, (longest + 4) * 0.602 * fs + pad * 2 + 30 * u));
  const lh = fs * 1.6;
  const cardH = bar + pad * 2 + lines.length * lh;
  const x0 = (r[2] - cardW) / 2, y0 = (r[3] - cardH) / 2;
  const inK = k01(lf, 0, 10);
  const strike = k01(lf, swap - 8, swap), typed = Math.floor(k01(lf, swap, swap + Math.max(6, to.length * 2), (t) => t) * to.length), done = k01(lf, swap, swap + 8);
  const cw = measure('0', fs, 400, 0, MONO);
  const label = String(it.text || '').toUpperCase();
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: x0, top: y0, width: cardW, height: cardH, borderRadius: st.radius * u * 1.4, background: 'linear-gradient(180deg, rgba(58,45,30,0.94) 0%, rgba(30,24,18,0.94) 34%, rgba(18,15,12,0.94) 100%)', border: `${Math.max(1, 1.5 * u)}px solid ${st.cardLine}`, overflow: 'hidden', opacity: inK, transform: `translateY(${(1 - inK) * 26 * u}px)`, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.5)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: bar, borderBottom: `1px solid ${st.cardLine}`, display: 'flex', alignItems: 'center', paddingLeft: 24 * u, gap: 10 * u}}>
          {[0, 1, 2].map((i) => <div key={i} style={{width: 13 * u, height: 13 * u, borderRadius: 13 * u, background: st.faint}} />)}
          {label && <div style={{...caps(st, 20 * u, st.accentHi), marginLeft: 18 * u, opacity: Math.max(focus, done)}}>{label}</div>}
        </div>
        {hitLine >= 0 && <div style={{position: 'absolute', left: 0, right: 0, top: bar + pad + hitLine * lh - lh * 0.08, height: lh, background: hexA(col, 0.06 * focus + 0.08 * done), borderLeft: `${Math.max(2, 4 * u)}px solid ${hexA(col, Math.max(focus * 0.6, done))}`}} />}
        <div style={{position: 'absolute', left: pad, top: bar + pad, fontFamily: MONO, fontSize: fs, lineHeight: `${lh}px`, whiteSpace: 'pre', color: ink}}>
          {lines.map((l, i) => {
            const lk = k01(lf, 1 + i * 2, 9 + i * 2);
            return (
              <div key={i} style={{opacity: lk, height: lh, display: 'flex'}}>
                <span style={{color: st.faint, width: cw * 3, userSelect: 'none'}}>{String(i + 1).padStart(2, ' ')} </span>
                {l.map((tk, j) => {
                  const at = i === hitLine && from ? tk.t.indexOf(from) : -1;
                  if (at < 0) return <span key={j} style={{color: palette[tk.c] || ink}}>{tk.t}</span>;
                  const a = tk.t.slice(0, at), b = tk.t.slice(at + from.length);
                  return (
                    <span key={j} style={{color: palette[tk.c] || ink}}>
                      {a}
                      <span style={{position: 'relative', display: 'inline-block'}}>
                        {done < 1 && <span style={{opacity: 1 - done, position: done > 0 ? 'absolute' : 'relative', left: 0}}>{from}<span style={{position: 'absolute', left: 0, top: '52%', width: `${strike * 100}%`, height: Math.max(2, 3 * u), background: col}} /></span>}
                        {done > 0 && <span style={{color: col}}>{to.slice(0, typed)}<span style={{opacity: typed < to.length ? 1 : 0, borderRight: `${Math.max(2, 3 * u)}px solid ${col}`}} /></span>}
                      </span>
                      {b}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Box>
  );
};
export default CodeSwap;

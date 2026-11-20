// Code on one side, the result on the other: at the "swap" cue one value changes in the code and the picture
// changes with it, at once. The result is a small stage with shapes that keep hopping; the value you swap is its
// ground colour, the shape, or how many there are. Ours. (Syntax colours by prismjs.)
import React, {useMemo} from 'react';
// @ts-ignore prismjs ships no types
import Prism from 'prismjs';
import {HUE, MONO, SceneProps, caps, cueAt, hexA, hueOf, k01} from '../../../src/catalog/ui';

type Tok = {t: string; c: string};
const flat = (toks: any[], cls = ''): Tok[] => toks.flatMap((x) => (typeof x === 'string' ? [{t: x, c: cls}] : Array.isArray(x.content) ? flat(x.content, x.type) : [{t: String(x.content), c: x.type}]));
const colour = (v: string, d: string) => HUE[v] || (/^(#|rgb|hsl)/.test(v) ? v : v === 'black' ? '#070707' : v === 'white' ? '#F6F1E7' : d);

const Shape: React.FC<{kind: string; s: number; fill: string}> = ({kind, s, fill}) => {
  if (kind === 'square') return <rect x={-s / 2} y={-s} width={s} height={s} rx={s * 0.14} fill={fill} />;
  if (kind === 'triangle') return <path d={`M0 ${-s} L${s * 0.58} 0 L${-s * 0.58} 0 Z`} fill={fill} strokeLinejoin="round" stroke={fill} strokeWidth={s * 0.08} />;
  if (kind === 'star') return <path d={Array.from({length: 10}, (_, i) => { const R = i % 2 ? s * 0.26 : s * 0.56, a = (i * Math.PI) / 5 - Math.PI / 2; return `${i ? 'L' : 'M'}${(R * Math.cos(a)).toFixed(1)} ${(-s * 0.52 + R * Math.sin(a)).toFixed(1)}`; }).join(' ') + 'Z'} fill={fill} />;
  return <circle cx={0} cy={-s / 2} r={s / 2} fill={fill} />;
};

const CodeResult: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const code = String(it.code || '').replace(/\t/g, '  ');
  const from = String(it.from ?? ''), to = String(it.to ?? '');
  const prop = String(it.prop || 'color');
  const col = hueOf(it, st.accentHi);
  const swap = cueAt(it, 'swap', Math.round(dur * 0.5));
  const done = lf >= swap + 4;
  const palette: Record<string, string> = {keyword: '#9B7BD8', string: '#7FB069', number: '#F2B45A', function: '#4C8CC6', comment: st.dim, punctuation: st.dim, operator: st.dim, property: ink, boolean: '#F2B45A', 'class-name': '#4C8CC6'};
  const lines = useMemo(() => {
    const out: Tok[][] = [[]];
    for (const tk of flat(Prism.tokenize(code, Prism.languages.javascript))) {
      tk.t.split('\n').forEach((p, i) => {
        if (i > 0) out.push([]);
        if (p) out[out.length - 1].push({t: p, c: tk.c});
      });
    }
    return out;
  }, [code]);
  const hit = lines.findIndex((l) => from && l.map((x) => x.t).join('').includes(from));
  const longest = Math.max(...lines.map((l) => l.map((x) => x.t).join('').length), 10) + Math.max(0, to.length - from.length);
  // two panels: side by side (stacked in 9:16), together they fill the safe box
  const gap = 34 * u;
  const pw = tall ? r[2] : (r[2] - gap) / 2, ph = tall ? (r[3] - gap) / 2 : r[3] * 0.86;
  const top = tall ? 0 : (r[3] - ph) / 2;
  const pad = 40 * u, bar = 54 * u;
  const fs = Math.min((pw - pad * 2) / ((longest + 3) * 0.602), (ph - bar - pad * 2) / (lines.length * 1.62), (tall ? 44 : 50) * u);
  const lh = fs * 1.62;
  const inK = k01(lf, 0, 12), in2 = k01(lf, 5, 18);
  const typed = Math.round(k01(lf, swap, swap + Math.max(4, to.length * 1.5)) * to.length);
  const flash = k01(lf, swap, swap + 4) * (1 - k01(lf, swap + 8, swap + 26));
  // the result stage
  const ground = prop === 'color' ? colour(done ? to : from, '#070707') : colour(String(it.ground || 'black'), '#070707');
  const shape = prop === 'shape' ? (done ? to : from) : String(it.shape || 'circle');
  const count = prop === 'count' ? Math.max(1, Math.min(7, parseInt(done ? to : from, 10) || 1)) : Math.max(1, Math.min(7, Number(it.count ?? 1)));
  const fill = colour(String(it.fill || 'white'), '#F6F1E7');
  const f = Math.max(0, lf);
  const sw = pw, sh = ph;
  const S = Math.min(sw / (count + 1.6), sh * 0.3);
  const floor = sh * 0.72;
  const dash = (f * 9 * u) % (90 * u);
  const wipe = k01(lf, swap + 1, swap + 9);
  const panel: React.CSSProperties = {position: 'absolute', width: pw, height: ph, borderRadius: 20 * u, overflow: 'hidden', border: `${Math.max(1, 1.5 * u)}px solid ${st.cardLine}`, boxShadow: `0 ${26 * u}px ${80 * u}px rgba(0,0,0,0.5)`};
  return (
    <div style={{position: 'absolute', left: r[0], top: r[1], width: r[2], height: r[3]}}>
      <div style={{...panel, left: 0, top, background: '#14110E', opacity: inK, transform: `translateY(${(1 - inK) * 20 * u}px)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, borderBottom: `1px solid ${st.cardLine}`, display: 'flex', alignItems: 'center', paddingLeft: pad * 0.6, gap: 9 * u}}>
          {[0, 1, 2].map((i) => <div key={i} style={{width: 11 * u, height: 11 * u, borderRadius: '50%', background: hexA(st.ink, 0.22)}} />)}
          {it.label && <div style={{...caps(st, 18 * u, st.dim), marginLeft: 14 * u}}>{String(it.label)}</div>}
        </div>
        {lines.map((l, i) => {
          const isHit = i === hit;
          let line = l;
          if (isHit) {
            const joined = l.map((x) => x.t).join('');
            const at = joined.indexOf(from);
            // rebuild the hit line: text before, the value (old, or the new one being typed), text after
            const out: Tok[] = [];
            let pos = 0;
            for (const tk of l) {
              const a = pos, b = pos + tk.t.length;
              pos = b;
              if (b <= at || a >= at + from.length) { out.push(tk); continue; }
              if (a < at) out.push({t: tk.t.slice(0, at - a), c: tk.c});
              if (a <= at) out.push({t: lf < swap ? from : to.slice(0, typed), c: '__v'});
              if (b > at + from.length) out.push({t: tk.t.slice(at + from.length - a), c: tk.c});
            }
            line = out;
          }
          return (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top: bar + pad * 0.8 + i * lh, height: lh, background: isHit ? hexA(col, 0.1 + 0.22 * flash) : undefined, borderLeft: isHit ? `${Math.max(2, 4 * u)}px solid ${col}` : undefined}}>
              <span style={{position: 'absolute', left: pad * 0.5, top: 0, fontFamily: MONO, fontSize: fs * 0.8, lineHeight: `${lh}px`, color: hexA(st.ink, 0.28)}}>{i + 1}</span>
              <span style={{position: 'absolute', left: pad + fs * 1.2, top: 0, fontFamily: MONO, fontSize: fs, lineHeight: `${lh}px`, whiteSpace: 'pre', color: ink}}>
                {line.map((tk, j) => <span key={j} style={{color: tk.c === '__v' ? col : palette[tk.c] || ink, fontWeight: tk.c === '__v' ? 600 : 400}}>{tk.t}</span>)}
                {isHit && lf >= swap && typed < to.length && <span style={{display: 'inline-block', width: fs * 0.1, height: fs, background: col, verticalAlign: 'middle'}} />}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{...panel, left: tall ? 0 : pw + gap, top: tall ? ph + gap : top, background: prop === 'color' ? colour(from, '#070707') : ground, opacity: in2, transform: `translateY(${(1 - in2) * 20 * u}px)`}}>
        {prop === 'color' && <div style={{position: 'absolute', left: 0, top: 0, width: `${wipe * 100}%`, height: '100%', background: colour(to, '#D8433B')}} />}
        <svg width={sw} height={sh} style={{position: 'absolute', left: 0, top: 0}}>
          {Array.from({length: Math.ceil(sw / (90 * u)) + 2}, (_, i) => <line key={i} x1={i * 90 * u - dash} y1={floor + 16 * u} x2={i * 90 * u - dash + 40 * u} y2={floor + 16 * u} stroke="#F6F1E7" strokeOpacity={0.32} strokeWidth={3 * u} strokeLinecap="round" />)}
          {Array.from({length: count}, (_, i) => {
            const p = ((f + i * 5) / 13) % 1;
            const air = Math.sin(Math.PI * p);
            const x = (sw * (i + 1)) / (count + 1);
            const sq = 1 - 0.14 * Math.max(0, 1 - air * 6);
            const pop = prop === 'count' && i >= (parseInt(from, 10) || 1) ? k01(lf, swap + 2 + (i - (parseInt(from, 10) || 1)) * 3, swap + 12 + (i - (parseInt(from, 10) || 1)) * 3) : 1;
            return (
              <g key={i}>
                <ellipse cx={x} cy={floor + 16 * u} rx={S * 0.42 * (1 - air * 0.35) * pop} ry={S * 0.06} fill="rgba(0,0,0,0.4)" />
                <g transform={`translate(${x} ${floor - air * S * 0.9}) scale(${(2 - sq) * pop} ${sq * pop})`}><Shape kind={shape} s={S} fill={fill} /></g>
              </g>
            );
          })}
        </svg>
        <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: '#F6F1E7', opacity: flash * 0.22}} />
        {it.label2 && <div style={{position: 'absolute', left: pad * 0.6, top: bar * 0.32, ...caps(st, 18 * u, hexA('#F6F1E7', 0.6))}}>{String(it.label2)}</div>}
      </div>
    </div>
  );
};
export default CodeResult;

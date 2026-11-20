// Words in time: pages of a few words, the current one lit (@remotion/captions).
import React, {useMemo} from 'react';
import {createTikTokStyleCaptions} from '@remotion/captions';
import type {Caption} from '@remotion/captions';
import {Box, SceneProps, fitLines, hueOf, k01, type} from '../../../src/catalog/ui';

const CaptionsPages: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, fps, words, tall}) => {
  const text = String(it.text || '');
  const col = hueOf(it, st.accentHi);
  const pages = useMemo(() => {
    const ws = text.split(/\s+/).filter(Boolean);
    let caps: Caption[];
    // a voice: use the word times of this beat when they match the line; else spread the words over the beat
    if (words && words.length >= ws.length * 0.6 && it.follow !== false && !it.translated) {
      caps = words.map((w) => ({text: ' ' + w.w, startMs: w.t0 * 1000, endMs: w.t1 * 1000, timestampMs: null, confidence: null}));
    } else {
      const total = Math.max(600, (dur / fps) * 1000 * 0.9 - 150);
      const weight = ws.map((w) => w.length + 2), sum = weight.reduce((a, b) => a + b, 0) || 1;
      let t = 120;
      caps = ws.map((w, i) => {
        const d = (total * weight[i]) / sum;
        const c = {text: ' ' + w, startMs: t, endMs: t + d, timestampMs: null, confidence: null};
        t += d;
        return c;
      });
    }
    return createTikTokStyleCaptions({captions: caps, combineTokensWithinMilliseconds: Number(it.group ?? 900)}).pages;
  }, [text, words, dur, fps, it.group, it.follow, it.translated]);
  const ms = (lf / fps) * 1000;
  let cur = pages[0];
  for (const p of pages) if (ms >= p.startMs) cur = p;
  if (!cur) return null;
  const pageText = cur.text.trim();
  const {fs, lines} = fitLines(pageText, r[2] * 0.96, r[3] * (tall ? 0.44 : 0.6), tall ? 4 : 2, 300, st.tracking);
  const k = k01(ms, cur.startMs, cur.startMs + 200);
  // put the tokens back on the lines the fitter chose
  let ti = 0;
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: 0, right: 0, top: (r[3] - lines.length * fs * 1.14) / 2, opacity: k, transform: `translateY(${(1 - k) * 0.12 * fs}px)`}}>
        {lines.map((l, i) => {
          const n = l.split(/\s+/).filter(Boolean).length;
          const toks = cur.tokens.slice(ti, ti + n);
          ti += n;
          return (
            <div key={i} style={{...type(st, fs, ink, 300), textAlign: 'center', lineHeight: 1.14}}>
              {toks.map((t, j) => {
                const on = ms >= t.fromMs, now = on && ms < t.toMs;
                return <span key={j} style={{color: now ? col : ink, opacity: on ? 1 : 0.28}}>{t.text}</span>;
              })}
            </div>
          );
        })}
      </div>
    </Box>
  );
};
export default CaptionsPages;

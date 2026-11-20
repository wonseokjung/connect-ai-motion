// Marked sentence: one phrase gets a hand-drawn mark (@remotion/rough-notation).
import React from 'react';
import {Circle, Highlight, Underline} from '@remotion/rough-notation';
import {Box, SceneProps, cueAt, fitLines, hexA, hueOf, k01, type} from '../../../src/catalog/ui';

const RoughMark: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const hi = String(it.hi || '');
  const col = hueOf(it, '#E0605A');
  const mark = String(it.mark || 'highlight');
  const at = cueAt(it, 'mark', Math.round(Math.min(dur * 0.4, 30)));
  // keep the marked phrase together on one line: join it with no-break spaces before breaking the lines
  const glued = hi && text.includes(hi) ? text.replace(hi, hi.replace(/ /g, ' ')) : text;
  const {fs, lines} = fitLines(glued, r[2] * 0.92, r[3] * (tall ? 0.5 : 0.6), tall ? 5 : 3, st.weight, st.tracking, 1.25);
  const h = lines.length * fs * 1.25;
  const top = (r[3] - h) / 2;
  const p = k01(lf, at, at + 18);
  const hiG = hi.replace(/ /g, ' ');
  return (
    <Box r={r}>
      {lines.map((l, i) => {
        const k = k01(lf, 2 + i * 5, 16 + i * 5);
        const cut = hiG && l.includes(hiG) ? l.split(hiG) : null;
        const inner = <span style={{position: 'relative', color: mark === 'highlight' ? ink : p > 0.6 ? col : ink}}>{hiG}</span>;
        return (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: top + i * fs * 1.25, textAlign: 'center', ...type(st, fs, ink), opacity: k, transform: `translateY(${(1 - k) * 18 * u}px)`}}>
            {cut ? (
              <>
                {cut[0]}
                <span style={{display: 'inline-block', position: 'relative'}}>
                  {mark === 'circle' ? (
                    <Circle progress={p} color={col} strokeWidth={Math.max(2, 4 * u)} seed={5} padding={{left: fs * 0.14, right: fs * 0.14, top: fs * 0.02, bottom: fs * 0.06}}>{inner}</Circle>
                  ) : mark === 'underline' ? (
                    <Underline progress={p} color={col} strokeWidth={Math.max(2, 5 * u)} seed={5} iterations={2}>{inner}</Underline>
                  ) : (
                    <Highlight progress={p} color={hexA(col, 0.62)} seed={7} iterations={2} padding={{left: fs * 0.1, right: fs * 0.1, top: 0, bottom: 0}}>{inner}</Highlight>
                  )}
                </span>
                {cut.slice(1).join(hiG)}
              </>
            ) : l}
          </div>
        );
      })}
    </Box>
  );
};
export default RoughMark;

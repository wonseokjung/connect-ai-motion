// Letters unfold from the middle: a GSAP timeline, seeked by Remotion's frame (@remotion/gsap).
import React from 'react';
import {useGsapTimeline} from '@remotion/gsap';
import {Box, SceneProps, caps, fitLines, k01, type} from '../../../src/catalog/ui';

const GsapSplit: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const sub = String(it.sub || '').toUpperCase();
  const hi = String(it.hi || '').toLowerCase();
  const {fs, lines} = fitLines(text, r[2] * 0.96, r[3] * (tall ? 0.4 : 0.56), tall ? 3 : 2, st.weight, st.tracking);
  const ref = useGsapTimeline<HTMLDivElement>(({timeline, selector}) => {
    timeline.from(selector('.ch'), {yPercent: 70, rotationX: -90, opacity: 0, transformOrigin: '50% 100% -30px', duration: 0.75, ease: 'back.out(1.5)', stagger: {each: 0.035, from: 'center'}}, 0.05);
    if (selector('.hi').length) timeline.to(selector('.hi'), {color: st.accentHi, duration: 0.35, stagger: 0.02}, 0.75);
  }, {dependencies: [text, hi, lines.length]});
  const h = lines.length * fs * 1.12;
  return (
    <Box r={r} style={{perspective: 1000 * u}}>
      <div ref={ref} style={{position: 'absolute', left: 0, right: 0, top: (r[3] - h) / 2 - (sub ? 18 * u : 0)}}>
        {lines.map((l, i) => (
          <div key={i} style={{...type(st, fs, ink), display: 'flex', justifyContent: 'center'}}>
            {l.split(' ').map((w, j) => (
              <span key={j} style={{display: 'inline-flex', marginRight: '0.26em'}}>
                {[...w].map((c, m) => <span key={m} className={'ch' + (hi && w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === hi ? ' hi' : '')} style={{display: 'inline-block'}}>{c}</span>)}
              </span>
            ))}
          </div>
        ))}
      </div>
      {sub && <div style={{position: 'absolute', left: 0, right: 0, top: (r[3] + h) / 2 + 12 * u, textAlign: 'center', ...caps(st, 28 * u, st.dim), opacity: k01(lf, 26, 38)}}>{sub}</div>}
    </Box>
  );
};
export default GsapSplit;

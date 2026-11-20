// End card: name, action line, links. Ours.
import React from 'react';
import {Box, SceneProps, Words, caps, fit, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';

const Endcard: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const name = String(it.text || '');
  const sub = String(it.sub || '');
  const links = itemsOf(it).slice(0, 3).map(itemText);
  const fs = fit(name, r[2] * 0.92, r[3] * (tall ? 0.14 : 0.24), st.weight, st.tracking);
  const fs2 = fit(sub.toUpperCase(), r[2] * 0.9, 30 * u, st.heavy, 0.24);
  const fs3 = Math.min(28 * u, fit(links.join('      '), r[2] * (tall ? 1.6 : 0.9), 28 * u, 300, 0.02));
  const a = Math.round(dur * 0.3), b = Math.round(dur * 0.55);
  const block = fs * 1.15 + (sub ? fs2 * 2.6 : 0) + (links.length ? fs3 * (tall ? links.length * 1.9 : 3.2) : 0);
  const top = (r[3] - block) / 2;
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: (r[2] - 64 * u) / 2, top: top - 34 * u, width: 64 * u * k01(lf, 0, 16), height: Math.max(1.5, 2 * u), background: st.accent}} />
      <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', ...type(st, fs, ink)}}><Words text={name} lf={lf} start={2} gap={4} /></div>
      {sub && <div style={{position: 'absolute', left: 0, right: 0, top: top + fs * 1.3, textAlign: 'center', ...caps(st, fs2, st.accentHi), opacity: k01(lf, a, a + 12), transform: `translateY(${(1 - k01(lf, a, a + 14)) * 12 * u}px)`}}>{sub}</div>}
      <div style={{position: 'absolute', left: 0, right: 0, top: top + fs * 1.3 + (sub ? fs2 * 2.9 : fs2), display: 'flex', flexDirection: tall ? 'column' : 'row', justifyContent: 'center', alignItems: 'center', gap: tall ? fs3 * 0.7 : fs3 * 2.2}}>
        {links.map((l, i) => (
          <div key={i} style={{...type(st, fs3, st.dim, 300), letterSpacing: '0.02em', opacity: k01(lf, b + i * 5, b + i * 5 + 12)}}>{l}</div>
        ))}
      </div>
    </Box>
  );
};
export default Endcard;

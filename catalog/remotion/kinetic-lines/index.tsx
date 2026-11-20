// Kinetic lines: every line fitted to the full width, sliding in from alternate sides.
import React from 'react';
import {Box, SceneProps, fit, hueOf, itemAt, itemText, itemsOf, k01, measure, type} from '../../../src/catalog/ui';

const KineticLines: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const lines = itemsOf(it).slice(0, tall ? 5 : 4).map((x) => itemText(x).toUpperCase());
  const n = Math.max(1, lines.length);
  const gap = 10 * u;
  // each line as wide as the box; then all of them scaled down together if the stack is too tall
  let sizes = lines.map((l) => fit(l, r[2], r[3] * 0.5, 300, -0.01));
  const total = sizes.reduce((a, b) => a + b * 0.98, 0) + gap * (n - 1);
  const s = Math.min(1, (r[3] * 0.92) / total);
  sizes = sizes.map((x) => x * s);
  const stack = sizes.reduce((a, b) => a + b * 0.98, 0) + gap * (n - 1);
  let y = (r[3] - stack) / 2;
  const hi = Number(it.hi || 0) - 1;
  return (
    <Box r={r}>
      {lines.map((l, i) => {
        const f = itemAt(it, i, n, dur, fps);
        const k = k01(lf, f, f + 16);
        const top = y;
        y += sizes[i] * 0.98 + gap;
        const w = measure(l, sizes[i], 300, -0.01);
        const dir = i % 2 ? 1 : -1;
        return (
          <div key={i} style={{position: 'absolute', left: (r[2] - w) / 2, top, width: w, height: sizes[i] * 0.98, overflow: 'hidden'}}>
            <div style={{...type(st, sizes[i], i === hi ? hueOf(it, st.accentHi) : ink, 300), letterSpacing: '-0.01em', lineHeight: 0.98, transform: `translateX(${(1 - k) * dir * 100}%)`}}>{l}</div>
          </div>
        );
      })}
    </Box>
  );
};
export default KineticLines;

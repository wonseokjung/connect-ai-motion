// Percent ring (@remotion/shapes makePie + makeCircle).
import React from 'react';
import {makeCircle, makePie} from '@remotion/shapes';
import {Box, SceneProps, fit, fitLines, hueOf, k01, numOf, type} from '../../../src/catalog/ui';

const ShapesPie: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const target = Math.max(0, Math.min(100, numOf(it, 50)));
  const col = hueOf(it, st.accent);
  const k = k01(lf, 4, Math.min(40, dur * 0.45));
  const D = tall ? Math.min(r[2] * 0.8, r[3] * 0.44) : Math.min(r[3] * 0.82, r[2] * 0.42);
  const cx = tall ? r[2] / 2 : D / 2 + r[2] * 0.02, cy = tall ? D / 2 + r[3] * 0.04 : r[3] / 2;
  const pie = makePie({radius: D * 0.4, progress: Math.max(0.0001, (target / 100) * k), rotation: -Math.PI / 2});
  const ring = makeCircle({radius: D * 0.49});
  const label = String(it.text || '');
  const tw = tall ? r[2] : r[2] - D - r[2] * 0.1;
  const fs = fit(`${Math.round(target)}%`, tw * 0.9, tall ? r[3] * 0.16 : r[3] * 0.38, st.weight, st.tracking);
  const lab = fitLines(label, tw, fs * 0.9, 2, 300, st.tracking);
  const tx = tall ? 0 : D + r[2] * 0.1, ty = tall ? D + r[3] * 0.1 : r[3] / 2 - fs * 0.85;
  return (
    <Box r={r}>
      <svg width={r[2]} height={r[3]} style={{position: 'absolute', overflow: 'visible'}}>
        <g transform={`translate(${cx - D * 0.49} ${cy - D * 0.49})`} opacity={k01(lf, 0, 10)}>
          <path d={ring.path} fill="none" stroke={st.cardLine} strokeWidth={Math.max(1, 1.5 * u)} />
        </g>
        {Array.from({length: 60}, (_, i) => {
          const a = (i / 60) * Math.PI * 2 - Math.PI / 2, on = i / 60 <= (target / 100) * k, c = D * 0.49;
          return <line key={i} x1={cx + Math.cos(a) * c * 0.94} y1={cy + Math.sin(a) * c * 0.94} x2={cx + Math.cos(a) * c} y2={cy + Math.sin(a) * c} stroke={on ? st.accentHi : st.ink} strokeOpacity={on ? 1 : 0.2} strokeWidth={Math.max(1.5, 2 * u)} />;
        })}
        <path d={pie.path} transform={`translate(${cx - D * 0.4} ${cy - D * 0.4})`} fill={col} fillOpacity={0.9} />
      </svg>
      <div style={{position: 'absolute', left: tx, top: ty, width: tw, textAlign: tall ? 'center' : 'left'}}>
        <div style={{...type(st, fs, ink), fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{Math.round(target * k)}%</div>
        {lab.lines.map((l, i) => <div key={i} style={{...type(st, Math.min(lab.fs, fs * 0.3), st.dim, 300), marginTop: i ? 0 : fs * 0.12, opacity: k01(lf, 16 + i * 4, 28 + i * 4)}}>{l}</div>)}
      </div>
    </Box>
  );
};
export default ShapesPie;

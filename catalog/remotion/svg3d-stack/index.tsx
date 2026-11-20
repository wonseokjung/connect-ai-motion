// Stack of plates in 3D (@remotion/svg-3d-engine: extrude a rounded rectangle, rotate, paint the faces back to front).
import React from 'react';
import {centerPath, parsePath} from '@remotion/paths';
import {makeRect} from '@remotion/shapes';
import {extrudeAndTransformElement, reduceMatrices, rotateX, rotateZ, threeDIntoSvgPath, transformPath, translateY, translateZ} from '@remotion/svg-3d-engine';
import type {FaceType} from '@remotion/svg-3d-engine';
import {Box, SceneProps, fit, hueOf, itemAt, itemText, itemsOf, k01, type} from '../../../src/catalog/ui';

const shade = (c: string, k: number) => {
  const h = c.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
};
const faceY = (f: FaceType) => f.points.reduce((a, p) => a + p.point[1], 0) / f.points.length;

const Svg3dStack: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, fps, tall}) => {
  const items = itemsOf(it).slice(0, 4).map(itemText);
  const n = Math.max(1, items.length);
  const top = hueOf(it, st.accent);
  const S = tall ? Math.min(r[2] * 0.62, r[3] * 0.3) : Math.min(r[3] * 0.62, r[2] * 0.3);
  const depth = S * 0.1, gapY = S * 0.34;
  const d = centerPath(makeRect({width: S, height: S, cornerRadius: S * 0.12}).path);
  const cx = tall ? r[2] * 0.36 : r[2] * 0.26, cy = r[3] * 0.5 + ((n - 1) * gapY) / 2;
  const turn = Math.PI / 4 + Math.sin(lf / 90) * 0.05;
  const plates = items.map((_, i) => {
    const f = itemAt(it, i, n, dur, fps);
    const k = k01(lf, f, f + 22);
    const lift = -i * gapY - (1 - k) * S * 0.9;
    const m = reduceMatrices([rotateZ(turn), rotateX(1.02), translateY(lift)]);
    const colour = i === n - 1 ? top : ['#4a4138', '#3a332c', '#2c2722'][Math.min(2, n - 2 - i)] || '#3a332c';
    const sides = extrudeAndTransformElement({depth, pressInDepth: 0, sideColor: colour, points: parsePath(d), crispEdges: false, transformations: m});
    const faces = sides.map((s) => ({d: threeDIntoSvgPath(s.points), y: faceY(s), fill: shade(colour.startsWith('#') ? colour : '#3a332c', 0.55)}));
    const lid = transformPath({path: d, transformation: reduceMatrices([translateZ(-depth / 2), m])});
    return {i, k, lift, faces, lid, colour};
  });
  const labW = tall ? r[2] * 0.4 : r[2] * 0.44;
  const fs = Math.min(...items.map((t) => fit(t, labW, 54 * u, 300, st.tracking)));
  const lx = cx + S * 0.86;
  return (
    <Box r={r}>
      <svg width={r[2]} height={r[3]} style={{position: 'absolute', overflow: 'visible'}}>
        <g transform={`translate(${cx} ${cy})`}>
          {plates.map((p) => (
            <g key={p.i} opacity={Math.min(1, p.k * 3)}>
              {p.faces.sort((a, b) => a.y - b.y).map((f, j) => <path key={j} d={f.d} fill={f.fill} stroke={f.fill} strokeWidth={0.8} strokeLinejoin="round" />)}
              <path d={p.lid} fill={p.colour} stroke={p.i === n - 1 ? st.accentHi : 'rgba(235,226,210,0.25)'} strokeWidth={Math.max(1, 1.5 * u)} strokeLinejoin="round" />
            </g>
          ))}
        </g>
        {plates.map((p) => {
          const y = cy + p.lift * 0.52;
          const k = k01(lf, itemAt(it, p.i, n, dur, fps) + 10, itemAt(it, p.i, n, dur, fps) + 24);
          return <line key={'l' + p.i} x1={cx + S * 0.6} y1={y} x2={cx + S * 0.6 + (lx - cx - S * 0.64) * k} y2={y} stroke={p.i === n - 1 ? top : st.cardLine} strokeWidth={Math.max(1, 1.5 * u)} />;
        })}
      </svg>
      {plates.map((p) => {
        const y = cy + p.lift * 0.52;
        const k = k01(lf, itemAt(it, p.i, n, dur, fps) + 14, itemAt(it, p.i, n, dur, fps) + 28);
        return <div key={p.i} style={{position: 'absolute', left: lx + 10 * u, top: y - fs * 0.6, ...type(st, fs, p.i === n - 1 ? ink : st.dim, 300), opacity: k, transform: `translateX(${(1 - k) * 16 * u}px)`}}>{items[p.i]}</div>;
      })}
    </Box>
  );
};
export default Svg3dStack;

// Flat to solid: flat shapes gain thickness and turn, so 2D becomes 3D in front of you.
// Faces are extruded and painted back to front with @remotion/svg-3d-engine; outlines come from @remotion/shapes.
import React from 'react';
import {centerPath, parsePath, reduceInstructions, serializeInstructions} from '@remotion/paths';
import {makeCircle, makeRect, makeTriangle} from '@remotion/shapes';
import {extrudeAndTransformElement, reduceMatrices, rotateX, rotateY, threeDIntoSvgPath, transformPath, translateZ} from '@remotion/svg-3d-engine';
import type {FaceType} from '@remotion/svg-3d-engine';
import {Box, HUE, INOUT, SceneProps, cueAt, fit, hexA, k01, type} from '../../../src/catalog/ui';

const rgb = (c: string) => {
  const h = c.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const shade = (c: string, k: number) => {
  const [r, g, b] = rgb(c);
  return `rgb(${Math.round(Math.min(255, r * k))},${Math.round(Math.min(255, g * k))},${Math.round(Math.min(255, b * k))})`;
};
const outline = (shape: string, S: number) => {
  const d =
    shape === 'circle' ? makeCircle({radius: S / 2}).path
    : shape === 'triangle' ? makeTriangle({length: S * 1.08, direction: 'up', cornerRadius: S * 0.05}).path
    : makeRect({width: S, height: S, cornerRadius: S * 0.07}).path;
  return serializeInstructions(reduceInstructions(parsePath(centerPath(d))));
};
const L = [-0.42, -0.72, -0.55];
// brightness of a side face from its direction (the light sits up and to the left, a little in front)
const lit = (f: FaceType) => {
  const p = f.points.map((x) => x.point);
  if (p.length < 3) return 0.6;
  const a = p[0], b = p[1], c = p[p.length - 2];
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  return 0.34 + 0.56 * Math.abs((n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / len);
};
const avgZ = (f: FaceType) => f.points.reduce((s, x) => s + x.point[2], 0) / f.points.length;

const FlatToSolid: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const shapes: string[] = (Array.isArray(it.shapes) && it.shapes.length ? it.shapes : it.shape ? [it.shape] : ['square', 'circle', 'triangle']).slice(0, 3).map(String);
  const n = shapes.length;
  const cols: string[] = (Array.isArray(it.colors) && it.colors.length ? it.colors : it.color ? [it.color] : ['teal', 'coral', 'sky']).map((c: string) => HUE[c] || c);
  const from = String(it.from || ''), to = String(it.to || '');
  const hasLabel = !!(from || to);
  const solid = cueAt(it, 'solid', Math.round(dur * 0.36));
  const W = r[2], H = r[3];
  const S = tall ? Math.min(W * 0.5, ((H * (hasLabel ? 0.76 : 0.94)) / n) * 0.8) : Math.min((W / n) * 0.64, H * (hasLabel ? 0.52 : 0.62));
  const centre = (i: number) => (tall ? [W * (n === 1 ? 0.5 : i % 2 ? 0.67 : 0.33), H * ((hasLabel ? 0.02 : 0.03) + ((hasLabel ? 0.76 : 0.94) * (i + 0.5)) / n)] : [(W * (i + 0.5)) / n, H * (hasLabel ? 0.4 : 0.5)]);
  const fsLabel = Math.min(fit(from || 'X', W * 0.5, 150 * u, st.weight, st.tracking), fit(to || 'X', W * 0.5, 150 * u, st.weight, st.tracking));
  const kLab = k01(lf, solid + 4, solid + 22, INOUT);
  return (
    <Box r={r}>
      <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
        {shapes.map((shape, i) => {
          const col = cols[i % cols.length];
          const s0 = solid + i * 6;
          const kIn = k01(lf, i * 3, i * 3 + 12);
          const kd = k01(lf, s0, s0 + 30, INOUT);
          const after = Math.max(0, lf - s0);
          const depth = Math.max(0.6, S * 0.86 * kd);
          const ry = -0.66 * kd - after / 190 + Math.sin((lf + i * 20) / 46) * 0.05 * (1 - kd);
          const rx = 0.5 * kd + Math.sin(after / 70 + i) * 0.05 * kd;
          const d = outline(shape, S);
          const m = reduceMatrices([rotateY(ry), rotateX(rx)]);
          const sides = extrudeAndTransformElement({depth, pressInDepth: 0, sideColor: col, points: parsePath(d), crispEdges: false, transformations: m})
            .map((f) => ({d: threeDIntoSvgPath(f.points), z: avgZ(f), fill: shade(col, lit(f))}))
            .sort((a, b) => b.z - a.z);
          const front = transformPath({path: d, transformation: reduceMatrices([translateZ(-depth / 2), m])});
          const back = transformPath({path: d, transformation: reduceMatrices([translateZ(depth / 2), m])});
          const [cx, cy] = centre(i);
          const bob = Math.sin((lf + i * 17) / 26) * 8 * u * (1 - kd);
          return (
            <g key={i} transform={`translate(${cx} ${cy + bob}) scale(${0.82 + 0.18 * kIn})`} opacity={kIn}>
              <ellipse cx={S * 0.06 * kd} cy={S * (0.78 + 0.14 * kd)} rx={S * (0.5 + 0.2 * kd)} ry={S * 0.07} fill="#000" opacity={0.42 * kd} />
              {kd > 0.01 && <path d={back} fill={shade(col, 0.3)} />}
              {kd > 0.01 && sides.map((f, j) => <path key={j} d={f.d} fill={f.fill} stroke={f.fill} strokeWidth={0.7} strokeLinejoin="round" />)}
              <path d={front} fill={kd > 0.01 ? col : hexA(col, 0.14 + 0.86 * kd)} stroke={kd > 0.5 ? shade(col, 1.25) : col} strokeWidth={Math.max(1.5, 2.5 * u)} strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      {hasLabel && (
        <div style={{position: 'absolute', left: 0, right: 0, top: tall ? H * 0.82 : H * 0.76, height: fsLabel * 1.2, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', ...type(st, fsLabel, st.dim), opacity: k01(lf, 4, 16) * (1 - kLab), transform: `translateY(${-kLab * fsLabel * 0.9}px)`}}>{from}</div>
          <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', ...type(st, fsLabel, ink), opacity: kLab, transform: `translateY(${(1 - kLab) * fsLabel * 0.9}px)`}}>{to}</div>
        </div>
      )}
    </Box>
  );
};
export default FlatToSolid;

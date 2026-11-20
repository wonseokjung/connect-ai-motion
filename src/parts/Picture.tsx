// Small helpers shared by the picture scenes (charts, line drawings, diagrams): a ground to stand on,
// one colour per item, a smooth line through points.
import React from 'react';
import {HUE, STAGE, hexA, itemAt} from '../catalog/ui';

/** subject colours in the order items take them when they do not name one */
export const PALETTE = ['teal', 'coral', 'blue', 'violet', 'leaf', 'sky', 'rose', 'sand'];
/** colour of item i: its own "color" (a name from HUE or any CSS colour), else the palette in turn */
export const colorAt = (x: any, i: number, d?: string) => {
  const c = x && typeof x === 'object' ? x.color : null;
  return (c && HUE[c]) || c || d || HUE[PALETTE[i % PALETTE.length]];
};
export const num = (s: any, d = 0) => {
  const v = typeof s === 'number' ? s : parseFloat(String(s ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(v) ? v : d;
};
export const decimals = (s: any) => (String(s ?? '').split('.')[1] || '').replace(/\D/g, '').length;

/**
 * The ground of a picture scene: one dark colour and a soft pool of light in the scene's subject colour.
 * "stage": a name from STAGE or any colour; "stage": "none" leaves the film's own background in view.
 */
export const Stage: React.FC<{it: any; W: number; H: number; d?: string; glow?: string; lf?: number; x?: number; y?: number; strength?: number}> = ({it, W, H, d = 'night', glow, lf = 0, x = 50, y = 54, strength = 0.2}) => {
  if (it.stage === 'none') return null;
  const base = it.stage ? STAGE[it.stage] || String(it.stage) : STAGE[d] || d;
  const gx = x + Math.sin(lf / 110) * 4, gy = y + Math.cos(lf / 140) * 3;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: glow ? `radial-gradient(ellipse 72% 64% at ${gx}% ${gy}%, ${hexA(glow, strength)} 0%, ${hexA(glow, strength * 0.35)} 46%, transparent 80%), ${base}` : base}} />
  );
};

/** a smooth line through points (Catmull-Rom as cubic Béziers): the whole path and one path per segment */
export function curve(pts: number[][], k = 0.18) {
  const parts: string[] = [];
  let d = pts.length ? `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}` : '';
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    const seg = `C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    parts.push(`M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ${seg}`);
    d += ' ' + seg;
  }
  return {d, parts};
}

/** SVG arc from angle a0 to a1 (degrees, 0 = up, clockwise) */
export function arc(cx: number, cy: number, R: number, a0: number, a1: number) {
  const p = (a: number) => [cx + R * Math.sin((a * Math.PI) / 180), cy - R * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 >= a0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** an id that is safe in url(#...) and different for every copy of a scene on the page (the sheet shows many) */
export const useSvgId = (p: string) => p + React.useId().replace(/[^a-zA-Z0-9]/g, '');

/**
 * When item i appears. Like itemAt, but the first item is there from the cut (a picture scene never opens on an
 * empty frame) unless the storyboard gives it its own time ({text, at}).
 */
export const startAt = (it: any, items: any[], i: number, n: number, dur: number, fps: number) =>
  i === 0 && !(items[0] && typeof items[0] === 'object' && items[0].at != null) ? 0 : itemAt(it, i, n, dur, fps);

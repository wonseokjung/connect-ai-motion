// The part of the frame a scene may use for words ("safe box"), for each shape.
// 9:16 numbers adapted from aaksa/facecammaxxing (MIT), commit a9976a70b02c, remotion/src/lib/layout.ts:
// Reels / Shorts / TikTok cover the top 250 px, the right rail from x 940 and the area under y 1536 (of 1080 x 1920).
// Copyright (c) facecammaxxing authors. Full licence: licenses/facecammaxxing-MIT.txt
export const SIZES = {'16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080]};

export function safeBox(W, H) {
  if (H > W * 1.2) {
    const sx = W / 1080, sy = H / 1920;
    const x = 72 * sx, y = 270 * sy;
    return [x, y, 940 * sx - x - 12 * sx, 1536 * sy - y - 20 * sy];
  }
  const mx = W * 0.075, my = H * 0.11;
  return [mx, my, W - 2 * mx, H - 2 * my];
}
export const isTall = (W, H) => H > W * 1.2;

// measure: look at the rendered film itself (small grey frames, 5 a second) and report what a storyboard cannot know:
//   blank frames, a picture that stands still, a scene that leaves most of the frame empty.
import {ffmpeg} from './ffmpeg.mjs';

const W = 160, H = 90, RATE = 5;

export async function grabFrames(file, {tall = false} = {}) {
  const w = tall ? 90 : W, h = tall ? 160 : H;
  const raw = await ffmpeg(['-i', file, '-an', '-vf', `scale=${w}:${h}:flags=area`, '-r', String(RATE), '-c:v', 'rawvideo', '-pix_fmt', 'gray', '-f', 'image2pipe', '-'], {binary: true});
  const n = Math.floor(raw.length / (w * h));
  return {w, h, n, at: (i) => raw.subarray(i * w * h, (i + 1) * w * h)};
}

export function analyseFrames(fr, tl) {
  const errors = [], advice = [], facts = [];
  const beatAt = (t) => tl.beats.find((b) => t >= b.t0 - 1e-6 && t < b.t1) || tl.beats[tl.beats.length - 1];
  const px = fr.w * fr.h;
  const stats = [];
  for (let i = 0; i < fr.n; i++) {
    const f = fr.at(i);
    // background level = the most common brightness; "ink" = pixels clearly away from it
    const hist = new Uint32Array(256);
    for (let k = 0; k < px; k++) hist[f[k]]++;
    let mode = 0;
    for (let v = 1; v < 256; v++) if (hist[v] > hist[mode]) mode = v;
    let ink = 0, sum = 0, sq = 0;
    for (let k = 0; k < px; k++) { const d = Math.abs(f[k] - mode); if (d > 22) ink++; sum += f[k]; sq += f[k] * f[k]; }
    const mean = sum / px, sd = Math.sqrt(Math.max(0, sq / px - mean * mean));
    let moved = 0;
    if (i > 0) { const p = fr.at(i - 1); for (let k = 0; k < px; k++) if (Math.abs(f[k] - p[k]) > 10) moved++; }
    stats.push({t: i / RATE, ink: ink / px, sd, moved: moved / px});
  }
  // 1. blank frames (ignore the fade at the very end)
  let run = 0;
  for (let i = 0; i < stats.length; i++) {
    const blank = stats[i].sd < 2.2 && stats[i].ink < 0.004 && stats[i].t < tl.seconds - 0.6;
    run = blank ? run + 1 : 0;
    if (run === Math.round(RATE * 0.6)) { const b = beatAt(stats[i].t); errors.push({id: b.id, what: 'blank', t: stats[i].t, msg: `${b.id}: the picture is empty for more than 0.6 s around ${stats[i].t.toFixed(1)} s. The scene did not draw (wrong field name?) or its words arrive too late.`}); }
  }
  // 2. a still picture (a slide): under 0.15 % of the pixels move for 1.6 s inside one beat
  for (const b of tl.beats) {
    let run = 0, worst = 0, until = 0;
    for (let i = 1; i < stats.length; i++) {
      const t = stats[i].t;
      if (t < b.t0 + 0.3 || t >= b.t1 || t > tl.seconds - 0.4) continue;
      run = stats[i].moved < 0.0015 ? run + 1 : 0;
      if (run > worst) { worst = run; until = t; }
    }
    if (worst >= Math.round(RATE * 1.6)) advice.push({id: b.id, what: 'still', t: until, msg: `${b.id}: the picture stands completely still for ${(worst / RATE).toFixed(1)} s (until ${until.toFixed(1)} s). Motion, not slides: shorten the beat or pick a scene that keeps moving.`});
  }
  // 3. how much of the frame each scene uses at its fullest
  for (const b of tl.beats) {
    const mine = stats.filter((s) => s.t >= b.t0 && s.t < b.t1);
    if (!mine.length) continue;
    const peak = Math.max(...mine.map((s) => s.ink));
    b.fill = peak;
    // thin type covers few pixels, so the bar is low; a scene that is quiet on purpose says so in its meta
    if (peak < 0.02 && !b.meta?.quiet) advice.push({id: b.id, what: 'fill', t: b.t0, msg: `${b.id}: at its fullest the scene covers ${(peak * 100).toFixed(1)} % of the frame. Fill the frame: a bigger word, or a scene with a picture.`});
  }
  const moving = stats.filter((s) => s.moved >= 0.0015).length / Math.max(1, stats.length - 1);
  facts.push(`measured from the render: something moves in ${(moving * 100).toFixed(0)} % of the film, fullest scene covers ${(Math.max(...stats.map((s) => s.ink)) * 100).toFixed(0)} % of the frame`);
  return {errors, advice, facts, stats};
}

export async function measureFilm(file, tl) {
  const fr = await grabFrames(file, {tall: tl.H > tl.W});
  return analyseFrames(fr, tl);
}

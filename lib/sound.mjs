// Sound made by code: one soft tonal hit on every cut, a longer one on the last beat, a small tick when a list
// item lands. Sine partials with a fast attack and an exponential tail; no noise, no samples, nothing to download.
// Notes walk through a pentatonic set so a film sounds like one phrase. Our own code and sound (CC0).
import fs from 'node:fs';

const SR = 48000;
const NOTES = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // A minor pentatonic around A3-C5
const ORDER = [0, 2, 4, 3, 5, 2, 4, 1, 3, 6, 4, 2];

function hit(buf, at, {freq, gain = 0.2, decay = 0.35, partials = [1, 2.01, 3.0], shape = [1, 0.32, 0.1], attack = 0.004}) {
  const i0 = Math.round(at * SR), n = Math.round((decay * 6 + attack) * SR);
  for (let i = 0; i < n && i0 + i < buf.length; i++) {
    const t = i / SR;
    const env = (t < attack ? t / attack : 1) * Math.exp(-(t - attack > 0 ? t - attack : 0) / decay);
    let s = 0;
    for (let p = 0; p < partials.length; p++) s += shape[p] * Math.sin(2 * Math.PI * freq * partials[p] * t) * Math.exp(-t * p * 3);
    buf[i0 + i] += s * env * gain;
  }
}

/**
 * @param tl a timeline (src/core/timeline.mjs)
 * @param kind "tones" (default) | "ticks" (quieter, cuts only)
 * @returns Float32Array mono
 */
export function synth(tl, kind = 'tones', {level = 1} = {}) {
  const buf = new Float32Array(Math.ceil((tl.seconds + 1.5) * SR));
  const quiet = kind === 'ticks';
  tl.beats.forEach((b, i) => {
    const last = i === tl.beats.length - 1;
    const f = NOTES[ORDER[i % ORDER.length]];
    const t = b.f0 / tl.fps;
    if (last && tl.beats.length > 1) {
      hit(buf, t, {freq: NOTES[0] / 2, gain: 0.26 * level, decay: 0.9});
      hit(buf, t, {freq: NOTES[0] * 1.5, gain: 0.1 * level, decay: 0.7});
    } else hit(buf, t, {freq: quiet ? f * 2 : f, gain: (quiet ? 0.07 : 0.17) * level, decay: quiet ? 0.07 : 0.28});
    if (!quiet && b.it._if && b.meta?.changes === 'items') b.it._if.forEach((x, k) => k > 0 && hit(buf, (b.f0 + x) / tl.fps, {freq: f * 2 * (1 + k * 0.125), gain: 0.05 * level, decay: 0.06, partials: [1], shape: [1]}));
  });
  // soft limiter so two hits close together never clip
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * 1.2) / 1.2;
  return buf;
}

export function writeWav(file, mono) {
  const n = mono.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(mono[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}

export const rmsDb = (mono) => {
  let s = 0;
  for (let i = 0; i < mono.length; i++) s += mono[i] * mono[i];
  return 10 * Math.log10(s / Math.max(1, mono.length) + 1e-12);
};
export const peakDb = (mono) => {
  let p = 0;
  for (let i = 0; i < mono.length; i++) p = Math.max(p, Math.abs(mono[i]));
  return 20 * Math.log10(p + 1e-9);
};

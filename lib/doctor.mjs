// doctor: is this computer ready? Node, Remotion (with its own ffmpeg), the browser Remotion uses, optional parts.
import fs from 'node:fs';
import path from 'node:path';
import {ffmpeg} from './ffmpeg.mjs';
import {pkgDir} from './project.mjs';

export async function doctor(log = console.log) {
  let ok = true;
  const line = (good, what, how = '') => {
    log(`  ${good ? 'ok  ' : 'MISS'} ${what}${!good && how ? '  -> ' + how : ''}`);
    if (!good && how) ok = false;
  };
  const ver = (n) => {
    try { return JSON.parse(fs.readFileSync(path.join(pkgDir(n), 'package.json'), 'utf8')).version; } catch { return null; }
  };
  const major = +process.versions.node.split('.')[0];
  line(major >= 18, `Node ${process.versions.node}`, 'install Node 18 or newer from nodejs.org');
  const rv = ver('remotion');
  line(!!rv, `Remotion ${rv || ''}`, 'run npm install in the kit folder (or run it with npx connect-ai-motion)');
  try { await ffmpeg(['-version']); line(true, 'ffmpeg (inside Remotion)'); } catch { line(false, 'ffmpeg (inside Remotion)', 'run npm install again'); }
  for (const [n, what] of [['gsap', 'GSAP (HyperFrames blocks, split text)'], ['lottie-web', 'Lottie files'], ['three', 'three.js scenes'], ['shaders', 'shader backgrounds (need WebGPU on this computer)'], ['prismjs', 'code scenes'], ['katex', 'formula scenes']]) {
    const v = ver(n);
    log(`  ${v ? 'ok  ' : '--  '} ${what}: ${n}${v ? ' ' + v : ' not installed (those catalog items will not play)'}`);
  }
  log('  ok   timing tier C: no voice needed, each beat lasts as long as its line takes to read');
  log('  ok   timing tier B: put voice.wav + voice.srt (or .vtt) in input/');
  log('  ok   timing tier A: put voice.wav + voice.words.json (word times) in input/');
  log('  --   speech to word times on this computer: not shipped (see the roadmap in docs/guide.md); any tool that writes [{word, start, end}] works');
  log(ok ? 'Ready.' : 'Fix the MISS lines, then run doctor again.');
  return ok;
}

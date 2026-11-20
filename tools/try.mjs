// dev tool: look at catalog scenes without a full render. Stills of each scene's own example, at chosen moments.
//   node tools/try.mjs kit/photo-kenburns,remotion/three-model [16x9|9x16|both] [0.3,0.85] [outDir] [scale]
// The numbers are moments of the beat (0 = cut, 1 = end). Stills are half size (scale 0.5) unless you say so.
// Prints the browser's errors.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {renderStill, selectComposition} from '@remotion/renderer';
import {projectPaths, writeJson} from '../lib/project.mjs';
import {buildCatalog} from '../lib/catalog-build.mjs';
import {check, loadData} from '../lib/check.mjs';
import {galleryStory} from '../lib/gallery.mjs';
import {getBundle, chromiumOptions} from '../lib/render.mjs';

const kinds = String(process.argv[2] || '').split(',').filter(Boolean);
const shapes = process.argv[3] === 'both' ? ['16x9', '9x16'] : [process.argv[3] || '16x9'];
const moments = String(process.argv[4] || '0.35,0.85').split(',').map(Number);
const out = path.resolve(process.argv[5] || path.join(os.tmpdir(), 'fm-try'));
const scale = Number(process.argv[6] || 0.5);
const {metas, errors} = buildCatalog();
for (const e of errors) console.log('CATALOG', e);
const story = galleryStory(metas, {sources: kinds});
if (!story.beats.length) { console.log('no playable scene among', kinds.join(', ')); process.exit(1); }
const P = projectPaths(path.join(out, 'project'));
writeJson(path.join(P.dir, 'storyboard.json'), story);
writeJson(path.join(P.dir, 'my-info.json'), {name: 'CONNECT AI LAB', style: 'connect'});
const data = await loadData(P, {story});
const r = await check(P, {aspects: shapes, data, write: false});
for (const e of r.errors) console.log('CHECK', e.msg);
const serveUrl = await getBundle(P, story);
const seen = new Set();
const onBrowserLog = (l) => { const t = `${l.type} ${l.text.slice(0, 300)}`; if (l.type !== 'log' && !seen.has(t)) { seen.add(t); console.log('BROWSER', t); } };
for (const aspect of shapes) {
  const inputProps = {data: {...data, voiceFile: null, sfxFile: null}, aspect};
  const comp = await selectComposition({serveUrl, id: aspect === '9x16' ? 'FilmShort' : 'Film', inputProps, chromiumOptions, onBrowserLog});
  for (const b of comp.props.tl.beats) {
    for (const m of moments) {
      const frame = Math.min(comp.durationInFrames - 1, b.f0 + Math.round(m * (b.dur - 1)));
      const file = path.join(out, `${b.id}_${aspect}_${String(Math.round(m * 100)).padStart(3, '0')}.jpg`);
      try {
        await renderStill({composition: comp, serveUrl, output: file, inputProps, frame, imageFormat: 'jpeg', jpegQuality: 84, chromiumOptions, onBrowserLog, scale, logLevel: 'error'});
        console.log(file);
      } catch (e) {
        console.log(`FAILED ${b.id} ${aspect} @${m}: ${String(e.message).slice(0, 600)}`);
      }
    }
  }
}

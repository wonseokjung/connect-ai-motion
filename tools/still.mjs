// dev tool: stills of chosen frames, with the browser console. node tools/still.mjs <project> 40,90 [16x9|9x16]
import path from 'node:path';
import {renderStill, selectComposition} from '@remotion/renderer';
import {projectPaths} from '../lib/project.mjs';
import {loadData} from '../lib/check.mjs';
import {getBundle, chromiumOptions} from '../lib/render.mjs';
const P = projectPaths(path.resolve(process.argv[2]));
const data = await loadData(P);
const serveUrl = await getBundle(P, data.story);
const inputProps = {data, aspect: process.argv[4] || '16x9'};
const comp = await selectComposition({serveUrl, id: inputProps.aspect === '9x16' ? 'FilmShort' : 'Film', inputProps, chromiumOptions, onBrowserLog: (l) => console.log('BROWSER', l.type, l.text.slice(0, 300))});
console.log('beats', comp.props.tl.beats.length, 'frames', comp.durationInFrames);
for (const f of String(process.argv[3] || '40').split(',')) {
  const out = path.join(P.out, `dbg_${inputProps.aspect}_${f}.jpg`);
  await renderStill({composition: comp, serveUrl, output: out, inputProps, frame: +f, imageFormat: 'jpeg', jpegQuality: 85, chromiumOptions, onBrowserLog: (l) => console.log('BROWSER', l.type, l.text.slice(0, 400)), scale: 0.5});
  console.log(out);
}

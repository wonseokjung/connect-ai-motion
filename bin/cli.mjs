#!/usr/bin/env node
// connect-ai-motion: a script becomes a motion graphics video. No footage needed.
// One line of the script = one beat = one full-frame scene from the catalog.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {KIT_NAME} from '../src/core/name.mjs';
import {KIT, projectPaths, readJson, writeJson, readStory} from '../lib/project.mjs';
import {buildCatalog, prepareProject, writeUser} from '../lib/catalog-build.mjs';
import {check, loadData, writeReport} from '../lib/check.mjs';
import {render} from '../lib/render.mjs';
import {measureFilm} from '../lib/measure.mjs';
import {draftStory, readScript} from '../lib/draft.mjs';
import {galleryStory, splitClips} from '../lib/gallery.mjs';
import {doctor} from '../lib/doctor.mjs';
import {cliPath} from '../lib/ffmpeg.mjs';
import {installSkill, removeSkill} from '../lib/install.mjs';
import {importHyperFrames} from '../lib/hf-import.mjs';
import {banner, gold, dimmed} from '../lib/banner.mjs';

const argv = process.argv.slice(2);
const VALUE_FLAGS = ['only', 'agent', 'dir', 'style', 'source', 'secs', 'prefix', 'license', 'use', 'role', 'seconds', 'name', 'scale', 'lead'];
const flag = (n) => argv.includes('--' + n);
const opt = (n, d = null) => {
  const i = argv.indexOf('--' + n);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && VALUE_FLAGS.includes(argv[i - 1].slice(2))));
const cmd = (flag('help') || argv.includes('-h')) ? 'help' : flag('version') ? 'version' : (pos[0] || 'help');
const COMMANDS = ['demo', 'new', 'draft', 'run', 'check', 'render', 'sheet', 'catalog', 'gallery', 'hf-import', 'preview', 'doctor', 'install-skill', 'remove-skill', 'help', 'version'];
// files a storyboard names stay in its project folder unless you say otherwise for this run
if (flag('outside-files')) process.env.CONNECT_AI_MOTION_OUTSIDE_FILES = '1';
// a path for a command you copy: quoted when it has a space
const shq = (p) => (/[\s"'$`\\]/.test(p) ? JSON.stringify(p) : p);
const log = (...a) => console.log(...a);
const lev = (a, b) => {
  const d = Array.from({length: a.length + 1}, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const secs = (t) => ((Date.now() - t) / 1000).toFixed(1) + ' s';
const projectDir = (d) => path.resolve(d || '.');
const shapes = () => ['16x9', ...(flag('short') ? ['9x16'] : []), ...(flag('square') ? ['1x1'] : [])];
const SCRIPT = /\.(md|txt|srt)$/i;

function printCheck(r, t) {
  log(`  check: ${r.ok ? 'PASS' : 'FAIL'}  ${r.errors.length} error, ${r.advice.length} advice${t ? `  (${secs(t)})` : ''}`);
  for (const e of r.errors) log(`    ERROR  ${e.msg}`);
  for (const a of r.advice) log(`    advice ${a.msg}`);
}

async function full(P, {force = false, only = null} = {}) {
  const t = Date.now();
  log(`${KIT_NAME} · ${P.dir}`);
  log('1/3 check (storyboard)');
  const aspects = shapes();
  const data = await loadData(P);
  const r = await check(P, {aspects, data});
  printCheck(r);
  for (const f of r.facts) log(`    ${f}`);
  const bad = r.errors.map((e) => e.id);
  if (!r.ok && !force) {
    log('2/3 render: skipped until check passes. Fix the ERROR lines in storyboard.json (or add --force to see it anyway).');
    try {
      await render(P, data, {aspects: ['16x9'], media: false, bad, log});
      log(`    sheet: ${path.join(P.out, 'sheet.jpg')} shows every beat; red = the ones with an error`);
    } catch (e) {
      log(`    (no sheet either: ${String(e.message).split('\n')[0]})`);
    }
    return r;
  }
  log('2/3 render');
  await render(P, data, {aspects, only, bad, seconds: Number(opt('seconds', '0')), scale: Number(opt('scale', '1')), log});
  if (!only) {
    log('3/3 check (the rendered video)');
    const m = await measureFilm(path.join(P.out, 'film.mp4'), r.timelines['16x9']);
    const r2 = await check(P, {aspects, data, measured: m});
    for (const e of m.errors) log(`    ERROR  ${e.msg}`);
    for (const a of m.advice) log(`    advice ${a.msg}`);
    for (const f of m.facts) log(`    ${f}`);
    const left = m.errors.length + r2.errors.length;
    if (r2.ok && !m.errors.length) log(`done in ${secs(t)}. Video: ${path.join(P.out, 'film.mp4')}  · sheet: out/sheet.jpg · report: out/report.md`);
    else log(`rendered in ${secs(t)}, but the check of the rendered video found ${left} error${left === 1 ? '' : 's'} (above, and in out/report.md). Fix them and run again. Video so far: ${path.join(P.out, 'film.mp4')}`);
    return {...r2, ok: r2.ok && !m.errors.length};
  }
  return r;
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, {recursive: true});
  for (const e of fs.readdirSync(src, {withFileTypes: true})) {
    if (e.name === '.DS_Store' || e.name === 'out' || e.name === 'work') continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (!fs.existsSync(d)) fs.copyFileSync(s, d);
  }
}

function draftInto(P, scriptFile, {force = false} = {}) {
  const {metas} = buildCatalog();
  const info = readJson(path.join(P.dir, 'my-info.json')) || {};
  const story = draftStory(readScript(scriptFile), metas, info);
  const target = path.join(P.dir, 'storyboard.json');
  // The untouched storyboard from `new` (its "Your name" placeholder beats) is not the user's work: replace it.
  const cur = fs.existsSync(target) ? readJson(target) : null;
  const blank = !!cur && Array.isArray(cur.beats) && cur.beats.some((b) => b.say === 'Your name. What you do in one line.')
    && cur.beats.every((b) => /^(Your name|The one thing|First step)/.test(b.say || ''));
  if (fs.existsSync(target) && !force && !blank) {
    writeJson(path.join(P.dir, 'storyboard.draft.json'), story);
    log('  draft: your storyboard.json is KEPT as it is (it may be your own work). The new draft from the script is in');
    log(`         storyboard.draft.json. To use the new one instead, run again with --force.`);
    return {story, kept: true};
  }
  writeJson(target, story);
  log(`  draft: ${story.beats.length} beats from ${path.basename(scriptFile)}`);
  for (const b of story.beats) log(`    ${b.id.padEnd(4)} ${b.kind.padEnd(30)} ${JSON.stringify(b.text ?? b.value ?? b.items ?? b.lines ?? '')}`);
  return {story, kept: false};
}

// `connect-ai-motion my-script.md`: a script instead of a command makes a project folder next to it and runs everything
async function fromFile(file) {
  const src = path.resolve(file);
  const dir = path.join(path.dirname(src), path.basename(src).replace(SCRIPT, '') + '-motion');
  const P = projectPaths(dir);
  if (!fs.existsSync(path.join(P.dir, 'my-info.json'))) fs.copyFileSync(path.join(KIT, 'my-info.json'), path.join(P.dir, 'my-info.json'));
  // a voice file next to the script comes along (same name), and subtitles given as the script are the timing too
  for (const ext of ['.wav', '.mp3', '.m4a', '.words.json', '.srt', '.vtt']) {
    const side = src.replace(SCRIPT, ext);
    const isScript = side === src;
    if (isScript && ext !== '.srt') continue;
    if (fs.existsSync(side) && (isScript || !fs.existsSync(path.join(P.input, path.basename(side))))) fs.copyFileSync(side, path.join(P.input, path.basename(side)));
  }
  log(`project folder: ${P.dir}`);
  if (draftInto(P, src, {force: flag('force')}).kept) log('  rendering your storyboard.json (not the new draft)');
  return full(P, {force: flag('force')});
}

const BANNER_CMDS = new Set(['demo', 'run', 'help', 'doctor', 'install-skill', 'catalog', 'new']);
function hello() {
  log(banner());
  log('  ' + 'No footage needed. ' + gold('A few lines of text become a motion graphics video.') + dimmed('  찍은 영상 없이, 글 몇 줄로 모션그래픽 영상'));
  log('');
}

async function main() {
  if ((BANNER_CMDS.has(cmd) || SCRIPT.test(cmd)) && !flag('quiet') && !flag('json')) hello();
  if (SCRIPT.test(cmd) && fs.existsSync(cmd)) { const r = await fromFile(cmd); process.exitCode = r?.ok ? 0 : 1; return; }
  if (SCRIPT.test(cmd)) { log(`${cmd}: file not found. Write your script there first (one line per scene), then run this again.`); process.exitCode = 1; return; }
  switch (cmd) {
    case 'demo': {
      // built-in example: a short film about what this kit is, text only (no voice needed)
      // --ko: the Korean example (a made-up bakery promo, Korean on screen, brand colours, 16:9 + 9:16)
      const ko = flag('ko');
      const P = projectPaths(projectDir(pos[1] || (ko ? 'fm-demo-ko' : 'fm-demo')));
      copyDir(path.join(KIT, 'examples', ko ? 'shop-ko' : 'hello'), P.dir);
      if (ko && !argv.includes('--short')) argv.push('--short');
      const r = await full(P, {force: flag('force')});
      process.exitCode = r.ok ? 0 : 1;
      break;
    }
    case 'new': {
      const P = projectPaths(projectDir(pos[1] || 'my-film'));
      copyDir(path.join(KIT, 'examples', 'blank'), P.dir);
      log(`${P.dir}: script.md, storyboard.json and my-info.json are ready. Edit them, then: npx ${KIT_NAME} run ${shq(path.relative(process.cwd(), P.dir) || '.')}`);
      break;
    }
    case 'draft': {
      if (!pos[1] || !fs.existsSync(pos[1])) { log('usage: draft <script.md | script.txt | subtitles.srt> [folder] [--force]'); process.exitCode = 1; break; }
      const P = projectPaths(projectDir(pos[2] || path.dirname(path.resolve(pos[1]))));
      draftInto(P, pos[1], {force: flag('force')});
      break;
    }
    case 'run': {
      const r = await full(projectPaths(projectDir(pos[1])), {force: flag('force'), only: opt('only')});
      process.exitCode = r.ok ? 0 : 1;
      break;
    }
    case 'check': {
      const P = projectPaths(projectDir(pos[1]));
      const t = Date.now();
      const data = await loadData(P);
      let measured = null;
      const film = path.join(P.out, 'film.mp4');
      const pre = await check(P, {aspects: shapes(), data, write: false});
      if (flag('measure') && fs.existsSync(film)) measured = await measureFilm(film, pre.timelines['16x9']);
      const r = await check(P, {aspects: shapes(), data, measured});
      printCheck(r, t);
      for (const f of r.facts) log(`    ${f}`);
      process.exitCode = r.ok ? 0 : 1;
      break;
    }
    case 'render': {
      const P = projectPaths(projectDir(pos[1]));
      const data = await loadData(P);
      const r = await check(P, {aspects: shapes(), data});
      printCheck(r);
      if (!r.ok && !flag('force')) { process.exitCode = 1; break; }
      await render(P, data, {aspects: shapes(), only: opt('only'), bad: r.errors.map((e) => e.id), seconds: Number(opt('seconds', '0')), scale: Number(opt('scale', '1')), log});
      break;
    }
    case 'sheet': {
      // stills only (fast): one per beat, and with --seconds 1 a contact sheet for pacing
      const P = projectPaths(projectDir(pos[1]));
      const data = await loadData(P);
      const r = await check(P, {aspects: shapes(), data});
      printCheck(r);
      await render(P, data, {aspects: shapes(), media: false, bad: r.errors.map((e) => e.id), seconds: Number(opt('seconds', '0')), log});
      process.exitCode = r.ok ? 0 : 1;
      break;
    }
    case 'catalog': {
      // everything you can call with one "kind", checked against the common meta.json contract
      const {metas, errors} = buildCatalog();
      let all = Object.values(metas);
      if (opt('use')) all = all.filter((m) => m.use === opt('use'));
      if (opt('role')) all = all.filter((m) => m.role === opt('role'));
      if (opt('lead')) all = all.filter((m) => m.lead === opt('lead'));
      if (flag('json')) { console.log(JSON.stringify(all, null, 1)); break; }
      for (const role of ['scene', 'bg', 'transition', 'sweep']) {
        const list = all.filter((m) => m.role === role);
        if (!list.length) continue;
        log(`\n${{scene: 'SCENES  ("kind" of a beat)', bg: 'BACKGROUNDS  ("bg" of the film or of a beat)', transition: 'TRANSITIONS  ("in" of a beat; a hard cut needs nothing)', sweep: 'SWEEPS  ("in" of a beat: light passes over a hard cut)'}[role]}`);
        for (const m of list) {
          log(`  ${m.kind.padEnd(34)} ${m.status && m.status !== 'ok' ? '[' + m.status + '] ' : ''}${m.use.padEnd(10)} ${String(m.lead || '').padEnd(8)} ${String(m.license).padEnd(16)} ${m.title}`);
          if (flag('props') && m.props) for (const [k, v] of Object.entries(m.props)) log(`      ${k}: ${v}`);
          for (const r of m.reasons || []) log(`      why: ${r}`);
        }
      }
      const ok = all.filter((m) => !m.status || m.status === 'ok').length;
      log(`\n${ok} ready, ${all.length - ok} listed but not playable here.`);
      log('A beat: {"say": "the script line", "kind": "<scene>", "text": "words from the line", "bg": "<background>", "in": "<transition>"}');
      log('Your own: {"kind": "custom", "component": "./my/Scene.tsx"} · {"kind": "hyperframes", "src": "./block.html"} · {"kind": "lottie", "src": "./anim.json"} · {"kind": "clip", "src": "./made-elsewhere.mp4"}');
      for (const e of errors) log('  problem: ' + e);
      process.exitCode = errors.length ? 1 : 0;
      break;
    }
    case 'gallery': {
      // the catalog as a film: every item with its own example (--role scene | bg | transition, --source remotion, --clips)
      const role = opt('role', 'scene');
      const P = projectPaths(projectDir(pos[1] || 'fm-gallery'));
      const {metas} = buildCatalog();
      const story = galleryStory(metas, {sources: opt('source') ? opt('source').split(',') : [], role, secs: Number(opt('secs', '0')), style: opt('style', 'connect'), lead: opt('lead')});
      if (!story.beats.length) { log('nothing to show for that filter'); process.exitCode = 1; break; }
      writeJson(path.join(P.dir, 'storyboard.json'), story);
      if (!fs.existsSync(path.join(P.dir, 'my-info.json'))) writeJson(path.join(P.dir, 'my-info.json'), {name: 'CONNECT AI LAB', style: 'connect'});
      const data = await loadData(P, {story});
      const name = opt('name', `gallery_${role}`);
      const t = Date.now();
      const r = await check(P, {aspects: shapes(), data, write: false});
      for (const e of r.errors) log(`    ERROR  ${e.msg}`);
      await render(P, data, {aspects: shapes(), captions: true, media: !flag('sheet'), name, scale: Number(opt('scale', '1')), crf: 20, log});
      if (flag('clips') && !flag('sheet')) {
        const made = await splitClips(path.join(P.out, `${name}.mp4`), r.timelines['16x9'], path.join(P.out, 'clips'), {log});
        writeJson(path.join(P.out, `clips_${role}.json`), made);
      }
      log(`  ${story.beats.length} items  (${secs(t)})`);
      break;
    }
    case 'hf-import': {
      // HyperFrames blocks (registry checkout, template folder or your own .html) -> catalog/hyperframes/<name>/
      if (!pos[1]) { log('usage: hf-import <folder> [--dry] [--prefix my-] [--license Apache-2.0]'); process.exitCode = 1; break; }
      const res = importHyperFrames(pos[1], {dry: flag('dry'), prefix: opt('prefix', ''), license: opt('license', 'Apache-2.0')});
      for (const x of res) {
        log(`  ${x.kind.padEnd(44)} ${x.status}`);
        for (const r of x.reasons) log(`      why: ${r}`);
        for (const w of x.warnings) log(`      note: ${w}`);
      }
      log(`${res.filter((x) => x.status === 'ok').length} of ${res.length} blocks can play frame by frame.${flag('dry') ? ' (dry run: nothing written)' : ' Tune window / crop / text in each meta.json, then run gallery --source hyperframes.'}`);
      break;
    }
    case 'preview': {
      const P = projectPaths(projectDir(pos[1]));
      const data = await loadData(P);
      const {metas} = buildCatalog();
      // Studio bundles the kit itself: your scenes go into the kit's registry and your files into work/fm-assets
      const prep = prepareProject(P, data.story, metas);
      if (prep.errors.length) { for (const e of prep.errors) log(`    ERROR  ${e}`); process.exitCode = 1; break; }
      writeUser(prep.users);
      const props = path.join(P.work, 'props.json');
      writeJson(props, {data, aspect: flag('short') ? '9x16' : '16x9'});
      const child = spawn(process.execPath, [cliPath(), 'studio', path.join(KIT, 'src', 'index.ts'), '--public-dir', P.work, '--props', props], {stdio: 'inherit', cwd: KIT, shell: false});
      await new Promise((res) => child.on('close', (code) => { process.exitCode = code ?? 1; res(); }));
      break;
    }
    case 'version':
      log(JSON.parse(fs.readFileSync(path.join(KIT, 'package.json'), 'utf8')).version);
      break;
    case 'doctor':
      process.exitCode = (await doctor(log)) ? 0 : 1;
      break;
    case 'install-skill': {
      const list = installSkill({agent: opt('agent', 'all'), dir: opt('dir'), project: flag('project'), dryRun: flag('dry-run'), runtime: !flag('no-runtime'), log});
      if (!flag('dry-run') && !list.some((t) => t.done)) {
        log('  Nothing was installed. Name your agent: install-skill --agent claude | codex | antigravity | cursor (or --dir <its skills folder>).');
        process.exitCode = 1;
      } else if (!flag('dry-run')) {
        log('');
        log('  ' + gold('Done.') + ' Open a NEW chat in your agent and say:  "make a motion graphics video from this script"');
        log('  ' + gold('끝.') + ' 에이전트에서 새 대화를 열고 이렇게 말하세요:  "이 대본으로 모션그래픽 영상 만들어 줘"');
      }
      break;
    }
    case 'remove-skill':
      removeSkill({agent: opt('agent', 'all'), dir: opt('dir'), project: flag('project'), dryRun: flag('dry-run'), log});
      break;
    default:
      if (cmd !== 'help') {
        // a typo must not look like success to you or to an agent
        const near = COMMANDS.map((c) => [c, lev(cmd, c)]).sort((a, b) => a[1] - b[1])[0];
        log(`unknown command: ${cmd}.${near && near[1] <= 2 ? ` Did you mean ${near[0]}?` : ''} The list is below.`);
        process.exitCode = 2;
      }
      log(`${KIT_NAME}: a script becomes a motion graphics video. No footage needed.
One line of your script = one beat = one full-frame scene. Scenes come from Remotion packages, HyperFrames blocks,
Lottie files, shaders, the kit, or your own file, all called the same way. The kit checks rhythm and words.

  npx ${KIT_NAME} demo                 built-in example, start to finish (text only, no voice needed)
  npx ${KIT_NAME} demo --ko            the Korean example: a shop promo in Korean, 16:9 and 9:16 (한국어 예제)
  npx ${KIT_NAME} <script.md>          your script (one line per beat): makes <script>-motion/ next to it and runs everything
  npx ${KIT_NAME} new [folder]         an empty project to fill in
  npx ${KIT_NAME} draft <script> [folder]   first storyboard.json from a script or subtitles (.srt)
  npx ${KIT_NAME} run [folder]         check -> render -> check the rendered video
      --short   also 9:16     --square  also 1:1     --only <beat>  re-render one beat     --force  render even if check fails
      --seconds 1   also a contact sheet with one still every second
      --outside-files   allow files outside the project folder (only for a storyboard you trust)
  npx ${KIT_NAME} check [folder]       rhythm (3 s rule), repeated designs, words not in the script, word count -> out/report.md
  npx ${KIT_NAME} sheet [folder]       stills only: one per beat (fast look before a full render)
  npx ${KIT_NAME} preview [folder]     Remotion Studio with your storyboard
  npx ${KIT_NAME} catalog              every scene, background and transition (--lead picture, --use chart, --role bg, --props, --json)
  npx ${KIT_NAME} gallery [folder]     render the catalog itself (--role scene | bg | transition, --source remotion, --sheet)
  npx ${KIT_NAME} hf-import <folder>   HyperFrames blocks -> catalog scenes (unsupported ones listed with reasons)
  npx ${KIT_NAME} doctor               check this computer
  npx ${KIT_NAME} install-skill        add the agent skill (Claude Code, Codex, Antigravity, Cursor) and a kit copy
                                        that stays in ~/.connect-ai/ (--agent claude, --no-runtime to skip the copy)

Voice: put voice.wav (+ voice.srt or voice.words.json) in <folder>/input/ and beats can start on a spoken word:
  {"at": {"text": "red", "near": 12.4}}`);
  }
}

main().catch((e) => {
  console.error(`\n${KIT_NAME}: ${e.message}`);
  if (process.env.CONNECT_AI_MOTION_DEBUG) console.error(e.stack);
  const msg = String(e.message);
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|fetch failed|Failed to download|getaddrinfo/i.test(msg)) {
    console.error(`  Could not download something the first render needs (the Chrome Headless Shell, about 94 MB, once).
  Check the internet connection. If an agent runs this command, its sandbox may block the network: allow this command to run outside it.
  첫 렌더에 필요한 브라우저(약 94 MB, 한 번만)를 못 내려받았어요. 인터넷 연결을 확인해 주세요.
  에이전트가 돌리고 있다면 샌드박스가 네트워크를 막았을 수 있어요. 이 명령을 샌드박스 밖에서 실행하도록 허용해 주세요.`);
  } else if (/No available ports|listen E(ACCES|PERM|ADDRINUSE)|EPERM[^\n]*(listen|bind|socket)|operation not permitted[^\n]*(listen|bind|socket)/i.test(msg)) {
    // Seen when an agent runs us inside its sandbox (e.g. Codex workspace-write): the renderer needs a local port and a browser.
    console.error(`  The renderer could not open a local port. Your agent is running commands in a sandbox.
  Allow this command to run outside the sandbox (approve it, or give the agent full access for this folder), then run it again.
  렌더러가 내 컴퓨터 안쪽 포트를 못 열었어요. 에이전트가 샌드박스 안에서 돌리고 있어요.
  이 명령을 샌드박스 밖에서 실행하도록 허용한 뒤(승인, 또는 이 폴더에 전체 권한) 다시 돌려 주세요.`);
  }
  process.exitCode = 1;
});

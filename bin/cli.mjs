#!/usr/bin/env node
// connect-ai-motion: a script becomes a motion graphics video. No footage needed.
// One line of the script = one beat = one full-frame scene from the catalog.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {KIT_NAME} from '../src/core/name.mjs';
import {KIT, projectPaths, readJson, writeJson, readStory} from '../lib/project.mjs';
import {buildCatalog} from '../lib/catalog-build.mjs';
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
const cmd = (flag('help') || argv.includes('-h')) ? 'help' : (pos[0] || 'help');
const log = (...a) => console.log(...a);
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
    await render(P, data, {aspects: ['16x9'], media: false, bad, log});
    log(`    sheet: ${path.join(P.out, 'sheet.jpg')} shows every beat; red = the ones with an error`);
    return r;
  }
  log('2/3 render');
  await render(P, data, {aspects, only, bad, seconds: Number(opt('seconds', '0')), scale: Number(opt('scale', '1')), log});
  if (!only) {
    log('3/3 check (the rendered film)');
    const m = await measureFilm(path.join(P.out, 'film.mp4'), r.timelines['16x9']);
    const r2 = await check(P, {aspects, data, measured: m});
    for (const e of m.errors) log(`    ERROR  ${e.msg}`);
    for (const a of m.advice) log(`    advice ${a.msg}`);
    for (const f of m.facts) log(`    ${f}`);
    log(`done in ${secs(t)}. Film: ${path.join(P.out, 'film.mp4')}  · sheet: out/sheet.jpg · report: out/report.md`);
    return r2;
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
  if (fs.existsSync(target) && !force) {
    writeJson(path.join(P.dir, 'storyboard.draft.json'), story);
    log('  draft: kept your storyboard.json (new draft in storyboard.draft.json)');
  } else {
    writeJson(target, story);
    log(`  draft: ${story.beats.length} beats from ${path.basename(scriptFile)}`);
    for (const b of story.beats) log(`    ${b.id.padEnd(4)} ${b.kind.padEnd(30)} ${JSON.stringify(b.text ?? b.value ?? b.items ?? '')}`);
  }
  return story;
}

// `connect-ai-motion my-script.md`: a script instead of a command makes a project folder next to it and runs everything
async function fromFile(file) {
  const src = path.resolve(file);
  const dir = path.join(path.dirname(src), path.basename(src).replace(SCRIPT, '') + '-motion');
  const P = projectPaths(dir);
  if (!fs.existsSync(path.join(P.dir, 'my-info.json'))) fs.copyFileSync(path.join(KIT, 'my-info.json'), path.join(P.dir, 'my-info.json'));
  // a voice file next to the script comes along (same name, or the only audio file)
  for (const ext of ['.wav', '.mp3', '.m4a', '.words.json', '.srt', '.vtt']) {
    const side = src.replace(SCRIPT, ext);
    if (side !== src && fs.existsSync(side) && !fs.existsSync(path.join(P.input, path.basename(side)))) fs.copyFileSync(side, path.join(P.input, path.basename(side)));
  }
  log(`project folder: ${P.dir}`);
  draftInto(P, src);
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
      log(`${P.dir}: script.md, storyboard.json and my-info.json are ready. Edit them, then: npx ${KIT_NAME} run ${path.relative(process.cwd(), P.dir) || '.'}`);
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
      await render(P, data, {aspects: shapes(), media: false, bad: r.errors.map((e) => e.id), seconds: Number(opt('seconds', '0')), log});
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
      buildCatalog();
      const props = path.join(P.work, 'props.json');
      writeJson(props, {data, aspect: flag('short') ? '9x16' : '16x9'});
      spawn(process.execPath, [cliPath(), 'studio', path.join(KIT, 'src', 'index.ts'), '--public-dir', P.work, '--props', props], {stdio: 'inherit', cwd: KIT});
      break;
    }
    case 'doctor':
      process.exitCode = (await doctor(log)) ? 0 : 1;
      break;
    case 'install-skill': {
      const list = installSkill({agent: opt('agent', 'all'), dir: opt('dir'), project: flag('project'), dryRun: flag('dry-run'), log});
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
      log(`${KIT_NAME}: a script becomes a motion-graphics film. No footage needed.
One line of your script = one beat = one full-frame scene. Scenes come from Remotion packages, HyperFrames blocks,
Lottie files, shaders, the kit, or your own file, all called the same way. The kit checks rhythm and words.

  npx ${KIT_NAME} demo                 built-in example, start to finish (text only, no voice needed)
  npx ${KIT_NAME} demo --ko            the Korean example: a shop promo in Korean, 16:9 and 9:16 (한국어 예제)
  npx ${KIT_NAME} <script.md>          your script (one line per beat): makes <script>-motion/ next to it and runs everything
  npx ${KIT_NAME} new [folder]         an empty project to fill in
  npx ${KIT_NAME} draft <script> [folder]   first storyboard.json from a script or subtitles (.srt)
  npx ${KIT_NAME} run [folder]         check -> render -> check the rendered film
      --short   also 9:16     --square  also 1:1     --only <beat>  re-render one beat     --force  render even if check fails
      --seconds 1   also a contact sheet with one still every second
  npx ${KIT_NAME} check [folder]       rhythm (3 s rule), repeated designs, words not in the script, word count -> out/report.md
  npx ${KIT_NAME} sheet [folder]       stills only: one per beat (fast look before a full render)
  npx ${KIT_NAME} preview [folder]     Remotion Studio with your storyboard
  npx ${KIT_NAME} catalog              every scene, background and transition (--lead picture, --use chart, --role bg, --props, --json)
  npx ${KIT_NAME} gallery [folder]     render the catalog itself (--role scene | bg | transition, --source remotion, --sheet)
  npx ${KIT_NAME} hf-import <folder>   HyperFrames blocks -> catalog scenes (unsupported ones listed with reasons)
  npx ${KIT_NAME} doctor               check this computer
  npx ${KIT_NAME} install-skill        add the agent skill (Claude Code, Codex, Antigravity, Cursor)

Voice: put voice.wav (+ voice.srt or voice.words.json) in <folder>/input/ and beats can start on a spoken word:
  {"at": {"text": "red", "near": 12.4}}`);
  }
}

main().catch((e) => {
  console.error(`\n${KIT_NAME}: ${e.message}`);
  process.exitCode = 1;
});

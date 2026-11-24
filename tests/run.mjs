// Tests: the timeline keeps its promises and check catches a storyboard that breaks the rules on purpose.
// No rendering here (fast). Run: node tests/run.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {projectPaths, writeJson, readJson} from '../lib/project.mjs';
import {check} from '../lib/check.mjs';
import {scanCatalog, buildCatalog} from '../lib/catalog-build.mjs';
import {draftStory, scriptLines} from '../lib/draft.mjs';
import {galleryStory} from '../lib/gallery.mjs';
import {synth, peakDb} from '../lib/sound.mjs';
import {analyseFrames} from '../lib/measure.mjs';
import {checkBlock} from '../lib/hf-import.mjs';
import {installSkill, removeSkill} from '../lib/install.mjs';
import {validateMeta, LICENSES, mediaOf, leadOf} from '../src/core/catalog.mjs';
import {mediaName} from '../src/core/assets.mjs';
import {buildTimeline, seriesPlan, itemFrames} from '../src/core/timeline.mjs';
import {notSaid, readingSeconds, countWords} from '../src/core/text.mjs';
import {safeBox} from '../src/core/zones.mjs';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let n = 0;
const ok = (name) => console.log(`  ok ${++n} ${name}`);
const {metas, errors: catErrors} = buildCatalog();
const hello = readJson(path.join(KIT, 'examples', 'hello', 'storyboard.json'));
const info = readJson(path.join(KIT, 'examples', 'hello', 'my-info.json'));

function project(story, files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-test-'));
  const P = projectPaths(dir);
  writeJson(path.join(dir, 'storyboard.json'), story);
  writeJson(path.join(dir, 'my-info.json'), info);
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return P;
}
const run = (story, opts = {}) => check(project(story, opts.files), {aspects: opts.aspects || ['16x9'], write: false});
const beat = (over) => ({id: 'x', say: 'One line is one scene', kind: 'kit/keyword', text: 'One line', ...over});
const film = (...beats) => ({version: 1, style: 'connect', sound: false, allow: ['CONNECT AI LAB'], beats});

// ---------- the catalog ----------
{
  assert.deepEqual(catErrors, [], 'catalog problems: ' + catErrors.join('; '));
  const all = Object.values(metas);
  assert.ok(all.length >= 80, `catalog has ${all.length} items`);
  for (const m of all) assert.ok(LICENSES.test(m.license), `${m.kind}: licence ${m.license}`);
  const playable = all.filter((m) => !m.status || m.status === 'ok');
  for (const src of ['kit', 'remotion', 'hyperframes', 'lottie', 'shader']) assert.ok(playable.some((m) => m.kind.startsWith(src + '/')), `a playable ${src} item`);
  for (const role of ['scene', 'bg', 'transition', 'sweep']) assert.ok(playable.some((m) => m.role === role), `a playable ${role}`);
  ok(`catalog: ${playable.length} playable items from 5 sources, every licence on the allow list`);
  const families = playable.filter((m) => m.role === 'scene').map((m) => m.family);
  assert.equal(new Set(families).size, families.length, 'every scene has its own family');
  ok('every scene is its own design (no two share a family)');
  // pictures, not text cards: every scene says what carries it, and most of the catalog is pictures
  const scenes = playable.filter((m) => m.role === 'scene');
  for (const m of scenes) assert.ok(['picture', 'type'].includes(m.lead), `${m.kind}: lead`);
  const pics = scenes.filter((m) => m.lead === 'picture');
  assert.ok(scenes.length >= 60 && pics.length * 2 > scenes.length, `${pics.length} picture scenes of ${scenes.length}`);
  ok(`${scenes.length} scenes, ${pics.length} of them carried by a picture (more than half)`);
  // files a scene shows: listed in "media", and the example files that ship with the kit are really there
  for (const m of scenes) for (const src of mediaOf(m.example || {}, m)) {
    assert.ok(src.startsWith('kit:'), `${m.kind}: example media must ship with the kit (${src})`);
    assert.ok(fs.existsSync(path.join(KIT, src.slice(4))), `${m.kind}: ${src} is missing`);
  }
  assert.notEqual(mediaName('kit:examples/media/photo-1.jpg'), mediaName('input/photo-1.jpg'));
  assert.deepEqual(mediaOf({items: [{src: 'a.jpg'}, {src: 'b.png', text: 'x'}], src: 'c.glb'}, {media: ['items', 'src']}), ['a.jpg', 'b.png', 'c.glb']);
  ok('media: every example picture, layer and model ships with the kit; paths, lists and {src} items are all found');
  for (const m of all.filter((x) => x.status && x.status !== 'ok')) assert.ok(m.reasons?.length, `${m.kind} says why it cannot play`);
  ok('items that cannot play here say why');
}
{
  const bad = (over) => validateMeta({kind: 'kit/x', title: 't', description: 'd', source: {type: 'kit'}, license: 'MIT', role: 'scene', use: 'title', lead: 'type', family: 'x', example: {text: 'a'}, ...over}, 'x');
  assert.deepEqual(bad({}), []);
  for (const lic of ['CC-BY-4.0', 'GPL-3.0', 'AGPL-3.0-only', 'NOASSERTION', 'Prosperity-3.0.0', 'unknown', 'SSPL-1.0']) assert.ok(bad({license: lic}).some((e) => /not on the list/.test(e)), lic);
  const bad0 = bad;
  assert.ok(bad0({lead: undefined}).some((e) => /lead/.test(e)) && bad0({lead: 'both'}).some((e) => /lead/.test(e)) && bad0({media: 'src'}).some((e) => /media/.test(e)));
  assert.ok(bad({role: 'overlay'}).length && bad({use: 'whatever'}).length && bad({status: 'unsupported'}).length && bad({kind: 'kit/other'}).length);
  ok('meta contract: CC BY, GPL, AGPL, NOASSERTION, Prosperity and unknown licences are refused; role, use, lead, media, status, kind are checked');
}
// ---------- the built-in examples ----------
{
  const r = await run(hello, {aspects: ['16x9', '9x16']});
  assert.deepEqual(r.errors, [], JSON.stringify(r.errors));
  const tl = r.timelines['16x9'];
  assert.ok(tl.seconds >= 15 && tl.seconds <= 32, `hello is ${tl.seconds} s`);
  assert.deepEqual(r.advice, [], JSON.stringify(r.advice));
  assert.ok(hello.sound === false, 'the built-in example is silent unless you turn the tones on');
  assert.ok(tl.beats.filter((b) => leadOf(b.meta) === 'picture').length * 2 >= tl.beats.length, 'half of hello is pictures');
  ok(`examples/hello passes check in 16:9 and 9:16 with no advice (${tl.seconds.toFixed(1)} s, ${tl.beats.length} beats, silent, half of them pictures)`);
  const r2 = await run(readJson(path.join(KIT, 'examples', 'blank', 'storyboard.json')));
  assert.deepEqual(r2.errors, []);
  ok('examples/blank passes check');
}
// ---------- the timeline ----------
{
  // transitions sit centred on the cuts: adding them moves no cut and changes no length
  const plain = buildTimeline({story: hello, metas});
  const withTr = JSON.parse(JSON.stringify(hello));
  withTr.beats.forEach((b, i) => { if (i) b.in = ['remotion/tr-fade', 'remotion/tr-slide', 'remotion/tr-wipe'][i % 3]; });
  const t2 = buildTimeline({story: withTr, metas});
  assert.equal(t2.frames, plain.frames);
  assert.deepEqual(t2.beats.map((b) => b.f0), plain.beats.map((b) => b.f0));
  const plan = seriesPlan(t2);
  const total = plan.reduce((a, p) => a + p.frames, 0) - plan.reduce((a, p) => a + p.T, 0);
  assert.equal(total, t2.frames, 'TransitionSeries length = film length');
  for (const b of t2.beats) if (b.tr) assert.ok(b.tr.frames % 2 === 0 && b.tr.frames <= b.dur * 0.45 + 1);
  ok('nine transitions added: every cut stays on its frame and the film keeps its length (voice sync is safe)');
}
{
  // voice: beats start on spoken words; the words file may be in another language than the screen
  const srt = '1\n00:00:00,200 --> 00:00:02,000\n검은색이 아니고 빨간색으로\n\n2\n00:00:02,200 --> 00:00:04,000\n코드만 싹 바꿔서\n';
  const words = {tier: 'B', captions: [{text: '검은색이', startMs: 200, endMs: 700}, {text: '아니고', startMs: 700, endMs: 1100}, {text: '빨간색으로', startMs: 1100, endMs: 2000}, {text: '코드만', startMs: 2200, endMs: 2800}, {text: '싹', startMs: 2800, endMs: 3000}, {text: '바꿔서', startMs: 3000, endMs: 4000}]};
  const story = film(beat({id: 'a', at: 0, say: 'Not black, red', text: 'Not black', kind: 'kit/keyword'}), beat({id: 'b', at: {text: '빨간색으로', near: 1.2}, say: 'red', text: 'Red', kind: 'remotion/motion-blur-slam'}), beat({id: 'c', at: {text: '코드만', near: 2.2}, say: 'swap the code', text: 'The code', kind: 'remotion/title-blur'}));
  const tl = buildTimeline({story, metas, words, voiceSeconds: 4.0});
  assert.deepEqual(tl.beats.map((b) => b.t0), [0, 1.1, 2.2]);
  assert.equal(tl.beats[1].tier, 'B');
  assert.ok(Math.abs(tl.seconds - 4.4) < 0.05, 'the film ends with the voice plus a short tail');
  assert.equal(srt.length > 0, true);
  const miss = buildTimeline({story: film(beat({at: {text: 'nowhere', near: 1}})), metas, words});
  assert.ok(miss.problems.some((p) => /not in words.json/.test(p.msg)));
  ok('voice: beats start on spoken words (Korean words, English screen), the film ends with the voice, a missing word is reported');
}
{
  const story = film(beat({kind: 'kit/steps', say: 'Cost, time, accuracy', items: [{text: 'Cost', at: 1.0}, {text: 'Time', at: 2.0}, 'Accuracy'], text: undefined, dur: 4}));
  const tl = buildTimeline({story, metas});
  assert.deepEqual(tl.beats[0].it._if.slice(0, 2), [30, 60]);
  assert.equal(tl.beats[0].it._if[2], itemFrames(3, 120)[2]);
  ok('items land on the times the storyboard gives; the others are spread by the kit');
}
// ---------- check catches broken storyboards ----------
const expectErr = async (story, what, re, name) => {
  const r = await run(story);
  const e = r.errors.find((x) => x.what === what && re.test(x.msg));
  assert.ok(e, `${name}: ${JSON.stringify(r.errors)}`);
  ok(`${name}: ${e.msg}`);
};
await expectErr(film(beat({say: 'We help people learn', text: 'Trusted by 10,000 students'})), 'said', /does not say/, 'words that are not in the script');
await expectErr(film(beat({kind: 'kit/big-number', say: 'The cost goes down', value: '70%', text: 'cost'})), 'said', /"70"/, 'a number nobody said');
{
  const r = await run(film(beat({kind: 'kit/big-number', say: 'Something new every three seconds', value: '3', unit: 'seconds', text: 'something new'})));
  assert.ok(!r.errors.some((e) => e.what === 'said'), JSON.stringify(r.errors));
  ok('"three" in the script covers "3" on screen');
}
await expectErr(film(beat({dur: 5})), 'rhythm', /nothing new on screen for 4\.\d s/, 'a scene that stands for 5 s (3 s rule)');
{
  const r = await run(film(beat({kind: 'kit/steps', say: 'Write, pick, render', items: ['Write', 'Pick', 'Render'], text: undefined, dur: 5})));
  assert.ok(!r.errors.some((e) => e.what === 'rhythm'), 'steps arrive one by one, so 5 s is fine');
  ok('the same 5 s is fine when the scene builds in steps');
}
await expectErr(film(beat({id: 'a'}), beat({id: 'b', text: 'One scene'})), 'repeat', /already used in a/, 'the same design twice');
await expectErr(film(beat({say: 'a b c d e f g h i j k l', text: 'a b c d e f g h i j k l', dur: 3})), 'words', /12 words on screen/, 'too many words');
await expectErr(film(beat({dur: 0.5})), 'short', /need about/, 'too short to read');
await expectErr(film(beat({kind: 'kit/keywords'})), 'kind', /Close ones: .*kit\/keyword/, 'a scene name that does not exist');
await expectErr(film(beat({kind: 'hyperframes/registry'})), 'kind', /needs-download/, 'an item that needs a download');
await expectErr(film(beat({kind: 'remotion/tr-fade'})), 'kind', /is a transition, not a scene/, 'a transition used as a scene');
await expectErr(film(beat({id: 'a'}), beat({id: 'b', kind: 'remotion/title-blur', in: 'kit/keyword'})), 'kind', /not a transition/, 'a scene used as a transition');
await expectErr(film(beat({kind: 'remotion/code-swap', say: 'swap black to red', from: 'black', to: 'red', text: undefined})), 'field', /needs "code"/, 'a missing field');
await expectErr(film(beat({kind: 'custom', component: './nope/Scene.tsx'})), 'file', /not found/, 'a custom scene that is not there');
await expectErr(film(beat({kind: 'kit/photo-kenburns', src: './input/nope.jpg', text: 'One line'})), 'file', /nope\.jpg not found/, 'a picture that is not there');
{
  // pictures, not text cards: three word scenes in a row are pointed out; a picture between them clears it
  const words = ['remotion/title-blur', 'remotion/motion-blur-slam', 'remotion/gsap-split', 'kit/quote'];
  const r1 = await run(film(...words.map((k, i) => beat({id: 'w' + i, kind: k, dur: 2}))));
  const a = r1.advice.find((x) => x.what === 'words-only');
  assert.ok(a && /w0, w1, w2, w3: 4 scenes in a row/.test(a.msg), JSON.stringify(r1.advice));
  const mixed = [words[0], words[1], 'kit/draw-skyline', words[2], words[3]];
  const r2 = await run(film(...mixed.map((k, i) => beat({id: 'm' + i, kind: k, dur: 2}))));
  assert.ok(!r2.advice.some((x) => x.what === 'words-only'), JSON.stringify(r2.advice));
  assert.ok(r2.facts.some((f) => /pictures: 1 of 5 beats/.test(f)));
  ok(`words-only run: ${a.msg}`);
}
{
  const six = ['remotion/title-blur', 'remotion/motion-blur-slam', 'remotion/gsap-split', 'remotion/rough-mark', 'kit/quote', 'kit/keyword'];
  const story = film(...six.map((k, i) => beat({id: 'b' + i, kind: k, hi: 'line', dur: 2, in: i ? 'remotion/tr-fade' : undefined})));
  const r = await run(story);
  assert.ok(r.advice.some((a) => a.what === 'transitions') && r.advice.some((a) => a.what === 'repeat'), JSON.stringify(r.advice));
  ok('transitions on every cut: advice (hard cuts are the default, the same transition twice)');
}
{
  const r = await run(film(beat({free: true, say: '', text: 'Anything'})));
  assert.ok(!r.errors.some((e) => e.what === 'said') && r.advice.some((a) => a.what === 'said'));
  ok('"free": true skips the script comparison and the report says so');
}
// ---------- words ----------
{
  assert.deepEqual(notSaid('Costs down', 'the cost of making video goes down'), []);
  assert.deepEqual(notSaid('한 줄만 바꾸면', '코드는 한 줄만 바꾸면 됩니다'), []);
  assert.deepEqual(notSaid('fastest', 'it is fast'), ['fastest']);
  assert.ok(readingSeconds('코드는 한 줄만 바꾸면 됩니다') > 2 && countWords('one, two; three') === 3);
  ok('word matching: case, plurals, Korean; "fastest" is not "fast"');
}
// ---------- draft ----------
{
  const lines = scriptLines('# My film\n\nCONNECT AI LAB. AI education for everyone.\n- It takes 3 minutes.\nWrite a script, pick a scene, render\n"Once it is code, you change one line."\nFind us on YouTube.\n');
  const story = draftStory(lines, metas, info);
  assert.equal(story.beats.length, 6);
  for (const b of story.beats) {
    const shown = [b.text, b.sub, b.value, ...(b.items || [])].filter(Boolean).join(' ');
    assert.deepEqual(notSaid(shown, b.say), [], `${b.id}: draft only uses words of the line`);
  }
  assert.equal(new Set(story.beats.map((b) => metas[b.kind].family)).size, story.beats.length);
  const open = draftStory(scriptLines('CONNECT AI LAB. AI education for everyone.\nIt takes 3 steps.\n'), metas, info).beats;
  assert.deepEqual([open[0].kind, open[0].text, open[0].sub, open[1].value, open[1].text], ['kit/ident', 'CONNECT AI LAB', 'AI education for everyone', '3', 'steps']);
  assert.equal(metas[story.beats[2].kind].use, 'number');
  assert.ok(['steps', 'list', 'flow', 'timeline', 'map', 'diagram'].includes(metas[story.beats[3].kind].use));
  for (const b of story.beats) assert.ok(!metas[b.kind].media && metas[b.kind].draft !== false, `${b.id}: a draft never picks a scene that needs your files or data (${b.kind})`);
  assert.equal(metas[story.beats[4].kind].use, 'quote');
  const r = await run(story);
  assert.ok(!r.errors.some((e) => ['said', 'kind', 'repeat', 'field'].includes(e.what)), JSON.stringify(r.errors));
  ok('draft: a script becomes beats that use only the words of each line, a different design per beat (number, steps, quote found)');
  const srt = scriptLines('1\n00:00:01,000 --> 00:00:03,000\nHello there\n\n2\n00:00:03,500 --> 00:00:05,000\nSecond line\n', {srt: true});
  assert.deepEqual(srt.map((x) => x.at), [{text: 'Hello', near: 1}, {text: 'Second', near: 3.5}]);
  const short = scriptLines('1\n00:00:01,000 --> 00:00:03,000\nHello there\n\n2\n00:00:03,100 --> 00:00:03,700\nRight?\n\n3\n00:00:03,800 --> 00:00:06,000\nThird line here\n', {srt: true});
  assert.equal(short.length, 2, 'a 0.6 s cue joins a neighbour'); assert.equal(short[1].say, 'Right? Third line here');
  ok('draft from subtitles: each beat starts on its first spoken word, cues too short to read join a neighbour');
}
// ---------- gallery, sound, measure, shapes ----------
{
  for (const role of ['scene', 'bg', 'transition']) {
    const story = galleryStory(metas, {role});
    const tl = buildTimeline({story, metas});
    assert.deepEqual(tl.problems, []);
    assert.ok(story.beats.every((b) => metas[b.kind]?.role === 'scene'));
  }
  ok('gallery storyboards (scenes, backgrounds, transitions) build without problems');
  const tl = buildTimeline({story: hello, metas});
  const s = synth(tl, 'tones');
  assert.ok(peakDb(s) < -6 && peakDb(s) > -30, `sound peak ${peakDb(s).toFixed(1)} dB`);
  assert.ok(Math.abs(s.length / 48000 - (tl.seconds + 1.5)) < 0.1);
  ok(`code-made sound: one soft hit per cut, peak ${peakDb(s).toFixed(1)} dBFS, never clips`);
}
{
  // made-up frames: 3 s of a moving bar, 3 s of nothing, 3 s of a bar that stands still
  const w = 160, h = 90, rate = 5, frames = [];
  for (let i = 0; i < 45; i++) {
    const f = new Uint8Array(w * h).fill(12);
    if (i < 15) for (let y = 30; y < 60; y++) for (let x = 0; x < 30; x++) f[y * w + ((x + i * 6) % w)] = 220;
    if (i >= 30) for (let y = 30; y < 60; y++) for (let x = 40; x < 70; x++) f[y * w + x] = 220;
    frames.push(f);
  }
  const tl = {seconds: 9.5, beats: [{id: 'move', t0: 0, t1: 3}, {id: 'empty', t0: 3, t1: 6}, {id: 'slide', t0: 6, t1: 9.5}]};
  const m = analyseFrames({w, h, n: frames.length, at: (i) => frames[i]}, tl);
  assert.ok(m.errors.some((e) => e.id === 'empty' && e.what === 'blank'));
  assert.ok(m.advice.some((a) => a.id === 'slide' && a.what === 'still'));
  assert.ok(!m.advice.some((a) => a.id === 'move') && !m.errors.some((e) => e.id === 'move'));
  ok('measured check: an empty stretch is an error, a picture that stands still is advice, a moving one is fine');
}
{
  const a = safeBox(1920, 1080), b = safeBox(1080, 1920);
  assert.ok(a[0] > 100 && a[0] + a[2] < 1820 && b[1] >= 250 && b[1] + b[3] <= 1536 && b[0] + b[2] <= 940);
  ok('safe box: 16:9 margins; 9:16 stays out of the app top bar, the button rail and the caption area');
}
{
  assert.ok(checkBlock('<canvas></canvas><script>requestAnimationFrame(f)</script>').reasons.length >= 2);
  assert.deepEqual(checkBlock(fs.readFileSync(path.join(KIT, 'catalog/hyperframes/gold-scramble-title/block.html'), 'utf8')).reasons, []);
  ok('hf-import: a block with its own animation loop or WebGL is refused with reasons; a paused GSAP timeline is accepted');
}
// ---------- skill installer works in a temp HOME only ----------
{
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-home-'));
  for (const d of ['.claude', '.codex', '.gemini/config', '.cursor']) fs.mkdirSync(path.join(home, d), {recursive: true});
  const quiet = () => {};
  installSkill({agent: 'all', home, env: {}, log: quiet});
  for (const d of ['.claude/skills', '.agents/skills', '.gemini/config/skills', '.cursor/skills']) assert.ok(fs.existsSync(path.join(home, d, 'connect-ai-motion', 'SKILL.md')), d);
  removeSkill({agent: 'all', home, env: {}, log: quiet});
  for (const d of ['.claude/skills', '.agents/skills', '.gemini/config/skills', '.cursor/skills']) assert.ok(!fs.existsSync(path.join(home, d, 'connect-ai-motion')), d);
  ok('install-skill / remove-skill in a temp HOME (Claude Code, Codex, Antigravity, Cursor)');
}
// ---------- Korean scripts ----------
{
  assert.deepEqual(notSaid('7시', '매일 아침 7시에 첫 빵이 나옵니다.'), []);
  assert.deepEqual(notSaid('대량 생산', '대량 생산이 아니라, 하루 한 번 굽습니다.'), []);
  assert.deepEqual(notSaid('70', '매일 아침 7시에 나옵니다.'), ['70']);
  assert.deepEqual(notSaid('7', '17시에 엽니다.'), ['7']);
  assert.deepEqual(notSaid('맛집', '작은 빵집입니다.'), ['맛집']);
  for (const [a, b, e] of [['15명', '115명이 왔다', ['15명']], ['1.5배', '15배 빨라', ['1.5배']], ['1.5배', '1.5배 빨라', []], ['50%', '50명', ['%']], ['AI', 'AI로 만듭니다', []], ['10,000원', '10,000원입니다', []], ['25', '2.5 times', ['25']], ['2.5', '2.5 times', []]]) assert.deepEqual(notSaid(a, b), e, `${a} | ${b}`);
  assert.equal(draftStory(scriptLines('2D에서 3D로 바꿉니다.'), metas, {}).beats[0].value, undefined);
  const lines = scriptLines('작은 빵집, 브레드입니다.\n매일 아침 7시에 첫 빵이 나옵니다.\n반죽, 발효, 굽기. 세 단계를 손으로 합니다.\n대량 생산이 아니라, 하루 한 번 굽습니다.\n오늘도 문을 엽니다. 브레드.');
  const st = draftStory(lines, metas, {});
  const by = Object.fromEntries(st.beats.map((b) => [b.id, b]));
  assert.equal(by.b2.value, '7시');
  assert.deepEqual(by.b3.items, ['반죽', '발효', '굽기']);
  assert.equal(by.b4.text, '대량 생산');
  assert.equal(by.b5.text, '브레드');
  for (const b of st.beats) for (const f of ['text', 'sub', 'value']) if (b[f]) assert.deepEqual(notSaid(b[f], b.say), [], `${b.id}.${f}`);
  ok('Korean: particles and counters do not count as new words, a number inside a longer number does; draft keeps 7시, a three-step list, a contrast and the name on the end card');
}
// ---------- numbers in charts come from the line ----------
{
  const st = {version: 1, style: 'connect', beats: [
    {id: 'a', say: 'Charts that draw themselves.', kind: 'kit/chart-line', items: [{text: 'Charts', value: 2}, {text: 'draw', value: 5}], dur: 2.6},
    {id: 'b', say: 'From 2 to 9.', kind: 'kit/chart-line', items: [{text: 'From', value: 2}, {text: 'to', value: 9}], dur: 2.6},
  ]};
  const P = project(st);
  const r = await check(P, {aspects: ['16x9']});
  assert.ok(r.errors.some((e) => e.id === 'a' && /"2", "5"/.test(e.msg)), 'invented values caught');
  assert.ok(!r.errors.some((e) => e.id === 'b' && e.what === 'said'), 'said values pass');
  ok('check: a number in a chart (printed or as a height) must be said in the line');
}
// ---------- the kit finds its packages when npx puts them next to it ----------
{
  const {pkgDir, moduleDirs} = await import('../lib/project.mjs');
  assert.ok(pkgDir('remotion'), 'remotion found');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-npx-'));
  fs.mkdirSync(path.join(tmp, 'node_modules', 'connect-ai-motion'), {recursive: true});
  fs.mkdirSync(path.join(tmp, 'node_modules', 'remotion'), {recursive: true});
  fs.writeFileSync(path.join(tmp, 'node_modules', 'remotion', 'package.json'), '{"version":"0.0.0"}');
  assert.equal(pkgDir('remotion', path.join(tmp, 'node_modules', 'connect-ai-motion')), path.join(tmp, 'node_modules', 'remotion'));
  assert.ok(moduleDirs().length >= 1);
  ok('packages are found next to the kit (npx layout) as well as inside it (a clone)');
}
// ---------- nothing personal in the package ----------
{
  const bad = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, {withFileTypes: true})) {
      if (['node_modules', 'out', 'work', '.git', 'docs', 'input'].includes(e.name)) continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.(wav|mp3|m4a|mov|mp4)$/i.test(e.name)) bad.push(f + ' (media file)');
      else if (/\.(mjs|ts|tsx|json|md|html)$/.test(e.name)) {
        const t = fs.readFileSync(f, 'utf8');
        if (/\/Users\/[a-z]|@gmail\.com|sk-[A-Za-z0-9]{20}|Co-Authored-By|Generated with/.test(t) && !f.endsWith(path.join('tests', 'run.mjs'))) bad.push(f);
      }
    }
  };
  walk(KIT);
  assert.deepEqual(bad, []);
  ok('package files: no home paths, emails, keys, voice or video files, no co-author lines');
}
console.log(`\n${n} tests passed.`);

// dev tool: build the static catalog page docs/index.html from the catalog and the gallery clips.
//   node tools/make-docs.mjs <gallery-scene-out> <gallery-bg-out> <gallery-transition-out>
// Each folder is the out/ of `gallery --role ... --clips` (clips/*.mp4, clips/*.jpg, clips_<role>.json).
import fs from 'node:fs';
import path from 'node:path';
import {KIT} from '../lib/project.mjs';
import {buildCatalog} from '../lib/catalog-build.mjs';
import {KIT_NAME} from '../src/core/name.mjs';

const {metas} = buildCatalog();
const DOCS = path.join(KIT, 'docs');
const CLIPS = path.join(DOCS, 'clips');
fs.mkdirSync(CLIPS, {recursive: true});
const clips = {};
for (const dir of process.argv.slice(2)) {
  for (const f of fs.readdirSync(dir).filter((x) => /^clips_.*\.json$/.test(x))) {
    for (const c of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) {
      for (const n of [c.file, c.poster]) fs.copyFileSync(path.join(dir, 'clips', n), path.join(CLIPS, n));
      clips[c.kind] = c;
    }
  }
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const all = Object.values(metas).sort((a, b) => (a.kind < b.kind ? -1 : 1));
const lineOf = (m) => {
  const ex = m.example || {};
  if (m.role === 'scene') {
    const shown = [];
    for (const k of ['text', 'sub', 'value', 'unit', 'from', 'to', 'by']) if (ex[k]) shown.push(String(ex[k]));
    for (const k of ['items', 'lines']) if (Array.isArray(ex[k])) shown.push(...ex[k].map((x) => (typeof x === 'object' ? x.text : x)));
    return JSON.stringify({say: shown.join('. ') + '.', kind: m.kind, ...ex});
  }
  if (m.role === 'bg') return JSON.stringify({bg: Object.keys(ex).length ? {kind: m.kind, ...ex} : m.kind});
  return JSON.stringify({in: Object.keys(ex).length ? {kind: m.kind, ...ex} : m.kind});
};
const promptOf = (m) =>
  m.role === 'scene'
    ? `Use ${KIT_NAME}. For this line of my script, use the scene "${m.kind}" (${m.title}). Fields: ${Object.entries(m.props || {}).map(([k, v]) => `${k} = ${v}`).join('; ')}. Take every word on screen from the line itself. Then run check and show me the sheet.`
    : m.role === 'bg'
      ? `Use ${KIT_NAME}. Set the background of my film to "${m.kind}" (${m.title}) in storyboard.json ("bg"), render the sheet and show it to me.`
      : `Use ${KIT_NAME}. Where my script changes topic, bring the next beat in with "${m.kind}" (${m.title}) as its "in". Keep every other cut a hard cut. Run check.`;

const SOURCE = {kit: 'connect-ai-motion', remotion: 'Remotion packages', hyperframes: 'HyperFrames blocks', lottie: 'Lottie files', shader: 'GPU shaders'};
const ROLE = {scene: 'Scenes', bg: 'Backgrounds', transition: 'Transitions', sweep: 'Transitions'};
const card = (m) => {
  const c = clips[m.kind];
  const ok = !m.status || m.status === 'ok';
  const src = m.source?.package || m.source?.repo || (m.kind.startsWith('kit/') ? 'this kit' : m.source?.type);
  const group = m.role === 'scene' ? (m.lead === 'picture' ? 'picture' : 'type') : m.role === 'sweep' ? 'transition' : m.role;
  return `<article class="card${ok ? '' : ' off'}" data-role="${group}" data-source="${m.kind.split('/')[0]}" data-text="${esc((m.kind + ' ' + m.title + ' ' + m.use + ' ' + m.description).toLowerCase())}">
  <div class="shot">${c ? `<video muted loop playsinline preload="none" poster="clips/${c.poster}" data-src="clips/${c.file}"></video>` : `<div class="none">${ok ? 'no clip yet' : esc(m.status)}</div>`}</div>
  <div class="meta">
    <div class="row"><h3>${esc(m.title)}</h3><span class="use">${esc(m.use)}</span></div>
    <code class="kind">${esc(m.kind)}</code>
    <p>${esc(m.description)}</p>
    ${ok ? '' : `<p class="why">${esc((m.reasons || []).join(' '))}</p>`}
    <div class="foot"><span>${esc(src)} · ${esc(m.license)}</span>${ok ? `<span class="btns"><button data-copy="${esc(lineOf(m))}">Copy line</button><button data-copy="${esc(promptOf(m))}">Copy prompt</button></span>` : ''}</div>
  </div>
</article>`;
};
const playable = all.filter((m) => !m.status || m.status === 'ok');
const count = (role) => playable.filter((m) => (role === 'transition' ? ['transition', 'sweep'].includes(m.role) : m.role === role)).length;
// pictures first: the scenes where an object, a drawing, a chart, a photo or 3D carries the beat; then the word scenes
const USE = ['hero3d', 'picture', 'device', 'character', 'chart', 'data', 'map', 'diagram', 'flow', 'timeline', 'code', 'prompt', 'number', 'list'];
// the first rows of the page: one of each kind of picture, the most telling ones
const FIRST = ['kit/iso-city', 'kit/photo-collage', 'kit/flat-to-solid', 'remotion/three-model', 'kit/chart-donut', 'kit/draw-route', 'kit/pixel-run', 'kit/device-duo', 'kit/photo-parallax', 'kit/grid-path', 'kit/code-result', 'kit/photo-wipe'];
const useRank = (m) => (FIRST.indexOf(m.kind) >= 0 ? FIRST.indexOf(m.kind) - 100 : USE.indexOf(m.use) < 0 ? 50 : USE.indexOf(m.use));
const scenes = all.filter((m) => m.role === 'scene');
const pictures = scenes.filter((m) => m.lead === 'picture' && (!m.status || m.status === 'ok')).sort((x, y) => useRank(x) - useRank(y) || (x.kind < y.kind ? -1 : 1));
const wordScenes = scenes.filter((m) => m.lead !== 'picture' && (!m.status || m.status === 'ok')).sort((x, y) => (x.kind < y.kind ? -1 : 1));
const listed = all.filter((m) => m.status && m.status !== 'ok');
const GROUPS = [
  ['picture', 'Pictures', '그림이 주인공인 장면', 'an object, a drawing, a chart, a device, a photo or 3D carries the beat', '물체 · 선 그림 · 그래프 · 기기 · 사진 · 3D 가 박자를 끌고 갑니다', pictures],
  ['type', 'Words', '글자가 주인공인 장면', 'the words are the picture: use them between pictures, not in a row', '글자가 곧 그림인 장면: 그림 사이에, 연달아 쓰지 않습니다', wordScenes],
  ['bg', 'Backgrounds', '배경', 'behind a whole film or one beat', '영상 전체 또는 한 박자의 뒤', all.filter((m) => m.role === 'bg')],
  ['transition', 'Transitions', '전환', 'a hard cut needs nothing; these are for a change of topic', '기본은 컷; 주제가 바뀔 때만', all.filter((m) => m.role === 'transition' || m.role === 'sweep')],
  ['listed', 'Listed, not bundled', '목록만 (내려받기 필요)', 'known sources the kit does not download for you', '키트가 대신 내려받지 않는 출처', listed],
];
const sections = GROUPS.filter((g) => g[5].length)
  .map(([id, en, ko, subEn, subKo, list]) => `<section data-group="${id}"><h2><span data-en="${en}" data-ko="${ko}">${en}</span> <small>${list.length}</small><i data-en="${subEn}" data-ko="${subKo}">${subEn}</i></h2><div class="grid">${list.map(card).join('\n')}</div></section>`)
  .join('\n');
const agentPrompt = `Use ${KIT_NAME} (npx ${KIT_NAME} install-skill). Make a motion graphics film from my script below, no footage. One beat per line, a different scene for each beat, words on screen only from the line. Run check until it passes, show me the sheet, then render 16:9 and 9:16.\n\n<paste your script here, one line per beat>`;
const hasDemo = (f) => fs.existsSync(path.join(DOCS, 'demo', f));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${KIT_NAME} · catalog</title>
<meta name="description" content="No footage needed: a script becomes a finished motion-graphics film. ${playable.length} scenes, backgrounds and transitions from Remotion, HyperFrames, Lottie and shaders, each called with one line. Open source by CONNECT AI LAB.">
<style>
:root{--bg:#0B0A09;--bg2:#14110E;--ink:#EBE2D2;--dim:rgba(235,226,210,.6);--faint:rgba(235,226,210,.14);--gold:#D6892A;--goldhi:#F2B45A;--teal:#3FB7A6}
:root[data-theme=paper]{--bg:#F2ECE0;--bg2:#E8E0D0;--ink:#17130F;--dim:rgba(23,19,15,.64);--faint:rgba(23,19,15,.16);--gold:#B56A14;--goldhi:#8A4E0B;--teal:#1F7F72}
:root[data-theme=paper] .bar{background:rgba(242,236,224,.92)}:root[data-theme=paper] button[data-copy]{background:rgba(181,106,20,.1)}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:300;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:var(--goldhi);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1320px;margin:0 auto;padding:0 28px}
header{padding:34px 0 0;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.brand{font-size:13px;letter-spacing:.3em;text-transform:uppercase;font-weight:400}.brand b{color:var(--goldhi);font-weight:400}
nav{display:flex;gap:22px;font-size:14px;align-items:center}
nav button{background:none;border:1px solid var(--faint);color:var(--dim);border-radius:99px;padding:4px 12px;font:inherit;font-size:12px;cursor:pointer}
.hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:48px;align-items:center;padding:56px 0 40px}
.kicker{font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:var(--goldhi);font-weight:400;display:flex;align-items:center;gap:14px}
.kicker:before{content:"";width:40px;height:1.5px;background:var(--gold)}
h1{font-size:clamp(38px,5.4vw,76px);font-weight:200;letter-spacing:-.02em;line-height:1.04;margin:18px 0 18px}
h1 em{font-style:normal;color:var(--goldhi)}
.lead{font-size:clamp(16px,1.4vw,20px);color:var(--dim);max-width:34em;margin:0 0 26px}
.cmd{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--faint);border-radius:12px;padding:12px 12px 12px 18px;font-family:"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;font-size:clamp(13px,1.2vw,16px);max-width:560px;margin-bottom:12px}
.cmd span{flex:1;overflow-x:auto;white-space:nowrap}.cmd i{color:var(--gold);font-style:normal}
button[data-copy]{background:rgba(214,137,42,.14);border:1px solid rgba(214,137,42,.5);color:var(--goldhi);border-radius:8px;padding:6px 12px;font:inherit;font-size:12px;font-weight:400;letter-spacing:.04em;cursor:pointer;white-space:nowrap}
button[data-copy]:hover{background:rgba(214,137,42,.26)}button[data-copy].done{border-color:var(--teal);color:var(--teal);background:rgba(63,183,166,.12)}
.film{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--faint);background:#000;aspect-ratio:16/9;box-shadow:0 40px 120px rgba(0,0,0,.6)}
.film video{width:100%;height:100%;display:block;object-fit:cover}
.film .tag{position:absolute;left:14px;bottom:12px;font-size:12px;letter-spacing:.06em;color:var(--dim);background:rgba(11,10,9,.7);padding:4px 10px;border-radius:99px}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--faint);border:1px solid var(--faint);border-radius:14px;overflow:hidden;margin:8px 0 46px}
.facts div{background:var(--bg);padding:20px 22px}.facts b{display:block;font-size:34px;font-weight:200;color:var(--ink);line-height:1.1}.facts span{font-size:13px;color:var(--dim)}
.how{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-bottom:54px}
.how div{border:1px solid var(--faint);border-radius:14px;padding:22px;background:var(--bg2)}
.how b{font-size:40px;font-weight:200;color:var(--gold);display:block;line-height:1}.how h4{margin:12px 0 6px;font-size:18px;font-weight:400}.how p{margin:0;color:var(--dim);font-size:14.5px}
.how code,.card p code{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:.9em;color:var(--goldhi)}
.bar{position:sticky;top:0;z-index:5;background:rgba(11,10,9,.9);backdrop-filter:blur(10px);border-bottom:1px solid var(--faint);padding:12px 0;margin-bottom:26px}
.bar .wrap{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.chip{background:none;border:1px solid var(--faint);color:var(--dim);border-radius:99px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer}.chip.on{border-color:var(--gold);color:var(--goldhi);background:rgba(214,137,42,.1)}
.bar input{flex:1;min-width:150px;background:var(--bg2);border:1px solid var(--faint);border-radius:99px;padding:7px 16px;color:var(--ink);font:inherit;font-size:14px;outline:none}
section h2{font-size:14px;letter-spacing:.28em;text-transform:uppercase;font-weight:400;color:var(--goldhi);margin:34px 0 16px;display:flex;align-items:center;gap:12px}section h2 small{color:var(--dim);letter-spacing:.1em}section h2 i{font-style:normal;letter-spacing:.02em;text-transform:none;color:var(--dim);font-size:13.5px;font-weight:300}
.film .sound{position:absolute;right:14px;bottom:12px;background:rgba(11,10,9,.78);border:1px solid rgba(214,137,42,.6);color:var(--goldhi);border-radius:99px;padding:6px 14px;font:inherit;font-size:12px;cursor:pointer}
.films{display:grid;grid-template-columns:minmax(0,.5625fr) minmax(0,1.7778fr) minmax(0,1.7778fr);gap:18px;margin:0 0 46px;align-items:start}
.films figure{margin:0}.films video,.films img{width:100%;display:block;border-radius:14px;border:1px solid var(--faint);background:#000;aspect-ratio:16/9;object-fit:cover}.films figure:first-child video,.films figure:first-child img{aspect-ratio:9/16}
.films figcaption{font-size:13px;color:var(--dim);margin-top:8px}.films figcaption code{font-family:"SF Mono",Menlo,Consolas,monospace;color:var(--goldhi);font-size:.92em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.card{border:1px solid var(--faint);border-radius:14px;overflow:hidden;background:var(--bg2);display:flex;flex-direction:column}
.card.off{opacity:.62}
.shot{aspect-ratio:16/9;background:#000;position:relative}.shot video{width:100%;height:100%;display:block;object-fit:cover}
.shot .none{position:absolute;inset:0;display:grid;place-items:center;color:var(--dim);font-size:12px;letter-spacing:.2em;text-transform:uppercase}
.meta{padding:14px 16px 14px;display:flex;flex-direction:column;gap:6px;flex:1}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.row h3{margin:0;font-size:17px;font-weight:400}
.use{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);white-space:nowrap}
.kind{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;color:var(--goldhi)}
.card p{margin:0;color:var(--dim);font-size:13.5px}.card p.why{color:#E0605A;font-size:12.5px}
.foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:8px;font-size:11.5px;color:var(--dim);flex-wrap:wrap}.btns{display:flex;gap:6px}
.agent{border:1px solid var(--faint);border-radius:14px;padding:22px;background:var(--bg2);margin:54px 0 0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}
.agent pre{margin:8px 0 0;white-space:pre-wrap;font-family:"SF Mono",Menlo,Consolas,monospace;font-size:13px;color:var(--dim)}
footer{padding:60px 0 70px;color:var(--dim);font-size:14px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-top:1px solid var(--faint);margin-top:60px}
footer b{color:var(--ink);font-weight:400;letter-spacing:.24em;text-transform:uppercase;font-size:13px}
[hidden]{display:none!important}
.hero>*{min-width:0}.film .tag{right:130px}
@media (max-width:900px){.film .tag{display:none}.films{grid-template-columns:1fr 1fr}.films figure.wide{grid-column:auto}.films figure:first-child{grid-row:span 2}section h2{flex-wrap:wrap}.hero{grid-template-columns:1fr;gap:28px;padding:36px 0 30px}.facts{grid-template-columns:repeat(2,minmax(0,1fr))}.how{grid-template-columns:1fr}.agent{grid-template-columns:1fr}.wrap{padding:0 18px}nav a.hide{display:none}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand"><b>Open source</b> by CONNECT AI LAB</div>
    <nav><a class="hide" href="https://github.com/wonseokjung/${KIT_NAME}">GitHub</a><a href="https://www.youtube.com/@CONNECT-AI-LAB">YouTube</a><a href="https://www.aicitybuilders.com">aicitybuilders.com</a><button id="theme" data-en="Light" data-ko="밝게">Light</button><button id="lang">한국어</button></nav>
  </header>
  <div class="hero">
    <div>
      <div class="kicker" data-en="Visual Vibe Coding · lesson 3" data-ko="비주얼 바이브코딩 · 3강">Visual Vibe Coding · lesson 3</div>
      <h1 data-en="No footage.<br>A script becomes <em>a finished film.</em>" data-ko="찍은 영상 없이.<br>대본이 <em>완성된 영상</em>이 됩니다.">No footage.<br>A script becomes <em>a finished film.</em></h1>
      <p class="lead" data-en="Use it when you have something to say but nothing filmed. One line of your script is one full-frame scene: a chart that draws itself, a line drawing, 3D, your screenshot in a device, a still that moves. Remotion, HyperFrames, Lottie, three.js and shaders are all called the same way, and it checks its own rhythm." data-ko="하고 싶은 말은 있는데 찍어 둔 영상이 없을 때 씁니다. 대본 한 줄이 화면 가득한 장면 하나가 됩니다: 스스로 그려지는 그래프, 선 그림, 3D, 기기 안의 내 스크린샷, 움직이는 사진. Remotion · HyperFrames · Lottie · three.js · 셰이더를 같은 방법으로 부르고, 리듬은 스스로 검사합니다.">Use it when you have something to say but nothing filmed. One line of your script is one full-frame scene: a chart that draws itself, a line drawing, 3D, your screenshot in a device, a still that moves. Remotion, HyperFrames, Lottie, three.js and shaders are all called the same way, and it checks its own rhythm.</p>
      <div class="cmd"><span><i>$</i> npx ${KIT_NAME} demo</span><button data-copy="npx ${KIT_NAME} demo">Copy</button></div>
      <div class="cmd"><span><i>$</i> npx ${KIT_NAME} install-skill</span><button data-copy="npx ${KIT_NAME} install-skill">Copy</button></div>
    </div>
    <div class="film">${hasDemo('flagship.mp4') ? `<video id="heroFilm" src="demo/flagship.mp4" poster="demo/flagship_poster.jpg" muted loop autoplay playsinline></video><button class="sound" id="heroSound" data-en="Sound on" data-ko="소리 켜기">Sound on</button><div class="tag" data-en="No footage in this film: his lecture voice and scenes from this catalog" data-ko="촬영본 없이: 강의 목소리 한 대목과 이 카탈로그의 장면만">No footage in this film: his lecture voice and scenes from this catalog</div>` : hasDemo('hello.mp4') ? `<video src="demo/hello.mp4" poster="demo/hello_poster.jpg" muted loop autoplay playsinline></video>` : ''}</div>
  </div>
  <div class="facts">
    <div><b>${count('scene')}</b><span data-en="scenes, ${pictures.length} of them pictures" data-ko="장면, 그중 그림 장면 ${pictures.length}">scenes, ${pictures.length} of them pictures</span></div>
    <div><b>${count('bg')}</b><span data-en="backgrounds" data-ko="배경">backgrounds</span></div>
    <div><b>${count('transition')}</b><span data-en="transitions" data-ko="전환">transitions</span></div>
    <div><b>5</b><span data-en="sources behind one line" data-ko="한 줄 뒤의 출처">sources behind one line</span></div>
  </div>
  ${hasDemo('flagship.mp4') ? `<div class="films">
    <figure><video muted loop playsinline preload="none" poster="demo/flagship_9x16_poster.jpg" data-src="demo/flagship_9x16.mp4"></video><figcaption data-en="The same storyboard in 9:16" data-ko="같은 스토리보드의 9:16">The same storyboard in 9:16</figcaption></figure>
    <figure class="wide"><video muted loop playsinline preload="none" poster="demo/demo_jay_poster.jpg" data-src="demo/demo_jay.mp4"></video><figcaption data-en="“Change one line”: 35 s of a lecture, explained with pictures" data-ko="「한 줄만 바꾸면」: 강의 35초를 그림으로 설명">“Change one line”: 35 s of a lecture, explained with pictures</figcaption></figure>
    <figure class="wide"><video muted loop playsinline preload="none" poster="demo/hello_poster.jpg" data-src="demo/hello.mp4"></video><figcaption data-en="What <code>demo</code> renders: ten lines of text, no voice" data-ko="<code>demo</code> 가 만드는 것: 글 열 줄, 목소리 없음">What <code>demo</code> renders: ten lines of text, no voice</figcaption></figure>
  </div>` : ''}
  <div class="how">
    <div><b>1</b><h4 data-en="Write lines" data-ko="줄을 씁니다">Write lines</h4><p data-en="One line of the script is one beat. <code>draft</code> picks a scene for each line and only copies words out of it." data-ko="대본 한 줄이 박자 하나. <code>draft</code> 가 줄마다 장면을 고르고, 그 줄의 낱말만 가져옵니다.">One line of the script is one beat. <code>draft</code> picks a scene for each line and only copies words out of it.</p></div>
    <div><b>2</b><h4 data-en="Check the rhythm" data-ko="리듬을 검사합니다">Check the rhythm</h4><p data-en="Something new every 3 seconds, each design once, no word the script does not say, no rows of text cards. Every error says how to fix it." data-ko="3초마다 새로운 것, 디자인은 한 번씩, 대본에 없는 낱말 금지, 글자 카드 연속 금지. 오류마다 고치는 법을 알려 줍니다.">Something new every 3 seconds, each design once, no word the script does not say, no rows of text cards. Every error says how to fix it.</p></div>
    <div><b>3</b><h4 data-en="Render both shapes" data-ko="두 화면비로 렌더">Render both shapes</h4><p data-en="16:9 and 9:16 from the same storyboard. With your voice, beats start on your words." data-ko="같은 스토리보드로 16:9 와 9:16. 목소리가 있으면 박자가 내 말에 맞춰 시작합니다.">16:9 and 9:16 from the same storyboard. With your voice, beats start on your words.</p></div>
  </div>
</div>
<div class="bar"><div class="wrap">
  <button class="chip on" data-role="all" data-en="All ${playable.length}" data-ko="전체 ${playable.length}">All ${playable.length}</button>
  <button class="chip" data-role="picture" data-en="Pictures ${pictures.length}" data-ko="그림 ${pictures.length}">Pictures ${pictures.length}</button>
  <button class="chip" data-role="type" data-en="Words ${wordScenes.length}" data-ko="글자 ${wordScenes.length}">Words ${wordScenes.length}</button>
  <button class="chip" data-role="bg" data-en="Backgrounds" data-ko="배경">Backgrounds</button>
  <button class="chip" data-role="transition" data-en="Transitions" data-ko="전환">Transitions</button>
  <input id="q" type="search" placeholder="chart, 3D, photo, device, map, code ...">
</div></div>
<div class="wrap">
${sections}
  <div class="agent">
    <div><div class="kicker" data-en="With a coding agent" data-ko="코딩 에이전트와 함께">With a coding agent</div><pre>${esc(agentPrompt)}</pre></div>
    <button data-copy="${esc(agentPrompt)}">Copy prompt</button>
  </div>
  <footer>
    <div><b>CONNECT AI LAB</b><br><span data-en="AI education for everyone" data-ko="모두를 위한 AI 교육">AI education for everyone</span></div>
    <div><a href="https://www.youtube.com/@CONNECT-AI-LAB">YouTube</a> · <a href="https://www.aicitybuilders.com">aicitybuilders.com</a> · <a href="https://github.com/wonseokjung/${KIT_NAME}">GitHub</a><br>MIT · <span data-en="runs on Remotion (its own licence)" data-ko="Remotion 위에서 동작(별도 라이선스)">runs on Remotion (its own licence)</span></div>
  </footer>
</div>
<script>
var ko = false;
// copy buttons
document.addEventListener('click', function (e) {
  var b = e.target.closest('button[data-copy]');
  if (!b) return;
  var t = b.getAttribute('data-copy'), old = b.textContent;
  var done = function () { b.textContent = 'Copied'; b.classList.add('done'); setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1200); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, done);
  else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (x) {} a.remove(); done(); }
});
// #still in the address keeps every clip on its poster (for a screenshot or a slow connection)
var still = location.hash.indexOf('still') >= 0;
if (still) document.querySelectorAll('video[poster]').forEach(function (v) { var im = document.createElement('img'); im.src = v.getAttribute('poster'); im.alt = ''; im.style.cssText = 'width:100%;height:100%;display:block;object-fit:cover'; im.className = v.className; v.parentNode.replaceChild(im, v); });
// clips play only while they are on screen
var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
  es.forEach(function (x) {
    var v = x.target;
    if (x.isIntersecting) { if (!v.src) v.src = v.getAttribute('data-src'); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else if (v.src) v.pause();
  });
}, {rootMargin: '120px'}) : null;
document.querySelectorAll('video[data-src]').forEach(function (v) { if (io) io.observe(v); else v.src = v.getAttribute('data-src'); });
var hs = document.getElementById('heroSound'), hf = document.getElementById('heroFilm');
if (hs && hf) hs.addEventListener('click', function () { hf.muted = !hf.muted; if (!hf.muted) { hf.currentTime = 0; hf.play(); } hs.textContent = hf.muted ? (ko ? '소리 켜기' : 'Sound on') : (ko ? '소리 끄기' : 'Sound off'); });
// filter
var role = 'all', q = '';
function apply() {
  document.querySelectorAll('.card').forEach(function (c) {
    c.hidden = !((role === 'all' || c.getAttribute('data-role') === role) && (!q || c.getAttribute('data-text').indexOf(q) >= 0));
  });
  document.querySelectorAll('section[data-group]').forEach(function (s) { s.hidden = !s.querySelector('.card:not([hidden])'); });
}
document.querySelectorAll('.chip').forEach(function (b) { b.addEventListener('click', function () { role = b.getAttribute('data-role'); document.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('on', x === b); }); apply(); }); });
document.getElementById('q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); apply(); });
// light page (the "paper" look) or dark; #paper in the address opens it light
var th = document.getElementById('theme');
function setTheme(p) { if (p) document.documentElement.setAttribute('data-theme', 'paper'); else document.documentElement.removeAttribute('data-theme'); th.textContent = p ? (ko ? '어둡게' : 'Dark') : (ko ? '밝게' : 'Light'); }
th.addEventListener('click', function () { setTheme(!document.documentElement.hasAttribute('data-theme')); });
if (location.hash.indexOf('paper') >= 0) setTheme(true);
// language (interface words only; scene names and prompts stay in English)
document.getElementById('lang').addEventListener('click', function () {
  ko = !ko; this.textContent = ko ? 'English' : '한국어'; document.documentElement.lang = ko ? 'ko' : 'en';
  document.querySelectorAll('[data-en]').forEach(function (el) { el.innerHTML = el.getAttribute(ko ? 'data-ko' : 'data-en'); });
  setTheme(document.documentElement.hasAttribute('data-theme'));
});
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(DOCS, 'index.html'), html);
console.log(`docs/index.html: ${all.length} items, ${Object.keys(clips).length} clips`);

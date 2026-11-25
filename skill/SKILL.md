---
name: connect-ai-motion
description: Turn a script (a few lines of text, optionally with the user's own voice recording) into a finished motion graphics video without any footage, in 16:9 and 9:16. One line of the script is one full-frame scene from a catalog of 83 scenes, backgrounds and transitions (Remotion packages, HyperFrames blocks, Lottie files, three.js, shaders) or the user's own component, each called with one line. More than half of the scenes are pictures, not text cards: charts, line drawings, diagrams, 3D, and the user's own screenshots, photos, clips and models inside devices and frames. Use when the user says "make a video from this script", "motion graphics only", "explainer without footage", "intro film for my channel / shop", "이 대본으로 모션그래픽 영상 만들어 줘", "영상 없이 모션그래픽으로", "가게 홍보 영상 만들어 줘", "강의 소개 영상 만들어 줘". It checks rhythm (something new every 3 s), repeated designs, rows of text-only scenes and words that are not in the script.
---

# connect-ai-motion

You turn the user's script into `out/film.mp4` (and on request `out/film_9x16.mp4`, `out/film_1x1.mp4`).
<!-- connect-ai-motion:runtime -->
Run the kit's CLI with `node <kit>/bin/cli.mjs`, where `<kit>` is the `kit` folder written in `.connect-ai-motion.json` next to this file. If that folder is gone, use `npx -y connect-ai-motion` instead of `node <kit>/bin/cli.mjs`.
<!-- /connect-ai-motion:runtime -->
Make a project with `new <project>` (it copies `my-info.json` for you). Exit code 0 means done and checked; 1 means it did not finish (the check found errors, or something failed: read the output, fix, run again); 2 means the command itself was mistyped.
Talk to the user in their language. If the script is Korean (or any language), the words on screen stay in that language unless the user asks for another one.

## Character (도화서 화원 · 모션그래픽 직원 · Animated Pixel Portrait)
In chat apps that render Markdown images (Antigravity, Cursor, IDE chat), open each reply to the user with the compact animated pixel nameplate matching the current step, then reply on the next line (keep any custom name the user gave you):
- Greeting / asking for script or style:
  `![모션그래픽 직원](https://raw.githubusercontent.com/wonseokjung/connect-ai-motion/main/skill/assets/mascot/chat-greet.gif)`
- Planning scenes / drafting `storyboard.json` / checking rules:
  `![모션그래픽 직원 · 기획](https://raw.githubusercontent.com/wonseokjung/connect-ai-motion/main/skill/assets/mascot/chat-plan.gif)`
- Rendering sheet or `out/film.mp4`:
  `![모션그래픽 직원 · 렌더](https://raw.githubusercontent.com/wonseokjung/connect-ai-motion/main/skill/assets/mascot/chat-render.gif)`
- Finished / video & report ready:
  `![모션그래픽 직원 · 완성](https://raw.githubusercontent.com/wonseokjung/connect-ai-motion/main/skill/assets/mascot/chat-done.gif)`

Local copies (`chat-*.gif`, square `*.gif`, and `mascot.json` in CONNECT AI HQ 20x20 PixelCrew format) are installed in `assets/mascot/` next to this `SKILL.md`. Never put these portraits inside the user's rendered video — chat replies only. Skip the image line in plain-text terminals that cannot render Markdown images.

## Rules you must keep
- Only what the script says. Every word and number on screen comes from the `say` line of its beat (or from `my-info.json` / `allow`, which the user wrote). Never add numbers, results or claims. If the voice is in one language and the screen in another, `say` is the line in the screen language; a person decides whether the meaning is the same.
- Pictures, not text cards. For each line ask: what is the one picture that shows this? A thing (a device with the user's screenshot, a photo, a 3D model, a line drawing), a change (before and after, flat to solid, a wipe), a quantity (a chart with the numbers the line says), a structure (flow chart, node graph, orbit, route). Use a word scene (`"lead": "type"`) only when the line is a name, a claim or a quote, and never three in a row. `catalog --lead picture --props` lists the picture scenes.
- The user's pictures: ask for them (screenshots, product photos, a logo as SVG paths, a .glb) and put them in `<project>/input/`. Never invent a picture of a real thing and never download one. If there is none, use a diagram or drawing scene that needs no file.
- Few words per scene: the key word, number or thing. The voice (or the next beat) carries the rest.
- Rhythm: something new on screen at least every 3 seconds. A long line becomes two beats, or a scene that builds in steps.
- Each design once per film (`family` in the catalog). Do not use the same scene twice.
- Hard cuts are the default. A transition marks a change of topic, one or two per film.
- Do not write your own scene when the catalog has one. Write a custom scene only for a picture the script really needs (the thing it talks about).
- Colours: the style's base and accent stay; add at most two or three subject colours and give each one meaning.

## Steps
1. `node <kit>/bin/cli.mjs new <project>` makes the project folder with `script.md`, `storyboard.json` and `my-info.json`. Put the script in `script.md` (one line per beat) and fill in name, role, links in `my-info.json`. Every file the video uses goes inside the project folder (pictures and the voice in `<project>/input/`); files outside it are refused. If there is a voice recording, put it in `<project>/input/` as `voice.wav` with `voice.srt` (subtitles) or `voice.words.json` (word times) next to it.
2. `node <kit>/bin/cli.mjs draft <project>/script.md <project>` writes a first `storyboard.json` (it replaces the blank one from `new`; a storyboard someone edited is kept and the new draft goes to `storyboard.draft.json`, so add `--force` only to start over): one beat per line, a scene chosen by what the line is (a number, steps, a contrast, a quote).
3. `node <kit>/bin/cli.mjs catalog --props` lists every scene with its fields. Improve the draft: a better scene per line, the words that matter, items that land on the right moment. Read the script as one story first: what is the one picture each line needs?
4. `node <kit>/bin/cli.mjs check <project> [--short]`. Read every ERROR; each one says how to fix it. Run check again until PASS.
5. `node <kit>/bin/cli.mjs sheet <project>` renders one still per beat (fast). Look at `out/sheet.jpg`. Fix what looks empty, crowded or unclear.
6. `node <kit>/bin/cli.mjs run <project> [--short] [--seconds 1]`. It renders, then measures the film itself (blank frames, a picture that stands still, a scene that leaves the frame empty) and adds that to `out/report.md`. To redo one beat: `render <project> --only <beat id>`.
7. Show the user the result: open `out/film.mp4` (on macOS `open <file>`, on Windows `start "" <file>`), then tell them where it is and what the report says (timing tier, advice that is left).

## storyboard.json
```json
{
  "style": "connect",
  "bg": "remotion/bg-noise-contour",
  "sound": false,
  "allow": ["My Brand"],
  "beats": [
    {"id": "open", "say": "My Brand. What we do.", "kind": "kit/ident", "text": "My Brand", "sub": "What we do"},
    {"id": "how", "say": "Write, pick, render.", "kind": "kit/steps", "items": ["Write", "Pick", "Render"]},
    {"id": "end", "say": "Find us at mybrand.com.", "kind": "kit/endcard", "text": "My Brand", "items": ["mybrand.com"], "in": "remotion/tr-fade"}
  ]
}
```
- `kind`: a scene from the catalog. `bg`: a background for the whole film or for one beat. `in`: the transition into a beat (leave it out for a cut).
- Time: without a voice each beat lasts as long as its line takes to read; `"dur": seconds` overrides. With a voice, `"at": {"text": "word", "near": 12.4}` starts the beat on that spoken word (or `"at": 12.4`). The words come from the subtitles / word times in the language that is spoken.
- Inside a scene: `"items": [{"text": "Cost", "at": {...}}]` lands each item on its word; `"cues": {"swap": {...}}` times a named moment (each scene lists its cues in `catalog --props`).
- Files: a scene that shows a picture, clip or model takes its path from the project folder, for example `{"kind": "kit/device-browser", "src": "input/page.png"}`, `{"kind": "kit/photo-collage", "items": [{"src": "input/a.jpg"}, {"src": "input/b.jpg"}]}`, `{"kind": "remotion/three-model", "src": "input/thing.glb"}`. Example files that ship with the kit are called `kit:examples/media/photo-1.jpg`.
- The user's own: `{"kind": "custom", "component": "./scenes/Thing.tsx", "meta": {"family": "thing", "changes": [0, 0.5]}}` (a React component that takes the scene props; import helpers from `connect-ai-motion/ui`), `{"kind": "hyperframes", "src": "./block.html"}`, `{"kind": "lottie", "src": "./anim.json"}`, `{"kind": "clip", "src": "./made-elsewhere.mp4"}`.
- `"free": true` on a beat skips the script comparison (the report says so). Use it only when the user asks.

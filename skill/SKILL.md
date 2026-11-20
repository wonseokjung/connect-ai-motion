---
name: connect-ai-motion
description: Turn a script (a few lines of text, optionally with the user's own voice recording) into a finished motion-graphics film without any footage, in 16:9 and 9:16. One line of the script is one full-frame scene from a catalog of 48 scenes, backgrounds and transitions (Remotion packages, HyperFrames blocks, Lottie files, shaders) or the user's own component, each called with one line. Use when the user says "make a video from this script", "motion graphics only", "explainer without footage", "intro film for my channel / shop", "이 대본으로 모션그래픽 영상 만들어 줘", "영상 없이 모션그래픽으로". It checks rhythm (something new every 3 s), repeated designs and words that are not in the script.
---

# connect-ai-motion

You turn the user's script into `out/film.mp4` (and on request `out/film_9x16.mp4`, `out/film_1x1.mp4`).
The kit is at the path in `.connect-ai-motion.json` next to this file (`kit`). Run its CLI with `node <kit>/bin/cli.mjs`.

## Rules you must keep
- Only what the script says. Every word and number on screen comes from the `say` line of its beat (or from `my-info.json` / `allow`, which the user wrote). Never add numbers, results or claims. If the voice is in one language and the screen in another, `say` is the line in the screen language; a person decides whether the meaning is the same.
- Few words per scene: the key word, number or thing. The voice (or the next beat) carries the rest.
- Rhythm: something new on screen at least every 3 seconds. A long line becomes two beats, or a scene that builds in steps.
- Each design once per film (`family` in the catalog). Do not use the same scene twice.
- Hard cuts are the default. A transition marks a change of topic, one or two per film.
- Do not write your own scene when the catalog has one. Write a custom scene only for a picture the script really needs (the thing it talks about).
- Colours: the style's base and accent stay; add at most two or three subject colours and give each one meaning.

## Steps
1. Make a project folder. Put the script in it as `script.md` (one line per beat). If there is a voice recording, put it in `<project>/input/` as `voice.wav` with `voice.srt` (subtitles) or `voice.words.json` (word times) next to it. Copy `<kit>/my-info.json` to the project and fill in name, role, links.
2. `node <kit>/bin/cli.mjs draft <project>/script.md <project>` writes a first `storyboard.json`: one beat per line, a scene chosen by what the line is (a number, steps, a contrast, a quote).
3. `node <kit>/bin/cli.mjs catalog --props` lists every scene with its fields. Improve the draft: a better scene per line, the words that matter, items that land on the right moment. Read the script as one story first: what is the one picture each line needs?
4. `node <kit>/bin/cli.mjs check <project> [--short]`. Read every ERROR; each one says how to fix it. Run check again until PASS.
5. `node <kit>/bin/cli.mjs sheet <project>` renders one still per beat (fast). Look at `out/sheet.jpg`. Fix what looks empty, crowded or unclear.
6. `node <kit>/bin/cli.mjs run <project> [--short] [--seconds 1]`. It renders, then measures the film itself (blank frames, a picture that stands still, a scene that leaves the frame empty) and adds that to `out/report.md`. To redo one beat: `render <project> --only <beat id>`.
7. Tell the user where `out/film.mp4` is and what the report says (timing tier, advice that is left).

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
- The user's own: `{"kind": "custom", "component": "./scenes/Thing.tsx", "meta": {"family": "thing", "changes": [0, 0.5]}}` (a React component that takes the scene props; import helpers from `connect-ai-motion/ui`), `{"kind": "hyperframes", "src": "./block.html"}`, `{"kind": "lottie", "src": "./anim.json"}`, `{"kind": "clip", "src": "./made-elsewhere.mp4"}`.
- `"free": true` on a beat skips the script comparison (the report says so). Use it only when the user asks.

# The lecture demo, as a project

This is the project behind `docs/demo/demo_jay.mp4`: 32 seconds of the author's own lecture (the intro of the Visual Vibe Coding course), made into a film without any camera picture.

- `storyboard.json`: 11 beats. `say` is the English line (from the English subtitles of that video), the words on screen come from it. Nine beats start on his Korean words: `"at": {"text": "빨간색으로", "near": 21.0}`.
- `input/voice.srt`: his Korean subtitles (timing tier B). The audio file itself (`input/voice.wav`) is not in the repository; put your own recording there to run it.
- `scenes/Rabbit.tsx`: the one custom scene, the "generated video" he talks about (a rabbit running on a black screen that should be red). Everything else comes from the catalog.
- `report.md`: what `check` said about the final version.

While this storyboard was being written, `check` stopped it once: the first scene had nothing new for 3.4 s. One beat was added and it passed.

```bash
npx connect-ai-motion check docs/demo/jay-one-line
npx connect-ai-motion sheet docs/demo/jay-one-line     # stills work without the voice
```

# NOTICE

connect-ai-motion is CONNECT AI LAB's code (MIT, see LICENSE), built on Remotion. It is put together from the open-source parts below. Licence texts are in `licenses/`. "Adapted" = code was copied and changed; "Unchanged copy" = a file copied as it is; "Idea" = no code copied; "Used as it is" = an installed dependency.

## Parts and where they come from

| Part in this kit | Source (repo, version or commit) | Licence | How |
|---|---|---|---|
| `catalog/hyperframes/warm-grain-*` (4 scenes) | heygen-com/hyperframes, npm [`hyperframes@0.8.86`](https://www.npmjs.com/package/hyperframes/v/0.8.86), [`dist/templates/warm-grain/compositions/intro.html`](https://unpkg.com/hyperframes@0.8.86/dist/templates/warm-grain/compositions/intro.html), [`graphics.html`](https://unpkg.com/hyperframes@0.8.86/dist/templates/warm-grain/compositions/graphics.html) | Apache-2.0, `licenses/hyperframes-Apache-2.0.txt` | Unchanged copies of the HTML; the adapter plays a part of each timeline (window, crop and text slots are in the item's `meta.json`) |
| `src/adapters/HyperFrames.tsx` (iframe, seek every frame, seeded random, CSS animations held at the frame time, your words in the text slots, a slot the storyboard leaves empty is emptied, long lines made smaller to fit) | same idea as @remotion/gsap and the HyperFrames runtime (`window.__timelines`, `data-start`); first written for connect-ai-video-motion | ours, MIT | Idea; our own code |
| `lib/hf-import.mjs` | first written for connect-ai-video-motion | ours, MIT | Ours |
| `catalog/hyperframes/{gold-scramble-title,split-words-rise,ring-count}` | ours, written in the HyperFrames block format | MIT | Ours |
| `src/core/zones.mjs` 9:16 app zones (top 250, rail from x 940, captions under 1536 of 1080 x 1920) | aaksa/facecammaxxing [`remotion/src/lib/layout.ts` @ a9976a70](https://github.com/aaksa/facecammaxxing/blob/a9976a70b02c8b60bbb7ebf5e055271b79b12db4/remotion/src/lib/layout.ts) | MIT, `licenses/facecammaxxing-MIT.txt` | Adapted (numbers kept, returned as one safe box) |
| `src/styles/presets.mjs` timing: enter 12, opacity 6, blur 7, exit 13 frames | Tejashmakwana/motionmaxxing [`references/motion.md`, `runtime/motion.js` @ 8c8ec0f2](https://github.com/Tejashmakwana/motionmaxxing/tree/8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c) | Apache-2.0, `licenses/motionmaxxing-Apache-2.0.txt` | Numbers used |
| `src/adapters/Shader.tsx` (frame-locked `createRendererFromJSON`) and `catalog/shader/*` presets | `shaders` 4.0.2 (shader-effects-inc/shaders), `shaders/core` | MIT | Used as it is; the adapter is ours. `shaders/react` is not used |
| `catalog/lottie/*/anim.json` | ours, made by code for connect-ai-video-motion | MIT | Ours |
| `src/adapters/Lottie.tsx` | @remotion/lottie 4.0.529 + lottie-web 5.13.0 | Remotion License / MIT | Used as they are |
| `examples/media/photo-1..4.jpg` (pictures for the examples) | Poly Haven HDRIs "Misty Pines", "Table Mountain 1", "The Sky Is On Fire", "Alps Field" (polyhaven.com): one view cut from each panorama and tone-mapped by us | CC0 | Changed copies; no credit needed, listed in `examples/media/CREDITS.md` |
| `examples/media/model-rover.glb` (model for `remotion/three-model`) | Quaternius "Rover" (poly.pizza/m/tzOLXetacM) | CC0 | Unchanged copy |
| `examples/media/layer-*.svg`, `shot-*.jpg` | ours (a landscape drawn by a script; stills of this kit's own scenes) | MIT | Ours |
| Letters of `remotion/three-type` | Droid Sans Bold typeface data inside the three package, `three/examples/fonts/droid/droid_sans_bold.typeface.json` (The Android Open Source Project) | Apache-2.0 | Used as it is: imported from the installed three package, not copied into this kit |
| `remotion/three-model` loader | `three/examples/jsm/loaders/GLTFLoader.js` (three 0.170) | MIT | Used as it is |
| `kit/code-result` syntax colours | prismjs 1.30 | MIT | Used as it is |
| the picture scenes (`kit/photo-*`, `kit/device-*`, `kit/chart-*`, `kit/draw-*`, diagrams, `kit/actor`, `kit/pixel-run`, `kit/grid-path`, `kit/type-*`), `src/parts/Picture.tsx`, `src/parts/Devices.tsx` | ours | MIT | Ours; device frames are plain boxes with no brand marks |
| Storyboard as "at this moment, show this" | [feicaiclub/video-spec-builder](https://github.com/feicaiclub/video-spec-builder/tree/9e73275b35e827b8f7af4bca900790909d86e63e) (through the plan file of connect-ai-video-motion; link = the repository on 2026-11-25) | MIT | Idea; our own format |
| `lib/install.mjs` skill installer | connect-ai-video-motion / rea-biz-kit (CONNECT AI LAB) | MIT | Ours |
| `lib/ffmpeg.mjs`, `src/core/words.mjs`, `src/core/contrast.mjs`, `src/parts/Atmos.tsx` | connect-ai-video-motion (CONNECT AI LAB) | MIT | Ours, copied |

## Official Remotion packages used as they are (4.0.529)

| Package | Licence | Catalog items |
|---|---|---|
| remotion, @remotion/cli, @remotion/bundler, @remotion/renderer | Remotion License | everything (timeline, render, the ffmpeg inside it) |
| @remotion/transitions | Remotion License (package.json says UNLICENSED; it ships under the Remotion License like remotion itself) | `remotion/tr-*`, the scene series of every film |
| @remotion/layout-utils | MIT | `remotion/title-blur`, `remotion/kinetic-lines`, text fitting in every scene |
| @remotion/paths | MIT | `remotion/paths-flow`, `remotion/svg3d-stack` |
| @remotion/shapes | MIT | `remotion/shapes-bars`, `remotion/shapes-pie`, `remotion/svg3d-stack` |
| @remotion/rough-notation | MIT | `remotion/rough-mark` |
| @remotion/rounded-text-box | MIT | `remotion/rounded-chat` |
| @remotion/captions | MIT | `remotion/captions-pages`, reading .srt files |
| @remotion/noise | MIT | `remotion/bg-noise-contour`, `remotion/bg-noise-dots` |
| @remotion/motion-blur | MIT | `remotion/motion-blur-slam` |
| @remotion/gsap | MIT | `remotion/gsap-split` |
| @remotion/three | MIT | `remotion/three-solid`, `remotion/three-model`, `remotion/three-type`, `remotion/three-screens` |
| @remotion/google-fonts | MIT (Inter itself: SIL Open Font License) | the type of every scene |
| @remotion/svg-3d-engine | Remotion License | `remotion/svg3d-stack`, `kit/flat-to-solid` |
| @remotion/light-leaks | Remotion License | `remotion/sweep-light-leak` |
| @remotion/starburst | Remotion License | `remotion/bg-starburst` |
| @remotion/mac-cursors | Remotion License | `remotion/cursor-prompt` |
| @remotion/lottie | Remotion License | `lottie/*` |

## Other dependencies used as they are

| Package | Licence | Where |
|---|---|---|
| gsap 3.15.0 and its plugins (SplitText, ScrambleTextPlugin, DrawSVGPlugin) | GreenSock standard no-charge license, https://gsap.com/standard-license (not an OSI licence) | `remotion/gsap-split`, HyperFrames blocks. Always the installed package, never a CDN |
| three 0.170.0, @react-three/fiber 9.3.0 | MIT | `remotion/three-solid`, `remotion/three-model`, `remotion/three-type`, `remotion/three-screens` |
| lottie-web 5.13.0 | MIT | `lottie/*` |
| shaders 4.0.2 | MIT | `shader/*` |
| prismjs 1.30.0 | MIT | `remotion/code-swap`, `kit/code-result` (syntax colours) |
| katex 0.16.22 | MIT (its fonts: SIL Open Font License) | `remotion/katex-formula` |
| react 19.1.0, react-dom 19.1.0 | MIT | everything |

## Listed in the catalog, not shipped

| Item | Source | Licence | Why not shipped |
|---|---|---|---|
| `hyperframes/registry` | heygen-com/hyperframes `registry/` @ 6bd0b5d8 (456 items, 1,685 files, 108 MB) | Apache-2.0 for the blocks; its images, sounds, fonts and 3D files may carry their own terms | A download you choose. `hf-import` copies the block HTML only |
| `remotion/remocn-registry` | Remocn/remocn | MIT | You add the components you want in your own project |
| `remotion/remotion-bits` | av/remotion-bits (npm `remotion-bits`) | MIT in package.json, no LICENSE file in the repository | You install it in your own project |

## Our own code

The beat director (storyboard to timeline: three timing tiers, items and cues on spoken words, transitions centred on cuts), check and report, the measured check of the rendered film, the draft from a script, the gallery, the code-made sound, the sheets, all `catalog/kit/*` scenes and the scene code around every Remotion package, CLI, skill.

## Examples, sound, people

`examples/` holds text only. The package contains no voice, no video and no picture of a real person. `"sound": "tones"` is synthesised by `lib/sound.mjs` when you render (sine tones, our own, CC0). The demo film in `docs/demo/` (repository only) uses the author's own voice from his lecture, with his permission; its storyboard is in `docs/demo/jay-one-line/` without the audio file.

## Remotion licence

Remotion is not MIT. Remotion License: free for individuals, for-profit companies with up to 3 employees, and non-profits; other companies need a Company License. Read https://github.com/remotion-dev/remotion/blob/main/LICENSE.md before using this kit at a company.

## Not used

remotion-dev/skills, remotion-dev/template-tiktok (no licence stated). lemomo-ai/lemo-opuscar, Vincentwei1021/video-shotcraft (licence not confirmed). patriciogonzalezvivo/lygia (Prosperity / Patron licence). Anything GPL or AGPL. CC BY assets.

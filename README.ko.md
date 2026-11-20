# connect-ai-motion

**찍은 영상이 없어도 됩니다. 대본이 완성된 모션그래픽 영상이 됩니다.**

[CONNECT AI LAB](https://www.youtube.com/@CONNECT-AI-LAB) 이 만든 오픈소스 · 모두를 위한 AI 교육 · 비주얼 바이브코딩 3강의 도구입니다.
하고 싶은 말은 있는데 찍어 둔 영상이 없을 때 씁니다: 채널 소개, 가게 홍보, 설명 영상, 강의 요약.

대본의 한 줄이 박자 하나이고, 박자 하나가 화면 가득한 장면 하나입니다. 장면은 우리 것만이 아닙니다. Remotion 패키지, HyperFrames 블록, Lottie 파일, GPU 셰이더, 내가 만든 컴포넌트가 한 카탈로그에 들어가 같은 방법으로 불리고, 그 위의 한 층이 박자를 맞추고 리듬을 검사합니다.

종합격투기가 여러 무술의 좋은 기술을 한 경기장에서 쓰게 했듯이, 이 키트는 그래픽 라이브러리를 하나 더 만들지 않습니다. 이미 있는 것들을 이어서, 어느 것이든 `storyboard.json` 의 한 줄로 부릅니다.

```json
{"say": "No footage. Only a script. A finished film.", "kind": "remotion/kinetic-lines", "lines": ["No footage", "Only a script", "A finished film"]}
{"say": "Something new every three seconds.",          "kind": "hyperframes/ring-count", "value": "3", "unit": "seconds"}
{"say": "It checks itself before it renders.",         "kind": "lottie/gold-check", "text": "Check"}
{"say": "This is my own picture.",                     "kind": "custom", "component": "./scenes/Mine.tsx"}
```

> **라이선스.** 이 키트는 MIT 입니다. 바탕인 [Remotion](https://www.remotion.dev) 은 MIT 가 아닙니다. 개인, 직원 3명 이하 회사, 비영리는 무료이고 그 밖의 회사는 Remotion Company License 가 필요합니다([LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)). 카탈로그 일부는 같은 Remotion License 의 패키지를 쓰고, HyperFrames 블록은 Apache-2.0, GSAP 은 GreenSock 의 무료 표준 라이선스(OSI 라이선스는 아님)입니다. 항목마다 `meta.json` 에 라이선스가 적혀 있고, 허용 목록에 없는 라이선스는 카탈로그가 받지 않습니다. 전체 목록은 [NOTICE.md](NOTICE.md).

## 먼저 보기

| | 파일 | 볼 것 |
|---|---|---|
| 영상 없이 만든 강의 한 대목 | [demo_jay.mp4](docs/demo/demo_jay.mp4) | 만든 사람의 실제 강의 35초(본인 목소리)를 카메라 화면 없이. 박자 11개가 그의 말에 맞춰 시작하고, 직접 만든 장면 하나(그가 말하는 토끼), 화면 글자는 본인 영어 자막에서 |
| 내장 예제 | [hello.mp4](docs/demo/hello.mp4) · [9:16](docs/demo/hello_9x16.mp4) | 글 열 줄로 만든 30초(목소리 없음). `demo` 명령이 내 컴퓨터에서 만드는 것 |
| 장면 | [gallery_scene.mp4](docs/demo/gallery_scene.mp4) · [시트](docs/demo/gallery_scene_sheet.jpg) | 장면 35개 전부, 출처별 |
| 배경 | [gallery_bg.mp4](docs/demo/gallery_bg.mp4) | 배경 6개 |
| 전환 | [gallery_transition.mp4](docs/demo/gallery_transition.mp4) | 전환 6개 + 컷 위를 지나가는 빛샘 |
| 카탈로그 페이지 | [docs/index.html](docs/index.html) | 항목마다 반복 재생 클립과 부르는 한 줄 |

## 해 보기

Node.js 18 이상만 있으면 됩니다. 파이썬은 필요 없습니다. ffmpeg 은 Remotion 안의 것을 씁니다.

```bash
git clone https://github.com/wonseokjung/connect-ai-motion.git
cd connect-ai-motion
npm install
npx connect-ai-motion demo        # 내장 예제를 처음부터 끝까지
npx connect-ai-motion catalog     # 장면 · 배경 · 전환 전부
```

내 영상: `my-script.md` 에 몇 줄 적고 `npx connect-ai-motion my-script.md`. 코딩 에이전트(Claude Code, Codex, Antigravity)를 쓴다면 `npx connect-ai-motion install-skill` 뒤에 「이 대본으로 모션그래픽 영상 만들어 줘」라고 하면 됩니다.

## 어떻게 돌아가나

1. **박자.** `draft` 가 대본 한 줄을 박자 하나로 만들고, 줄의 성격(숫자, 단계, 대비, 인용)에 맞는 장면을 고릅니다. 줄에 있는 낱말만 가져옵니다. 그다음 내가(또는 에이전트가) 고칩니다. 한 줄을 여러 박자로 나누거나 여러 줄을 한 박자에 묶어도 됩니다.
2. **시간.** 목소리가 없으면 그 줄을 읽는 데 걸리는 시간만큼(C 등급). 목소리와 자막이 있으면 자막 낱말에 맞춰(B 등급, 약 ±0.2초), 낱말 시간이 있으면 그 낱말에 맞춰(A 등급) 시작합니다. 장면 안의 것(목록 항목, 값이 바뀌는 순간)도 낱말에 맞출 수 있습니다.
3. **두 화면비.** 같은 스토리보드로 16:9 와 9:16 을 만듭니다. 장면마다 세로 전용 배치가 따로 있고, 9:16 에서는 앱의 윗줄 · 버튼 줄 · 자막 자리를 피합니다.
4. **렌더 전 검사.** `check` 가 스토리보드를 까다로운 편집자처럼 읽고, 문제마다 고치는 법을 문장으로 알려 줍니다.
5. **렌더 후 검사.** 만들어진 영상 자체를 보고 빈 구간, 멈춘 화면, 화면을 못 채운 장면을 알려 줍니다.

## check 가 보는 것

| 규칙 | 등급 |
|---|---|
| 화면에 새로운 것이 3초 넘게 없음(카메라 움직임이 아니라 내용) | 오류 |
| 같은 디자인을 한 영상에 두 번 | 오류(박자 25개 이상인 영상은 조언) |
| 대본 줄에 없는 낱말 · 숫자가 화면에 있음 | 오류 |
| 그 장면이 읽기 좋은 낱말 수를 넘음 | 오류 |
| 읽기에 너무 짧게 떠 있음 | 오류 |
| 없는 장면 · 배경 · 전환, 여기서 재생 못 하는 것, 잘못된 자리에 쓴 것(가까운 이름을 알려 줌) | 오류 |
| 빠진 필드, 없는 파일 | 오류 |
| 0.6초 넘게 빈 화면(측정) | 오류 |
| 컷의 40 % 넘게 전환, 같은 전환 두 번 | 조언 |
| 1.6초 동안 완전히 멈춘 화면(측정) | 조언 |
| 가장 찼을 때도 화면의 2 % 미만(측정) | 조언 |

대본의 「three」는 화면의 「3」과 같다고 봅니다. 목소리가 한국어이고 화면이 영어라면 `say` 에는 영어 줄(내 자막 번역)을 적고, 낱말 파일은 한국어 자막을 둡니다. 시간은 실제로 한 말을 따르고, 화면 글자는 `say` 를 따릅니다. 두 말의 뜻이 같은지는 사람이 봅니다.

## 카탈로그

`npx connect-ai-motion catalog` 로 전부 봅니다. 지금 **재생되는 항목 48개**, 이유와 함께 목록에만 있는 것 3개.

| 출처 | 장면 | 배경 · 전환 | 예 |
|---|---|---|---|
| `kit/` | 10 | 1 | 브랜드 카드, 핵심 낱말, 1 · 2 · 3 단계, 전 / 후, 오르고 내리고, 인용, 큰 숫자, 선과 정거장, 카드 벽, 엔드 카드 · 빛 웅덩이 |
| `remotion/` | 15 | 3 + 6 + 1 | 헤드라인, 키네틱 줄, 흐름(paths), 막대 · 퍼센트 링(shapes), 손으로 표시한 문장(rough-notation), 말에 맞춘 낱말(captions), 코드 한 줄 바꾸기(prismjs), 수식(KaTeX), 프롬프트와 클릭(mac-cursors), 묻고 답하기(rounded-text-box), 잔상 낱말(motion-blur), 가운데서 펼쳐지는 글자(gsap), 판 쌓기(svg-3d-engine), 3D 입체(three) · 등고선 · 숨 쉬는 점(noise), 느린 광선(starburst) · 페이드, 밀기, 와이프, 뒤집기, 시계 와이프, 아이리스(transitions) · 컷 위 빛샘(light-leaks) |
| `hyperframes/` | 7 | | warm-grain 템플릿의 제목 카드 · 원 숫자 · 알약 숫자 · 도형 라벨(원본 그대로), 스크램블 제목 · 낱말 오르기 · 링 카운터(HyperFrames 형식으로 쓴 우리 블록) |
| `lottie/` | 3 | | 체크, 신호, 궤도 호(아래에 낱말) |
| `shader/` | | 2 | 흐르는 그라디언트, 빛줄기(`shaders` 패키지, WebGPU, 프레임에 고정) |

항목 하나 = `catalog/<출처>/<이름>/` 폴더 + `meta.json`. `role` 은 scene · bg · transition · sweep, `changes` 는 장면이 스스로 새것을 내놓는 때(리듬 검사가 읽음), `family` 는 「디자인은 한 번씩」의 단위, `status` 는 `ok` · `unsupported` · `needs-download`(이유와 함께)입니다.

목록에만 있는 것: HyperFrames 레지스트리 전체(456개, 내려받기 필요. 받은 뒤 `hf-import` 가 블록마다 장면으로 바꾸고 안 되는 것은 이유를 적음), Remocn 컴포넌트와 remotion-bits(내 프로젝트에 깔고 custom 장면으로 부름).

## 내 장면

장면은 카탈로그 항목과 같은 props 를 받는 React 컴포넌트입니다. 글자는 안전 상자 `r` 안에, 그림은 화면 전체를 써도 됩니다.

```tsx
import React from 'react';
import {Box, SceneProps, Words, fit, k01, type} from 'connect-ai-motion/ui';

const Mine: React.FC<SceneProps> = ({it, r, lf, st, ink}) => {
  const fs = fit(String(it.text), r[2] * 0.9, r[3] * 0.4, st.weight, st.tracking);
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: 0, top: r[3] * 0.3, ...type(st, fs, ink), opacity: k01(lf, 0, 12)}}>
        <Words text={String(it.text)} lf={lf} />
      </div>
    </Box>
  );
};
export default Mine;
```

```json
{"say": "This is mine.", "kind": "custom", "component": "./scenes/Mine.tsx", "text": "Mine", "meta": {"family": "mine", "changes": [0, 0.4]}}
```

`lf` 는 그 박자의 컷부터 센 프레임, `dur` 는 다음 컷까지의 프레임, `st` 는 스타일, `u` 는 배율(짧은 변 1080 px = 1), `tall` 은 9:16 일 때 참입니다. 모든 것이 프레임의 함수여야 합니다(시계, `Math.random()` 금지).

같은 props 로 [connect-ai-video-motion](https://github.com/wonseokjung/connect-ai-video-motion)(2강: 내가 말하는 영상 위에 모션그래픽)용으로 쓴 그래픽도 돌아갑니다. 그 밖에 `{"kind": "hyperframes", "src": "./block.html"}`, `{"kind": "lottie", "src": "./anim.json"}`, 다른 도구(Manim, Motion Canvas, Blender, 화면 녹화)로 만든 컷은 `{"kind": "clip", "src": "./made-elsewhere.mp4"}`.

## 내 목소리

`<프로젝트>/input/` 에 `voice.wav` 와 `voice.srt`(또는 `.vtt`, 또는 낱말 시간 `voice.words.json` = `[{"word", "start", "end"}]`)를 같이 넣습니다.

```json
{"id": "swap", "at": {"text": "빨간색으로", "near": 21.0}, "say": "you just swap the code for black to red,",
 "kind": "remotion/code-swap", "code": "const video = {\n  screen: \"black\",\n};", "from": "black", "to": "red",
 "cues": {"swap": {"text": "빨간색으로", "near": 21.0}}}
```

영상 길이는 목소리 길이를 따릅니다. 전환은 컷의 가운데에 놓이므로 전환을 넣어도 컷과 목소리가 밀리지 않습니다. 이 키트는 소리에서 낱말 시간을 만들지 않습니다(로드맵). 자막이나 낱말 시간을 쓰는 도구라면 무엇이든 됩니다.

## 명령

```
npx connect-ai-motion demo                 내장 예제
npx connect-ai-motion <script.md>          내 대본: 옆에 <script>-motion/ 을 만들고 전부 실행
npx connect-ai-motion new [폴더]            채워 넣을 빈 프로젝트
npx connect-ai-motion draft <대본> [폴더]
npx connect-ai-motion check [폴더]          --short 9:16 도 검사, --measure out/film.mp4 도 봄
npx connect-ai-motion sheet [폴더]          스틸만: 박자마다 한 장
npx connect-ai-motion run [폴더]            검사, 렌더, 영상 검사   --short  --square  --only <박자>  --seconds 1  --force
npx connect-ai-motion preview [폴더]        Remotion Studio
npx connect-ai-motion catalog              --use number  --role bg  --props  --json
npx connect-ai-motion gallery [폴더]        카탈로그 자체를 영상으로   --role scene | bg | transition  --source remotion  --sheet  --clips
npx connect-ai-motion hf-import <폴더>      HyperFrames 블록을 장면으로
npx connect-ai-motion doctor
npx connect-ai-motion install-skill        --agent claude | codex | antigravity   (remove-skill 로 뺌)
```

프로젝트는 폴더 하나입니다: `script.md`, `storyboard.json`, `my-info.json`, `input/`(목소리, 자막, 내 파일), `out/`(영상, 시트, `report.md`). 스타일은 `connect`(검정과 골드), `night`, `paper`.

소리: `"sound": "tones"` 를 넣으면 컷마다 코드로 만든 부드러운 톤이 하나씩 들어갑니다(샘플 없음, 내려받기 없음). 기본은 꺼짐입니다.

## 하지 않는 것

- 촬영, 영상 생성, 이미지 생성을 하지 않습니다. 모든 픽셀을 코드가 그립니다.
- 대본을 대신 쓰지 않고 주장을 더하지 않습니다. 화면에는 그 줄의 낱말만 나오고, check 가 그것을 지킵니다.
- 사람이 말하는 영상 위에 그래픽을 얹는 도구가 아닙니다. 그것은 [connect-ai-video-motion](https://github.com/wonseokjung/connect-ai-video-motion) 입니다. `--only` 로 뽑은 박자 하나를 편집 프로그램에서 그런 영상 사이에 전체 화면 컷으로 넣을 수 있습니다.
- 셰이더 배경은 렌더하는 컴퓨터에 WebGPU 가 있어야 합니다. 없으면 그 층은 비고 기본 배경이 보입니다.
- 첫 렌더에서 Inter 폰트(Google Fonts)와 Remotion 이 쓰는 브라우저를 한 번 내려받습니다.

## 만든 재료

[Remotion](https://github.com/remotion-dev/remotion) 위에 지었습니다. HyperFrames 형식과 템플릿 블록은 [HeyGen](https://github.com/heygen-com/hyperframes)(Apache-2.0), 타이밍 수치는 [motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing)(Apache-2.0), 9:16 앱 영역은 [facecammaxxing](https://github.com/aaksa/facecammaxxing)(MIT), 셰이더 프리셋은 [shaders](https://github.com/shader-effects-inc/shaders)(MIT). 무엇을 어떻게 썼는지는 [NOTICE.md](NOTICE.md) 에 전부 있습니다.

---

**CONNECT AI LAB** · 모두를 위한 AI 교육 · [YouTube](https://www.youtube.com/@CONNECT-AI-LAB) · [aicitybuilders.com](https://www.aicitybuilders.com)
비주얼 바이브코딩은 강의마다 오픈소스 도구를 하나씩 냅니다. 2강: [connect-ai-video-motion](https://github.com/wonseokjung/connect-ai-video-motion). 3강: 이 도구.

English: [README.md](README.md)

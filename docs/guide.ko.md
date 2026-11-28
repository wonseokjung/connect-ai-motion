# connect-ai-motion 자세한 사용법

[README](../README.ko.md) · [English](guide.md)

이 페이지는 에이전트랑, 하나하나 다 알고 싶은 분들을 위해서 정리해 둔 거예요. 짧은 소개는 README에 있어요.

connect-ai-motion은 제가 직접 만든 CONNECT AI LAB 오픈소스고요, [비주얼 바이브코딩](https://www.aicitybuilders.com/vibecoding) 3강에서 쓰는 도구예요. 커머스 콘텐츠랑 지식 콘텐츠에 쓰시면 돼요. 가게 홍보, 강의 광고, 채널 소개, 설명 영상 같은 거요. 하고 싶은 말은 있는데 찍어 둔 영상이 없을 때 쓰는 거예요.

## 시작하기 전에

Node.js 20 이상이 있어야 돼요. 처음 실행할 때 패키지를 내려받거든요. npm이 "Ok to proceed?" 하고 물어보면 y 누르시면 되고요. 첫 렌더 때는 Remotion이 쓰는 브라우저를 한 번 내려받아요.

스킬을 넣으셨으면(`npx connect-ai-motion install-skill`) 에이전트한테 대본(몇 줄이면 되고, 한국어도 돼요)이랑 넣고 싶은 그림을 같이 주세요. 그러면 에이전트가 스토리보드를 짜고, 검사하고, `out/film.mp4`(쇼츠용 9:16도 같이)를 렌더한 다음에 검사 결과까지 알려 줘요.

`install-skill`은 내 컴퓨터 `~/.connect-ai/connect-ai-motion/` 폴더에 키트를 한 번 복사해 둬요. 그래서 npx 캐시가 지워져도 에이전트가 키트를 그대로 찾아요. 처음 한 번은 조금 걸려요.

영상에 쓰는 파일(사진, 목소리, 폰트, 내 장면)은 전부 프로젝트 폴더 안에 넣어 주세요. 남이 준 스토리보드가 내 컴퓨터의 다른 파일을 못 읽게 막아 놨거든요. 폴더 밖 파일을 꼭 써야 하면, 믿을 수 있는 스토리보드일 때만 `--outside-files`를 붙이시면 돼요. 내 장면(.tsx)이랑 HyperFrames 블록은 코드라서, 남이 준 프로젝트는 믿을 수 있을 때만 렌더하세요.

## 만든 영상 세 편

이 영상들에는 카메라로 찍은 화면이 한 장도 없어요. 전부 장면마다 한 줄씩 쓴 스토리보드고요, 화면에 나오는 글자는 다 대본에 있는 말이에요.

- 촬영 없이 만든 강의 광고. 글 열 줄이랑 강의 페이지 스크린샷 두 장이에요. 28초, 16:9랑 9:16. [mp4](demo/course_ad_9x16.mp4)
- 브랜드 색을 입힌 한국어 가게 홍보. 예시로 지어낸 빵집 홍보를 한국어 여섯 줄로 쓴 거예요. 여러분들도 `demo --ko` 돌려 보시면 내 컴퓨터에서 똑같이 만들어져요. [mp4](demo/shop_ko_9x16.mp4)
- 촬영본 없이 강의 한 대목. 제 실제 강의 목소리예요. 제가 말하는 타이밍에 딱 맞춰서 장면이 하나씩 바뀌거든요. 박자 20개 중에 17개가 그림 장면이에요. [소리 있는 mp4](demo/flagship.mp4)

## 내 브랜드

기본 룩은 검정이랑 골드에, 주제에 맞는 색을 더한 거예요. 내 색이랑 폰트는 `storyboard.json`에 이렇게 넣으면 돼요.

```json
{"colors": {"accent": "#E4572E", "bg": "#101014", "ink": "#F5F0E6"}, "font": "input/MyFont.ttf"}
```

색은 어디서 고르셔도 돼요(Adobe Color 같은 데서요). 폰트는 라이선스상 써도 되는 파일로 고르시면 되고요(Google Fonts에서 Get font, Download. 대부분 SIL Open Font License예요). 한국어, 일본어도 화면에 잘 나와요. 폰트 파일을 안 넣으시면 컴퓨터에 깔려 있는 폰트로 그려 줘요.

## 이게 뭐냐면요

대본 한 줄이 박자 하나고, 박자 하나가 화면을 꽉 채우는 장면 하나예요. 그런데 장면이 제가 만든 것만 있는 게 아니거든요. Remotion 패키지, HyperFrames 블록, Lottie 파일, GPU 셰이더, 여러분들이 직접 만든 컴포넌트까지 한 카탈로그에 다 들어가 있고, 전부 같은 방법으로 불러요. 그리고 그 위에서 박자를 맞추고 리듬까지 검사해 주는 거고요.

종합격투기 생각하시면 돼요. 여러 무술의 좋은 기술을 한 경기장에서 다 쓰잖아요. 이것도 그래픽 라이브러리를 하나 더 만든 게 아니에요. 이미 있는 좋은 것들을 이어 놔서, 어떤 거든 `storyboard.json` 한 줄로 부를 수 있게 한 거예요. 이런 식으로요.

```json
{"say": "No footage. Only a script. A finished video.", "kind": "remotion/kinetic-lines", "lines": ["No footage", "Only a script", "A finished video"]}
{"say": "Something new every three seconds.",          "kind": "hyperframes/ring-count", "value": "3", "unit": "seconds"}
{"say": "It checks itself before it renders.",         "kind": "lottie/gold-check", "text": "Check"}
{"say": "This is my own picture.",                     "kind": "custom", "component": "./scenes/Mine.tsx"}
```

> 라이선스. 이 키트는 MIT예요. 다만 바탕이 되는 [Remotion](https://www.remotion.dev)은 MIT가 아니에요. 개인, 직원 3명 이하 회사, 비영리는 무료고, 그 밖의 회사는 Remotion Company License가 필요해요([LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)). 카탈로그 일부는 같은 Remotion License 패키지를 쓰고, HyperFrames 블록은 Apache-2.0, GSAP은 GreenSock의 무료 표준 라이선스(OSI 라이선스는 아니에요)예요. 항목마다 `meta.json`에 라이선스가 적혀 있고, 허용 목록에 없는 라이선스는 카탈로그가 아예 안 받아요. 전체 목록은 [NOTICE.md](../NOTICE.md)에 있어요.

## 어떻게 돌아가냐면요

1. 박자. `draft`를 돌리면 대본 한 줄을 박자 하나로 잡고, 그 줄이 숫자인지, 단계인지, 대비인지, 인용인지 보고 어울리는 장면을 골라 줘요. 화면에 띄울 말도 그 줄에 있는 것만 가져오고요. 그다음에 여러분들이나 에이전트가 고치시면 돼요. 한 줄을 박자 여러 개로 나눠도 되고, 여러 줄을 한 박자로 묶어도 돼요.
2. 시간. 목소리가 없으면 그 줄을 눈으로 읽는 데 걸리는 시간만큼 장면이 가요(C 등급). 목소리랑 자막이 있으면 자막 단어에 맞춰서(B 등급, 약 ±0.2초), 단어별 시간까지 있으면 내가 그 단어를 말하는 순간에 딱 맞춰서(A 등급) 시작해요. 장면 안에서 목록이 하나씩 뜨거나 값이 바뀌는 순간도 말에 맞출 수 있어요.
3. 두 화면비. 스토리보드 하나로 16:9랑 9:16을 같이 만들어요. 장면마다 세로용 배치가 따로 있거든요. 9:16에서는 앱 위쪽 UI, 버튼 자리, 자막 자리를 알아서 피해서 놓고요.
4. 렌더 전 검사. `check`가 깐깐한 편집자처럼 스토리보드를 꼼꼼하게 읽어요. 문제가 있으면 어떻게 고치면 되는지 문장으로 알려 줘요.
5. 렌더 후 검사. 다 만든 영상을 직접 보고 빈 구간, 멈춘 화면, 화면을 못 채운 장면을 알려 줘요.

## check 가 보는 것

| 규칙 | 등급 |
|---|---|
| 화면에 새로운 게 3초 넘게 없음(카메라 움직임 말고 내용 기준) | 오류 |
| 같은 디자인을 한 영상에 두 번 씀 | 오류(박자 25개 이상인 영상은 조언) |
| 대본 줄에 없는 낱말이나 숫자가 화면에 나옴, 차트 값도 포함(조사랑 단위는 알아서 봐요. 대본에 "7시에"가 있으면 화면의 "7시"는 통과고, 대본에 "115명"이 있어도 화면의 "15명"은 통과 못 해요) | 오류 |
| 그 장면에서 읽기 좋은 낱말 수를 넘음 | 오류 |
| 읽기엔 너무 짧게 떠 있음 | 오류 |
| 없는 장면, 배경, 전환을 씀. 여기서 재생 못 하는 걸 씀. 엉뚱한 자리에 씀(비슷한 이름을 알려 줘요) | 오류 |
| 빠진 필드, 없는 파일 | 오류 |
| 0.6초 넘게 빈 화면(측정) | 오류 |
| 글자만 나오는 장면이 3번 넘게 연달아 나옴(글자로만 쓰지 말고 그림으로 보여 주세요: `catalog --lead picture`) | 조언 |
| 컷의 40 % 넘게 전환이 들어감, 같은 전환을 두 번 씀 | 조언 |
| 1.6초 동안 완전히 멈춘 화면(측정) | 조언 |
| 가장 꽉 찼을 때도 화면의 2 %가 안 됨(측정) | 조언 |

대본의 "three"랑 화면의 "3"은 같은 걸로 봐요. 목소리는 한국어인데 화면은 영어로 하고 싶으시면, `say`에는 영어 줄(내 자막 번역 같은 거요)을 쓰고 낱말 파일은 한국어 자막을 두시면 돼요. 장면이 넘어가는 타이밍은 실제로 한 말에 맞추고, 화면 글자는 `say`에 적은 걸 띄우는 거거든요. 두 문장 뜻이 맞는지는 여러분들이 직접 보셔야 돼요.

## 카탈로그

`npx connect-ai-motion catalog` 치시면 전부 나와요. 지금 재생되는 항목이 83개(장면 66, 배경 10, 전환 7)고요, 아직 안 되는 이유랑 같이 목록에만 올라가 있는 게 3개 있어요.

| 출처 | 그림 장면 | 글자 장면 | 배경 · 전환 | 예 |
|---|---|---|---|---|
| `kit/` | 28 | 10 | 1 | 내 그림: 움직이는 사진, 두 그림과 선 하나, 레이어로 만든 깊이, 인화지 벽, 필름 스트립, 창이 되는 낱말, 그림 위 렌즈 · 기기: 브라우저, 폰, 노트북 + 폰(내 스크린샷 · 클립) · 데이터: 선 그래프, 도넛, 히트맵, 간트, 산점도 · 선 그림: 지도 위 경로, 스카이라인, 아무 SVG 경로 · 도식: 노드 그래프, 궤도, 흐름도, 평면에서 입체로, 아이소메트릭 도시, 격자 위 학습 · 코드와 그 결과, 도형 하나 캐릭터, 픽셀 게임, 선과 정거장 · 브랜드 카드, 핵심 낱말, 단계, 전 / 후, 인용, 큰 숫자, 떨어지는 글자, 엔드 카드 · 빛 웅덩이 |
| `remotion/` | 9 | 9 | 3 + 6 + 1 | 턴테이블 위 내 .glb 모델, 3D 공간에 뜬 내 스틸, 3D 입체(three), 판 쌓기(svg-3d-engine), 흐름(paths), 막대 · 퍼센트 링(shapes), 코드 한 줄 바꾸기(prismjs), 프롬프트와 클릭(mac-cursors) · 압출 3D 글자(three), 헤드라인, 키네틱 줄, 손으로 표시한 문장, 말에 맞춘 낱말, 수식(KaTeX), 묻고 답하기, 잔상 낱말, 가운데서 펼쳐지는 글자 · 등고선 · 숨 쉬는 점, 느린 광선 · 페이드, 밀기, 와이프, 뒤집기, 시계 와이프, 아이리스 · 컷 위 빛샘 |
| `hyperframes/` | | 7 | | warm-grain 템플릿의 제목 카드 · 원 숫자 · 알약 숫자 · 도형 라벨(원본 그대로), 스크램블 제목 · 낱말 오르기 · 링 카운터(HyperFrames 형식으로 쓴 우리 블록) |
| `lottie/` | | 3 | | 체크, 신호, 궤도 호(아래에 낱말) |
| `shader/` | | | 6 | 흐르는 그라디언트, 빛줄기, 빛의 장막, 스튜디오 벽, 액체 색, 검은 돌(`shaders` 패키지, WebGPU, 프레임에 고정) |

그림이 먼저예요. 장면마다 `meta.json`에 그 장면을 뭐가 끌고 가는지 적어 놨어요. `"lead": "picture"`(물체, 선 그림, 그래프, 기기, 사진, 3D)거나 `"lead": "type"`(글자가 곧 그림)이에요. 장면 66개 중에 37개가 그림이에요. `catalog --lead picture` 치시면 그림 장면만 볼 수 있고, 카탈로그 페이지도 그림부터 보여 줘요. 글자 장면이 3번 연달아 나오면 check가 알려 주고요.

내 그림. "찍은 영상 없이"라는 건 촬영을 안 해도 된다는 뜻이지, 아무것도 못 보여 준다는 뜻이 아니잖아요. 내 파일을 띄우는 장면은 어떤 칸에 파일을 넣는지 `"media"`에 다 적혀 있거든요. 파일 경로는 여러분들 프로젝트 폴더를 기준으로 찾아요.

```json
{"say": "This is the page.",        "kind": "kit/device-browser", "src": "input/my-page.png", "page": true, "text": "The page"}
{"say": "Reality and virtual mix.", "kind": "kit/photo-wipe", "src": "input/room.jpg", "wire": true, "label": "Reality", "label2": "Virtual"}
{"say": "Made in Blender.",         "kind": "remotion/three-model", "src": "input/robot.glb", "wire": true, "text": "Blender"}
```

예제가 쓰는 작은 파일들은 `examples/media/`에 있어요(CC0 Poly Haven 파노라마에서 잘라 낸 사진, CC0 모델, 저희 스틸이에요. 자세한 건 그 폴더의 CREDITS.md). 부를 때는 `kit:examples/media/photo-1.jpg` 이런 식으로 부르면 돼요.

항목 하나는 `catalog/<출처>/<이름>/` 폴더 하나랑 `meta.json`이에요. `role`은 scene, bg, transition, sweep 중 하나고, `lead`는 picture나 type이에요. `media`는 내 파일이 들어가는 필드 목록이고, `changes`는 한 장면 안에서 새로운 변화가 나오는 타이밍이에요(리듬 검사가 이걸 읽어요). `family`는 한 영상에 같은 디자인을 두 번 안 쓰게 묶어 둔 단위고요. `status`는 `ok`, `unsupported`, `needs-download` 중 하나고, 이유도 같이 적혀 있어요.

목록에만 있는 것도 있어요. HyperFrames 레지스트리 전체(456개, 따로 내려받아야 돼요. 받고 나서 `hf-import` 돌리면 블록마다 장면으로 바꿔 주고, 안 되는 건 이유를 적어 줘요), 그리고 Remocn 컴포넌트랑 remotion-bits(내 프로젝트에 설치하고 custom 장면으로 부르시면 돼요).

## 내 장면

장면은 카탈로그 항목이랑 똑같은 props를 받는 React 컴포넌트예요. 글자는 잘리지 않게 안전 영역 `r` 안에 넣어 주시고요, 그림은 화면 전체를 다 쓰셔도 돼요.

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

`lf`는 그 박자의 컷부터 센 프레임이고, `dur`는 다음 컷까지 남은 프레임이에요. `st`는 스타일, `u`는 배율(짧은 변 1080 px가 1), `tall`은 9:16일 때 참이에요. 모든 움직임이 프레임 값만으로 계산돼야 하거든요. 그래서 현재 시각이나 `Math.random()`은 쓰시면 안 돼요.

2강 [connect-ai-video-motion](https://github.com/wonseokjung/connect-ai-video-motion)(내가 말하는 영상 위에 모션그래픽 얹기)용으로 만든 그래픽도 같은 props라서 그대로 돌아가요. 그 밖에 `{"kind": "hyperframes", "src": "./block.html"}`, `{"kind": "lottie", "src": "./anim.json"}`도 되고요, 다른 도구(Manim, Motion Canvas, Blender, 화면 녹화)로 만든 컷은 `{"kind": "clip", "src": "./made-elsewhere.mp4"}`로 넣으시면 돼요.

## 내 목소리

`<프로젝트>/input/`에 `voice.wav`랑 `voice.srt`(아니면 `.vtt`, 아니면 단어별 시간이 든 `voice.words.json` = `[{"word", "start", "end"}]`)를 같이 넣어 주세요.

```json
{"id": "swap", "at": {"text": "빨간색으로", "near": 21.0}, "say": "you just swap the code for black to red,",
 "kind": "remotion/code-swap", "code": "const video = {\n  screen: \"black\",\n};", "from": "black", "to": "red",
 "cues": {"swap": {"text": "빨간색으로", "near": 21.0}}}
```

영상 길이는 목소리 길이를 따라가요. 전환은 컷 가운데에 놓이기 때문에, 전환을 넣어도 컷이랑 목소리가 안 밀려요. 이 키트는 아직 목소리에서 단어별 시간을 뽑지는 않아요(맨 아래 '앞으로 할 것'에 있어요). 자막이나 단어별 시간을 만들어 주는 도구라면 뭐든 같이 쓰시면 돼요.

## 명령

```
npx connect-ai-motion demo                 내장 예제 (--ko: 한국어 예제)
npx connect-ai-motion <script.md>          내 대본: 옆에 <script>-motion/ 을 만들고 전부 실행
npx connect-ai-motion new [폴더]            채워 넣을 빈 프로젝트
npx connect-ai-motion draft <대본> [폴더]
npx connect-ai-motion check [폴더]          --short 9:16 도 검사, --measure out/film.mp4 도 봄
npx connect-ai-motion sheet [폴더]          스틸만: 박자마다 한 장
npx connect-ai-motion run [폴더]            검사, 렌더, 영상 검사   --short  --square  --only <박자>  --seconds 1  --force
npx connect-ai-motion preview [폴더]        Remotion Studio
npx connect-ai-motion catalog              --lead picture  --use chart  --role bg  --props  --json
npx connect-ai-motion gallery [폴더]        카탈로그 자체를 영상으로   --role scene | bg | transition  --source remotion  --sheet  --clips
npx connect-ai-motion hf-import <폴더>      HyperFrames 블록을 장면으로
npx connect-ai-motion doctor
npx connect-ai-motion install-skill        --agent claude | codex | antigravity | cursor   (remove-skill 로 뺌)
```

프로젝트는 폴더 하나예요. `script.md`, `storyboard.json`, `my-info.json`, `input/`(목소리, 자막, 내 파일), `out/`(영상, 시트, `report.md`) 이렇게 들어가요. 스타일은 `connect`(검정이랑 골드), `night`, `paper` 세 가지가 있어요.

소리도 넣을 수 있어요. `"sound": "tones"`를 넣으시면 컷이 바뀔 때마다 코드로 만든 부드러운 톤이 하나씩 들어가거든요. 샘플도 안 쓰고 따로 내려받는 것도 없어요. 기본은 꺼져 있고요.

## 앞으로 할 것

- 녹음한 목소리에서 단어별 시간을 내 컴퓨터에서 뽑기(`@remotion/install-whisper-cpp`로 whisper.cpp를 쓰고, 모델은 직접 골라서 내려받는 방식)
- 음악 박자에 맞춘 컷
- HyperFrames 레지스트리를 한 번에 가져오기
- 2강 그래픽 여러 개를 한 화면에 같이 올리는 무대 장면

## 강의

비주얼 바이브코딩은 강의마다 여러분들의 AI 에이전트한테 스킬을 하나씩 드려요. AI 에이전트를 한 명씩 만들어 가는 거예요. 2강은 [connect-ai-video-motion](https://github.com/wonseokjung/connect-ai-video-motion)(내 영상 위에 모션그래픽)이고요, 3강이 바로 이 도구(찍은 영상 없이 모션그래픽)예요.

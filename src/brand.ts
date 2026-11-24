// CONNECT AI LAB look: black x gold base, thin sans, subject colours on top.
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadFile} from '@remotion/fonts';

const inter = loadFont('normal', {weights: ['200', '300', '400', '500', '800'], subsets: ['latin']});

// Inter has no Korean / Japanese letters: the system fonts after it take over for those.
// "Brand Font" is your own font file when the storyboard names one ("font": "input/MyFont.ttf"); without it the
// browser skips that name and Inter is used.
export const BRAND_FONT = 'CAIM Brand Font';
export const FONT = `"${BRAND_FONT}", ${inter.fontFamily}, "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Hiragino Sans", sans-serif`;
// scenes measure text to fit it: nothing may be measured before the font is really there
export const fontsReady: Promise<unknown> = inter.waitUntilDone();
export const loadBrandFont = (url: string) => loadFile({family: BRAND_FONT, url, weight: '100 900'});
export const MONO = '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

export const C = {
  black: '#0B0A09',
  ink: '#EBE2D2',
  gold: '#D6892A',
  goldHi: '#F2B45A',
  dim: 'rgba(235,226,210,0.55)',
  rule: 'rgba(214,137,42,0.55)',
};

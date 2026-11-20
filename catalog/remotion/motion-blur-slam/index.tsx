// Word with a trail (@remotion/motion-blur Trail).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Trail} from '@remotion/motion-blur';
import {Box, OUT, SceneProps, caps, fit, hueOf, k01, type} from '../../../src/catalog/ui';

const Fly: React.FC<{w: number; h: number; text: string; fs: number; st: any; color: string; lead: number}> = ({w, h, text, fs, st, color, lead}) => {
  const f = useCurrentFrame() - lead; // Trail draws this again at earlier frames, so it must read the frame itself
  const k = k01(f, 0, 13, OUT);
  return <div style={{position: 'absolute', left: (1 - k) * w * 1.1, top: (h - fs * 1.12) / 2, width: w, textAlign: 'center', ...type(st, fs, color)}}>{text}</div>;
};

const MotionBlurSlam: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const sub = String(it.sub || '').toUpperCase();
  const fs = fit(text, r[2] * 0.96, r[3] * (tall ? 0.2 : 0.5), st.weight, st.tracking);
  const frame = useCurrentFrame();
  const lead = frame - lf;
  return (
    <Box r={r} style={{overflow: 'visible'}}>
      <Trail layers={9} lagInFrames={0.7} trailOpacity={0.5}>
        <Fly w={r[2]} h={r[3]} text={text} fs={fs} st={st} color={hueOf(it, ink)} lead={lead} />
      </Trail>
      <div style={{position: 'absolute', left: 0, top: r[3] / 2 + fs * 0.66, width: r[2] * k01(lf, 9, 24), height: Math.max(1.5, 2 * u), background: st.accent}} />
      {sub && <div style={{position: 'absolute', left: 0, right: 0, top: r[3] / 2 + fs * 0.66 + 26 * u, textAlign: 'center', ...caps(st, 28 * u, st.dim), opacity: k01(lf, 16, 28)}}>{sub}</div>}
    </Box>
  );
};
export default MotionBlurSlam;

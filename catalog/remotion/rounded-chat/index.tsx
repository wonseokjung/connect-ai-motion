// Ask and answer: two bubbles whose outline hugs each line (@remotion/rounded-text-box).
import React from 'react';
import {createRoundedTextBox} from '@remotion/rounded-text-box';
import {Box, SNAP, SceneProps, balance, cueAt, fit, hueOf, k01, measure, type} from '../../../src/catalog/ui';

const Bubble: React.FC<{text: string; x: number; y: number; w: number; h: number; right: boolean; fill: string; ink: string; st: any; k: number}> = ({text, x, y, w, h, right, fill, ink, st, k}) => {
  const lines = balance(text, text.split(/\s+/).length > 3 ? 2 : 1);
  const longest = lines.reduce((a, b) => (a.length > b.length ? a : b));
  const fs = Math.min(fit(longest, w * 0.86, h / (lines.length * 1.5), 300, st.tracking), h / (lines.length * 1.5));
  const ms = lines.map((l) => ({width: measure(l, fs, 300, st.tracking) * 1.04 + fs * 0.1, height: fs * 1.42}));
  const box = createRoundedTextBox({textMeasurements: ms, textAlign: right ? 'right' : 'left', horizontalPadding: fs * 0.55, borderRadius: fs * 0.5});
  const bw = box.boundingBox.width, bh = box.boundingBox.height;
  const left = right ? x + w - bw : x;
  return (
    <div style={{position: 'absolute', left, top: y, width: bw, height: bh, opacity: Math.min(1, k * 2.5), transform: `translateY(${(1 - k) * fs * 0.4}px) scale(${0.92 + 0.08 * k})`, transformOrigin: right ? '100% 100%' : '0 100%'}}>
      <svg width={bw} height={bh} viewBox={`${box.boundingBox.x1} ${box.boundingBox.y1} ${bw} ${bh}`} style={{position: 'absolute', overflow: 'visible'}}><path d={box.d} fill={fill} /></svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: bw}}>
        {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink, 300), height: fs * 1.42, lineHeight: `${fs * 1.42}px`, textAlign: right ? 'right' : 'left', padding: `0 ${fs * 0.55}px`}}>{l}</div>)}
      </div>
    </div>
  );
};

const RoundedChat: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const ask = String(it.text || ''), ans = String(it.sub || '');
  const col = hueOf(it, '#4C8CC6');
  const at = cueAt(it, 'answer', Math.round(dur * 0.45));
  const w = r[2] * (tall ? 0.92 : 0.6), h = r[3] * (tall ? 0.2 : 0.32);
  const dots = lf >= at - 16 && lf < at;
  return (
    <Box r={r}>
      <Bubble text={ask} x={0} y={r[3] * (tall ? 0.24 : 0.12)} w={w} h={h} right={false} fill="rgba(235,226,210,0.12)" ink={ink} st={st} k={k01(lf, 0, 14, SNAP)} />
      {dots && (
        <div style={{position: 'absolute', right: 0, top: r[3] * (tall ? 0.52 : 0.6), display: 'flex', gap: 12 * u}}>
          {[0, 1, 2].map((i) => <div key={i} style={{width: 16 * u, height: 16 * u, borderRadius: 16 * u, background: col, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((lf - i * 3) / 2.2))}} />)}
        </div>
      )}
      <Bubble text={ans} x={r[2] - w} y={r[3] * (tall ? 0.5 : 0.54)} w={w} h={h} right fill={col} ink="#FFFFFF" st={st} k={k01(lf, at, at + 14, SNAP)} />
    </Box>
  );
};
export default RoundedChat;

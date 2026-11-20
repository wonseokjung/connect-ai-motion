// Prompt and click: typed sentence, a macOS cursor clicks, the answer arrives (@remotion/mac-cursors).
import React from 'react';
import {MacOSCursor} from '@remotion/mac-cursors';
import {Box, SNAP, SceneProps, caps, cueAt, fit, hexA, k01, type} from '../../../src/catalog/ui';

const CursorPrompt: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, tall}) => {
  const text = String(it.text || '');
  const answer = String(it.sub || '');
  const click = cueAt(it, 'click', Math.round(dur * 0.55));
  const bw = r[2] * (tall ? 1 : 0.9), bh = (tall ? 170 : 200) * u, bx = (r[2] - bw) / 2, by = r[3] * 0.5 - bh * 0.8;
  const btn = bh * 0.56;
  const fs = fit(text, bw - btn - bh * 0.9, bh * 0.36, 300, st.tracking);
  const typeEnd = Math.max(10, click - 22);
  const shown = text.slice(0, Math.floor(k01(lf, 6, typeEnd, (t) => t) * text.length));
  const move = k01(lf, typeEnd - 6, click - 2);
  const pressed = lf >= click && lf < click + 5;
  const sent = k01(lf, click, click + 10);
  const tx = bx + bw - bh * 0.22 - btn / 2, ty = by + bh / 2;
  const cx = r[2] * 0.9 + (tx - r[2] * 0.9) * move, cy = r[3] * 0.98 + (ty + btn * 0.1 - r[3] * 0.98) * move;
  const ak = k01(lf, click + 8, click + 22, SNAP);
  const afs = fit(answer, bw * 0.6, 84 * u, 300, st.tracking);
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, borderRadius: bh / 2, background: st.card, border: `${Math.max(1, 1.5 * u)}px solid ${hexA(st.accent, 0.35 + 0.4 * sent)}`, opacity: k01(lf, 0, 10), transform: `translateY(${(1 - k01(lf, 0, 14)) * 20 * u}px)`}}>
        <div style={{position: 'absolute', left: bh * 0.42, top: (bh - fs * 1.2) / 2, ...type(st, fs, ink, 300)}}>
          {shown}
          <span style={{display: 'inline-block', width: Math.max(2, 3 * u), height: fs * 0.95, marginLeft: 4 * u, verticalAlign: 'text-bottom', background: st.accentHi, opacity: lf < click && Math.floor(lf / 8) % 2 === 0 ? 1 : lf < typeEnd ? 1 : 0}} />
        </div>
        <div style={{position: 'absolute', left: bw - bh * 0.22 - btn, top: (bh - btn) / 2, width: btn, height: btn, borderRadius: btn, background: sent > 0 ? st.accent : hexA(st.accent, 0.2), border: `${Math.max(1, 1.5 * u)}px solid ${st.accent}`, transform: `scale(${pressed ? 0.9 : 1})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {it.label ? <span style={{...caps(st, btn * 0.2, sent > 0.5 ? st.bg : ink)}}>{String(it.label)}</span> : (
            <svg width={btn * 0.44} height={btn * 0.44} viewBox="0 0 24 24"><path d="M12 20 V5 M5 12 L12 5 L19 12" fill="none" stroke={sent > 0.5 ? st.bg : ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </div>
      </div>
      {answer && (
        <div style={{position: 'absolute', left: bx + bh * 0.3, top: by + bh + 44 * u, display: 'flex', alignItems: 'center', gap: 20 * u, opacity: Math.min(1, ak * 2), transform: `scale(${0.9 + 0.1 * ak})`, transformOrigin: '0 50%'}}>
          <svg width={afs * 0.8} height={afs * 0.8} viewBox="0 0 24 24"><circle cx={12} cy={12} r={10.5} fill="none" stroke={st.accent} strokeWidth={1.4} /><path d="M7 12.5 L10.5 16 L17 9" fill="none" stroke={st.accentHi} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{...type(st, afs, ink, 300)}}>{answer}</div>
        </div>
      )}
      <div style={{position: 'absolute', left: cx, top: cy, transform: `scale(${Math.max(1.6, 3 * u) * (pressed ? 0.9 : 1)})`, transformOrigin: '0 0', opacity: k01(lf, typeEnd - 8, typeEnd - 2) * (1 - k01(lf, click + 14, click + 24))}}>
        <MacOSCursor cursor={move > 0.85 ? 'pointer' : 'default'} />
      </div>
    </Box>
  );
};
export default CursorPrompt;

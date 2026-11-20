// Any line drawing: your SVG paths draw themselves one stroke after another, then fill in softly and the
// finished drawing floats. Bring an icon, a logo you own, a diagram, a sketch. Ours.
import React from 'react';
import {Box, HUE, SceneProps, Words, caps, cueAt, fitLines, hexA, hueOf, k01, type} from '../../../src/catalog/ui';
import {Stage, num} from '../../../src/parts/Picture';

const DrawSvg: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W: FW, H: FH, tall}) => {
  const paths: {d: string; color: string | null; fill: boolean}[] = (Array.isArray(it.paths) ? it.paths : []).map((p: any) => (typeof p === 'string' ? {d: p, color: null, fill: true} : {d: String(p?.d || ''), color: p?.color ? HUE[p.color] || String(p.color) : null, fill: p?.fill !== false})).filter((p: any) => p.d);
  const n = Math.max(1, paths.length);
  const vb = String(it.viewBox || '0 0 100 100').split(/[\s,]+/).map((v) => num(v));
  const [vx, vy, vw, vh] = [vb[0] || 0, vb[1] || 0, vb[2] || 100, vb[3] || 100];
  const col = hueOf(it, HUE.sky);
  const text = String(it.text || ''), sub = String(it.sub || '');
  const W = r[2], H = r[3];
  const aw = text ? (tall ? W : W * 0.6) : W, ah = text ? (tall ? H * 0.62 : H) : H;
  const s = Math.min((aw * 0.96) / vw, (ah * 0.86) / vh);
  const dw = vw * s, dh = vh * s;
  const ox = (aw - dw) / 2, oy = (ah - dh) / 2;
  const span = dur * 0.6, each = Math.max(10, (span / n) * 1.5);
  const doneK = k01(lf, span + each * 0.3, span + each * 0.3 + 16);
  const fy = Math.sin(lf / 38) * 7 * u * doneK, rot = Math.sin(lf / 86) * 0.9 * doneK;
  const sw = (Math.max(3, 5.5 * u)) / s;
  const tw = tall ? W : W * 0.36, tx = tall ? 0 : W * 0.64;
  const {fs, lines} = fitLines(text, tw, tall ? H * 0.2 : H * 0.42, 3, st.weight, st.tracking);
  const ty = tall ? ah + 10 * u : (H - lines.length * fs * 1.12) / 2 - (sub ? 24 * u : 0);
  return (
    <>
      <Stage it={it} W={FW} H={FH} d="slate" glow={col} lf={lf} x={tall || !text ? 50 : 34} y={tall ? 40 : 52} strength={0.18} />
      <Box r={r}>
        <div style={{position: 'absolute', left: ox + dw * 0.14, top: oy + dh + 26 * u, width: dw * 0.72, height: 30 * u, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', filter: `blur(${14 * u}px)`, opacity: k01(lf, 0, 20), transform: `scaleX(${1 - fy / (90 * u)})`}} />
        <svg width={dw} height={dh} viewBox={`${vx} ${vy} ${vw} ${vh}`} style={{position: 'absolute', left: ox, top: oy, overflow: 'visible', transform: `translateY(${fy}px) rotate(${rot}deg)`}}>
          {paths.map((p, i) => {
            const f = (i / n) * span;
            const k = k01(lf, f, f + each, (t) => t * t * (3 - 2 * t));
            const c = p.color || (i === 0 ? ink : i % 3 === 1 ? col : ink);
            const closed = /z\s*$/i.test(p.d);
            return (
              <g key={i}>
                {closed && p.fill && <path d={p.d} fill={p.color || col} fillOpacity={0.13 * doneK} />}
                <path d={p.d} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} opacity={k > 0 ? 1 : 0} />
              </g>
            );
          })}
        </svg>
        {text && (
          <div style={{position: 'absolute', left: tx, top: ty, width: tw, textAlign: tall ? 'center' : 'left'}}>
            {sub && <div style={{...caps(st, 26 * u, hexA(col, 0.95)), marginBottom: 18 * u, opacity: k01(lf, cueAt(it, 'words', 8), cueAt(it, 'words', 8) + 12)}}>{sub}</div>}
            {lines.map((l, i) => <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={cueAt(it, 'words', 8) + i * 6} /></div>)}
          </div>
        )}
      </Box>
    </>
  );
};
export default DrawSvg;

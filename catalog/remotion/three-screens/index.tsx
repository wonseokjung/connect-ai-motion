// Screens in space: your stills hang as panels at different depths and the camera glides past them
// (@remotion/three). A wall of work you travel along.
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Redraw} from '../../../src/parts/Redraw';
import {Box, SceneProps, Words, caps, fitLines, hueOf, k01, media, mix, type} from '../../../src/catalog/ui';

const DEPTH = [0, -1.7, -0.5, -2.1, -0.2, -1.4];
const OFF = [0.12, -0.34, 0.3, -0.18, 0.26, -0.3];

const ThreeScreens: React.FC<SceneProps> = ({it, r, lf, dur, st, u, W, H, tall}) => {
  const files: any[] = (Array.isArray(it.images) ? it.images : []).slice(0, 6);
  const urls = files.map((x) => media(x));
  const text = String(it.text || ''), sub = String(it.sub || '');
  const col = hueOf(it, st.accentHi);
  const [tex, setTex] = useState<THREE.Texture[] | null>(null);
  const [handle] = useState(() => delayRender('three-screens: loading pictures', {timeoutInMilliseconds: 60000}));
  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    Promise.all(urls.map((url) => new Promise<THREE.Texture>((ok, no) => loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; ok(t); }, undefined, no)))).then(
      (ts) => {
        if (alive) setTex(ts);
      },
      (e) => {
        console.error('three-screens: could not load a picture', e);
        continueRender(handle);
      },
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join('|')]);
  // the frame is taken only after the pictures are in the scene and painted (two paints; 2 s at most if the tab does not paint)
  useEffect(() => {
    if (!tex) return;
    let done = false;
    const go = () => { if (!done) { done = true; continueRender(handle); } };
    requestAnimationFrame(() => requestAnimationFrame(go));
    const t = setTimeout(go, 2000);
    return () => { clearTimeout(t); go(); };
  }, [tex, handle]);
  const n = Math.max(1, urls.length);
  const pw = tall ? 2.5 : 3.3, step = tall ? 2.0 : 3.25;
  const fov = tall ? 50 : 40, camZ = tall ? 5.4 : 4.3;
  const p = Math.max(0, Math.min(1, (lf + 8) / (dur + 16)));
  const span = ((n - 1) * step) / 2;
  const travel = mix(-span * 0.78, span * 0.78, p) * (it.reverse ? -1 : 1);
  const {fs, lines} = fitLines(text || 'X', r[2] * (tall ? 1 : 0.6), r[3] * 0.16, 2, st.weight, st.tracking);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <ThreeCanvas width={W} height={H} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} camera={{position: [0, 0, camZ], fov}}>
        <fog attach="fog" args={[st.bg, camZ + 0.5, camZ + 6.5]} />
        <group position={tall ? [0, travel, 0] : [-travel, 0, 0]} rotation={tall ? [0, 0.16, 0] : [0, -0.2, 0]}>
          {tex && tex.map((t, i) => {
            const img = t.image as {width: number; height: number};
            const ph = (pw * (img?.height || 9)) / (img?.width || 16);
            const along = (i - (n - 1) / 2) * step;
            const k = k01(lf, i * 3, i * 3 + 22);
            const near = 1 - Math.min(1, Math.abs(along - travel * (tall ? -1 : 1)) / (step * 1.6));
            const shadeK = 0.42 + 0.58 * near;
            const pos: [number, number, number] = tall ? [OFF[i] * 0.8, -along + (1 - k) * -0.7, DEPTH[i]] : [along, OFF[i] + (1 - k) * -0.7, DEPTH[i]];
            return (
              <group key={i} position={pos} rotation={tall ? [0, 0, 0] : [0, 0.12 - along * 0.035, 0]}>
                <mesh position={[0, 0, -0.012]}>
                  <planeGeometry args={[pw + 0.07, ph + 0.07]} />
                  <meshBasicMaterial color={near > 0.6 ? col : '#EBE2D2'} transparent opacity={k * (near > 0.6 ? 0.9 : 0.28)} />
                </mesh>
                <mesh>
                  <planeGeometry args={[pw, ph]} />
                  <meshBasicMaterial map={t} color={new THREE.Color(shadeK, shadeK, shadeK)} transparent opacity={k} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
        </group>
        <Redraw when={tex} />
      </ThreeCanvas>
      {(text || sub) && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', background: 'linear-gradient(0deg, rgba(8,7,6,0.86) 0%, rgba(8,7,6,0.45) 45%, transparent 100%)'}} />}
      {(text || sub) && (
        <Box r={r}>
          <div style={{position: 'absolute', left: 0, bottom: tall ? r[3] * 0.02 : 0}}>
            {sub && <div style={{...caps(st, 26 * u, col), marginBottom: 14 * u, opacity: k01(lf, 8, 20)}}>{sub}</div>}
            {text && lines.map((l, i) => <div key={i} style={{...type(st, fs, '#F6F1E7')}}><Words text={l} lf={lf} start={10 + i * 6} /></div>)}
          </div>
        </Box>
      )}
    </div>
  );
};
export default ThreeScreens;

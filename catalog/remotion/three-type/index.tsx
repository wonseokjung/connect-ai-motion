// 3D type: a word as real extruded letters that stand up one by one and turn (@remotion/three, three.js TextGeometry).
// The typeface is Droid Sans Bold from three/examples/fonts (Apache-2.0). Latin letters, digits and common signs.
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
// @ts-ignore: a JSON file (the bundler reads it; this project does not turn on resolveJsonModule)
import droid from 'three/examples/fonts/droid/droid_sans_bold.typeface.json';
import {Box, INOUT, SceneProps, balance, caps, cueAt, fit, hueOf, k01, mix} from '../../../src/catalog/ui';

let FONT3D: any = null;
const font = () => (FONT3D ||= new FontLoader().parse(droid as any));
const GEO = new Map<string, THREE.BufferGeometry>();
const glyph = (ch: string) => {
  if (!GEO.has(ch)) GEO.set(ch, new TextGeometry(ch, {font: font(), size: 1, depth: 0.24, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.024, bevelSize: 0.016, bevelSegments: 3}));
  return GEO.get(ch)!;
};
const advance = (ch: string) => {
  const d = font().data;
  const g = d.glyphs[ch] || d.glyphs['?'];
  return (g ? g.ha : d.resolution * 0.6) / d.resolution;
};

const ThreeType: React.FC<SceneProps> = ({it, r, lf, dur, st, u, W, H, tall}) => {
  const text = String(it.text || ''), sub = String(it.sub || '');
  const col = hueOf(it, st.accentHi);
  const hi = String(it.hi || '').toLowerCase().split(/\s+/).filter(Boolean);
  const rows = useMemo(() => (text.includes('\n') ? text.split('\n') : balance(text, tall ? 3 : text.length > 14 ? 2 : 1)), [text, tall]);
  const LH = 1.22;
  const letters = useMemo(() => {
    const d = font().data;
    const out: {ch: string; x: number; y: number; on: boolean}[] = [];
    let width = 0;
    const widths = rows.map((row) => [...row].reduce((a, ch) => a + advance(ch), 0));
    width = Math.max(0.1, ...widths);
    rows.forEach((row, j) => {
      let x = -widths[j] / 2;
      const y = ((rows.length - 1) / 2 - j) * LH - 0.36;
      let word = '';
      const chars = [...row];
      chars.forEach((ch, i) => {
        if (i === 0 || chars[i - 1] === ' ') word = row.slice(i).split(' ')[0].toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        if (ch !== ' ' && d.glyphs[ch]) out.push({ch, x, y, on: hi.includes(word)});
        x += advance(ch);
      });
    });
    return {out, width, height: rows.length * LH};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.join('|'), hi.join('|')]);
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({color: st.accent, roughness: 0.4, metalness: 0.55});
    return {
      plain: [new THREE.MeshStandardMaterial({color: '#EBE2D2', roughness: 0.5, metalness: 0.08}), side],
      on: [new THREE.MeshStandardMaterial({color: col, roughness: 0.45, metalness: 0.1}), side],
    };
  }, [col, st.accent]);
  const fov = tall ? 46 : 30, dist = 10;
  const visH = 2 * Math.tan((fov * Math.PI) / 360) * dist, visW = (visH * W) / H;
  const s = Math.min((visW * (tall ? 0.86 : 0.8)) / letters.width, (visH * (tall ? 0.4 : 0.56)) / letters.height);
  const turn = cueAt(it, 'turn', Math.round(dur * 0.55));
  const kIn = k01(lf, 0, 50), kT = k01(lf, turn, turn + 34, INOUT);
  const ry = mix(mix(-0.85, -0.34, kIn), 0.3, kT) + Math.sin(lf / 60) * 0.035;
  const fsSub = fit(sub.toUpperCase() || 'X', r[2] * 0.8, 30 * u, st.heavy, 0.24);
  // where the word ends on screen, so the small line sits right under it
  const lift = tall ? visH * 0.06 : sub ? visH * 0.03 : 0;
  const subY = H / 2 - (lift / visH) * H + ((letters.height * s) / visH) * H * 0.5 + 34 * u;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <ThreeCanvas width={W} height={H} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} camera={{position: [0, 0, dist], fov}}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 3.5, 6]} intensity={2.3} color="#fff6e8" />
        <pointLight position={[-6, -2.5, 4]} intensity={70} color="#F2B45A" />
        <pointLight position={[6, 3, -1.5]} intensity={90} color={col} />
        <group position={[0, lift, 0]} rotation={[0.1 + Math.sin(lf / 85) * 0.03, ry, 0]} scale={s}>
          {letters.out.map((l, i) => {
            const start = 2 + i * (letters.out.length > 14 ? 1.3 : 2.2);
            const k = k01(lf, start, start + 22);
            return (
              <group key={i} position={[l.x, l.y - (1 - k) * 0.35, (1 - k) * -0.4]} rotation={[(1 - k) * -1.5, 0, 0]} scale={[1, 1, 0.25 + 0.75 * k]}>
                <mesh geometry={glyph(l.ch)} material={l.on ? mats.on : mats.plain} visible={k > 0.001} />
              </group>
            );
          })}
        </group>
      </ThreeCanvas>
      {sub && (
        <Box r={[r[0], 0, r[2], H]}>
          <div style={{position: 'absolute', left: 0, right: 0, top: subY, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 * u, opacity: k01(lf, 22, 36)}}>
            <div style={{width: 34 * u * k01(lf, 22, 40), height: Math.max(1.5, 2 * u), background: st.accent}} />
            <div style={{...caps(st, fsSub, st.dim)}}>{sub}</div>
          </div>
        </Box>
      )}
    </div>
  );
};
export default ThreeType;

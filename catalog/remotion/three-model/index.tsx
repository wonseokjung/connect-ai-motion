// 3D model on a turntable: your .glb turns slowly under studio light (@remotion/three + three.js GLTFLoader).
// With the "shade" cue it starts as a wireframe on clay and the real material rises through it from the ground up.
import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Redraw} from '../../../src/parts/Redraw';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Box, INOUT, SceneProps, Words, caps, cueAt, fitLines, hueOf, k01, media, HUE, type} from '../../../src/catalog/ui';

type Built = {shaded: THREE.Object3D; clay: THREE.Object3D; wire: THREE.Object3D; scale: number; centre: THREE.Vector3; size: THREE.Vector3; cut: THREE.Plane; keep: THREE.Plane};

const build = (root: THREE.Object3D, colour: string): Built => {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const scale = 3.1 / Math.max(size.x, size.y * 1.2, size.z, 1e-6);
  const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0); // the finished part: below the line
  const keep = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // the wireframe part: above it
  const clayMat = new THREE.MeshStandardMaterial({color: '#3a342d', roughness: 0.9, metalness: 0, flatShading: true, clippingPlanes: [keep], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
  const wireMat = new THREE.MeshBasicMaterial({color: colour, wireframe: true, transparent: true, opacity: 0.92, clippingPlanes: [keep]});
  const copy = (mat: (m: THREE.Material) => THREE.Material) => {
    const o = root.clone(true);
    o.traverse((x) => {
      const mesh = x as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(mat) : mat(mesh.material);
    });
    return o;
  };
  const shaded = copy((m) => {
    const c = m.clone();
    c.clippingPlanes = [cut];
    return c;
  });
  return {shaded, clay: copy(() => clayMat), wire: copy(() => wireMat), scale, centre, size, cut, keep};
};

const ThreeModel: React.FC<SceneProps> = ({it, r, lf, dur, st, ink, u, W, H, tall}) => {
  const col = hueOf(it, HUE.teal);
  const text = String(it.text || ''), sub = String(it.sub || '');
  const has = !!(text || sub);
  const url = media(it.src);
  const [root, setRoot] = useState<THREE.Object3D | null>(null);
  const [handle] = useState(() => delayRender('three-model: loading the model', {timeoutInMilliseconds: 60000}));
  useEffect(() => {
    let alive = true;
    new GLTFLoader().load(
      url,
      (g) => {
        if (alive) setRoot(g.scene);
      },
      undefined,
      (e) => {
        console.error('three-model: could not load ' + String(it.src), e);
        continueRender(handle);
      },
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  // the frame is taken only after the model are in the scene and painted (two paints; 2 s at most if the tab does not paint)
  useEffect(() => {
    if (!root) return;
    let done = false;
    const go = () => { if (!done) { done = true; continueRender(handle); } };
    requestAnimationFrame(() => requestAnimationFrame(go));
    const t = setTimeout(go, 2000);
    return () => { clearTimeout(t); go(); };
  }, [root, handle]);
  const b = useMemo(() => (root ? build(root, col) : null), [root, col]);

  const shade = cueAt(it, 'shade', it.wire ? Math.round(dur * 0.45) : -10000);
  const ks = k01(lf, shade, shade + 20, INOUT);
  const kIn = k01(lf, 0, 40);
  const ground = -1.15;
  const mx = !tall && has ? 1.1 : 0, my = tall && has ? 0.95 : 0;
  const hgt = b ? b.size.y * b.scale : 2;
  const line = ground + my - 0.02 + (hgt + 0.06) * ks;
  if (b) {
    b.cut.constant = line;
    b.keep.constant = -line;
  }
  const {fs, lines} = fitLines(text || 'X', tall ? r[2] : r[2] * 0.4, tall ? r[3] * 0.13 : r[3] * 0.44, tall ? 2 : 3, st.weight, st.tracking);
  let n = 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: k01(lf, 0, 10)}}>
        <ThreeCanvas width={W} height={H} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} camera={{position: [0, 1.3, tall ? 7.6 : 7.0], fov: tall ? 44 : 30}} onCreated={({camera, gl}) => { camera.lookAt(0, tall ? 0.25 : 0.1, 0); gl.localClippingEnabled = true; }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 4]} intensity={2.6} color="#fff4e2" />
          <directionalLight position={[-4, 1.5, 2]} intensity={0.5} />
          <pointLight position={[-3.5, 2.6, -3]} intensity={70} color={col} />
          <group position={[mx, my, 0]}>
            <group rotation={[0, lf / 95 + (1 - kIn) * 1.5 - 0.5, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ground - 0.012, 0]}>
                <circleGeometry args={[2.1, 72]} />
                <meshStandardMaterial color="#17140f" roughness={0.75} metalness={0.2} />
              </mesh>
              {[2.1, 1.45].map((rad, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, ground - 0.008 + i * 0.002, 0]}>
                  <ringGeometry args={[rad - 0.012, rad, 96]} />
                  <meshBasicMaterial color={i ? '#EBE2D2' : col} transparent opacity={i ? 0.14 : 0.7} />
                </mesh>
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <mesh key={'t' + i} rotation={[-Math.PI / 2, 0, (i * Math.PI) / 4]} position={[Math.cos((i * Math.PI) / 4) * 1.78, ground - 0.006, -Math.sin((i * Math.PI) / 4) * 1.78]}>
                  <planeGeometry args={[0.22, 0.012]} />
                  <meshBasicMaterial color="#EBE2D2" transparent opacity={0.22} />
                </mesh>
              ))}
              {b && (
                <group scale={b.scale * (0.86 + 0.14 * kIn)} position={[-b.centre.x * b.scale, ground - (b.centre.y - b.size.y / 2) * b.scale, -b.centre.z * b.scale]}>
                  <primitive object={b.shaded} />
                  {ks < 1 && <primitive object={b.clay} />}
                  {ks < 1 && <primitive object={b.wire} />}
                </group>
              )}
            </group>
          </group>
          <Redraw when={b} />
        </ThreeCanvas>
      </div>
      {has && (
        <Box r={r}>
          <div style={tall ? {position: 'absolute', left: 0, right: 0, bottom: r[3] * 0.02, textAlign: 'center'} : {position: 'absolute', left: 0, top: (r[3] - lines.length * fs * 1.12) / 2 - (sub ? 24 * u : 0), width: r[2] * 0.42}}>
            {sub && <div style={{...caps(st, 26 * u, col), marginBottom: 18 * u, opacity: k01(lf, 10, 22)}}>{sub}</div>}
            {text && lines.map((l, i) => {
              const start = cueAt(it, 'words', 10) + n * 3;
              n += l.split(/\s+/).length;
              return <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={start} /></div>;
            })}
          </div>
        </Box>
      )}
    </div>
  );
};
export default ThreeModel;

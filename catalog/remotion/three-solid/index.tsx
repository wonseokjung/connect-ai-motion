// 3D solid: a faceted shape with bright edges, turning (@remotion/three).
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Box, SceneProps, Words, caps, fitLines, hueOf, k01, type} from '../../../src/catalog/ui';

const geometry = (shape: string) => {
  switch (shape) {
    case 'octa': return new THREE.OctahedronGeometry(1.5, 0);
    case 'box': return new THREE.BoxGeometry(2, 2, 2);
    case 'torus': return new THREE.TorusGeometry(1.2, 0.5, 10, 28);
    case 'knot': return new THREE.TorusKnotGeometry(1.0, 0.36, 90, 10);
    default: return new THREE.IcosahedronGeometry(1.55, 0);
  }
};

const ThreeSolid: React.FC<SceneProps> = ({it, r, lf, st, ink, u, tall}) => {
  const col = hueOf(it, st.accent);
  const geo = useMemo(() => geometry(String(it.shape || 'ico')), [it.shape]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 12), [geo]);
  const D = Math.round(tall ? Math.min(r[2] * 0.96, r[3] * 0.5) : Math.min(r[3], r[2] * 0.5));
  const k = k01(lf, 0, 40);
  const text = String(it.text || ''), sub = String(it.sub || '');
  const tw = tall ? r[2] : r[2] - D - 40 * u;
  const {fs, lines} = fitLines(text, tw, tall ? r[3] * 0.22 : r[3] * 0.5, 3, st.weight, st.tracking);
  const tx = tall ? 0 : D + 40 * u, ty = tall ? D + 20 * u : (r[3] - lines.length * fs * 1.12) / 2 - (sub ? 20 * u : 0);
  let n = 0;
  return (
    <Box r={r}>
      <div style={{position: 'absolute', left: tall ? (r[2] - D) / 2 : 0, top: tall ? 0 : (r[3] - D) / 2, width: D, height: D, opacity: k01(lf, 0, 14)}}>
        <ThreeCanvas width={D} height={D} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} camera={{position: [0, 0, 6.2], fov: 36}}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 4, 5]} intensity={2.4} />
          <pointLight position={[-4, -2, 3]} intensity={40} color={col} />
          <group rotation={[0.35 + Math.sin(lf / 70) * 0.12, lf / 80 + (1 - k) * 2.2, 0.1]} scale={0.7 + 0.3 * k}>
            <mesh geometry={geo}>
              <meshStandardMaterial color="#1b1611" metalness={0.5} roughness={0.42} flatShading />
            </mesh>
            <lineSegments geometry={edges}>
              <lineBasicMaterial color={col} />
            </lineSegments>
          </group>
        </ThreeCanvas>
      </div>
      <div style={{position: 'absolute', left: tx, top: ty, width: tw, textAlign: tall ? 'center' : 'left'}}>
        {lines.map((l, i) => {
          const start = 10 + n * 3;
          n += l.split(/\s+/).length;
          return <div key={i} style={{...type(st, fs, ink)}}><Words text={l} lf={lf} start={start} /></div>;
        })}
        {sub && <div style={{...caps(st, 28 * u, st.accentHi), marginTop: 22 * u, opacity: k01(lf, 22, 34)}}>{sub}</div>}
      </div>
    </Box>
  );
};
export default ThreeSolid;

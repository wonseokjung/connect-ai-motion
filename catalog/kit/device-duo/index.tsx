// Laptop and phone: the lid opens on your wide screenshot, then the phone slides in front with the tall one.
// A website and its app, one after the other. Ours.
import React from 'react';
import {Laptop, Phone} from '../../../src/parts/Devices';
import {SceneProps, caps, fit, hueOf, itemAt, itemText, itemsOf, k01, media, mix} from '../../../src/catalog/ui';

const DeviceDuo: React.FC<SceneProps> = ({it, r, lf, dur, st, u, fps, W, H, tall}) => {
  const items = itemsOf(it).slice(0, 2);
  const names = [0, 1].map((i) => (items[i] && typeof items[i] === 'object' ? itemText(items[i]) : typeof items[i] === 'string' ? items[i] : ''));
  const col = hueOf(it, st.accentHi);
  const f0 = itemAt(it, 0, 2, dur, fps) - 6, f1 = itemAt(it, 1, 2, dur, fps);
  const lw = tall ? W * 0.86 : W * 0.6;
  const lx = tall ? W * 0.07 : W * 0.1, ly = tall ? H * 0.17 : H * 0.11;
  const ph = tall ? H * 0.46 : H * 0.72, pw = (ph * 9) / 19.3;
  const px = tall ? W * 0.5 : W * 0.7, py = tall ? H * 0.35 : H * 0.17;
  const kL = k01(lf, f0, f0 + 26), kP = k01(lf, f1, f1 + 24);
  const pan = Math.max(0, Math.min(1, lf / Math.max(1, dur)));
  const fsN = 26 * u;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <div style={{position: 'absolute', left: lx, top: ly + Math.sin(lf / 50) * 5 * u + (1 - kL) * 30 * u, width: lw, height: lw * 0.68, opacity: k01(lf, f0, f0 + 8)}}>
        <Laptop w={lw} src={media(it.src)} file={String(it.src)} open={kL} pan={pan} />
        {names[0] && <div style={{position: 'absolute', left: 0, width: tall ? lw * 0.5 : lw, top: lw * 0.625 + lw * 0.028 + 30 * u, textAlign: 'center', ...caps(st, Math.min(fsN, fit(names[0].toUpperCase(), lw * (tall ? 0.46 : 0.8), fsN, st.heavy, 0.24)), st.dim), opacity: k01(lf, f0 + 16, f0 + 28)}}>{names[0]}</div>}
      </div>
      <div style={{position: 'absolute', left: px, top: py + Math.sin(lf / 38 + 1) * 7 * u, width: pw, height: ph, perspective: 1800 * u}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: pw, height: ph, opacity: k01(lf, f1, f1 + 7), transform: `translateX(${(1 - kP) * 170 * u}px) rotateY(${mix(-38, -12, kP)}deg) rotateZ(${mix(7, 2.5, kP)}deg)`}}>
          <Phone w={pw} h={ph} src={media(it.src2)} file={String(it.src2)} pan={pan} sheen={(lf - f1 - 12) / 30} edge="#5a5248" />
        </div>
        {names[1] && <div style={{position: 'absolute', left: -pw * 0.5, width: pw * 2, top: ph + 30 * u, textAlign: 'center', ...caps(st, Math.min(fsN, fit(names[1].toUpperCase(), pw * 1.9, fsN, st.heavy, 0.24)), col), opacity: k01(lf, f1 + 14, f1 + 26)}}>{names[1]}</div>}
      </div>
    </div>
  );
};
export default DeviceDuo;

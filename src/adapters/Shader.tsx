// Shader adapter: a preset of the `shaders` package (shaders.com, MIT, WebGPU) as a frame-locked layer.
// The preset renderer moves its clock by exactly `deltaSeconds` per renderFrame(), so each Remotion frame shows
// shader time = frame / fps, however fast or slow the render is. If a render tab jumps backwards, the renderer is
// rebuilt. We do not use `shaders/react` <Shader>: it runs on the wall clock and its bundle sends telemetry.
// If WebGPU is not there (old GPU, some CI machines), the layer stays empty and the style's plain colour shows.
import React, {useEffect, useRef, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {createRendererFromJSON} from 'shaders/core';

export type Preset = {components: {type: string; props?: Record<string, unknown>; children?: unknown[]}[]};
type R = ReturnType<typeof createRendererFromJSON>;

export const ShaderLayer: React.FC<{preset: Preset; w: number; h: number; timeScale?: number; opacity?: number}> = ({preset, w, h, timeScale = 1, opacity = 1}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<{r: R | null; t: number; ready: Promise<void> | null}>({r: null, t: 0, ready: null});
  const [fail, setFail] = useState(false);
  const key = JSON.stringify(preset);

  const build = () => {
    state.current.r?.dispose();
    const r = createRendererFromJSON(preset as never, {enablePerformanceTracking: false, forceFullFrameRate: true});
    r.setOnUnavailable(() => setFail(true));
    state.current = {r, t: 0, ready: r.initialize(canvas.current!)};
  };
  useEffect(() => () => state.current.r?.dispose(), []);

  useEffect(() => {
    if (fail) return;
    const h = delayRender(`shader frame ${frame}`, {timeoutInMilliseconds: 60000});
    (async () => {
      try {
        const target = (Math.max(0, frame) / fps) * timeScale;
        if (!state.current.r || target < state.current.t - 1e-6) build();
        await state.current.ready;
        await state.current.r!.renderFrame({deltaSeconds: target - state.current.t, waitForGpu: true});
        state.current.t = target;
      } catch {
        setFail(true);
      }
      continueRender(h);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, key, fail]);

  return <canvas ref={canvas} width={w} height={h} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, display: fail ? 'none' : 'block', opacity}} />;
};

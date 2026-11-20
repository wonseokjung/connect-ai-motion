// Style tokens. One block = the whole look. Pick one in storyboard.json ("style": "connect" | "night" | "paper"),
// or copy a block and change the colours. Names and colours are ours.

/** @type {Record<string, any>} */
export const STYLES = {
  // Default: our look. Near-black, thin ivory type, one gold accent, light grain.
  connect: {name: 'connect', weight: 200, heavy: 400, tracking: -0.02, bg: '#0B0A09', bg2: '#17130F', ink: '#EBE2D2', inkOnLight: '#14110E', dim: 'rgba(235,226,210,0.55)', faint: 'rgba(235,226,210,0.16)', accent: '#D6892A', accentHi: '#F2B45A', grain: 0.07, vignette: 0.5, radius: 14, card: 'rgba(235,226,210,0.045)', cardLine: 'rgba(235,226,210,0.14)'},
  // Night: deep teal-black, teal accent.
  night: {name: 'night', weight: 200, heavy: 400, tracking: -0.02, bg: '#07100F', bg2: '#0E1B1A', ink: '#E8F1EE', inkOnLight: '#0E1716', dim: 'rgba(232,241,238,0.55)', faint: 'rgba(232,241,238,0.16)', accent: '#3FB7A6', accentHi: '#7FE0D1', grain: 0.06, vignette: 0.5, radius: 14, card: 'rgba(232,241,238,0.05)', cardLine: 'rgba(232,241,238,0.14)'},
  // Paper: warm off-white, dark ink, for bright decks.
  paper: {name: 'paper', weight: 300, heavy: 500, tracking: -0.025, bg: '#F2ECE0', bg2: '#E7DFCF', ink: '#17130F', inkOnLight: '#17130F', dim: 'rgba(23,19,15,0.6)', faint: 'rgba(23,19,15,0.16)', accent: '#B56A14', accentHi: '#8A4E0B', grain: 0.05, vignette: 0.12, radius: 14, card: 'rgba(23,19,15,0.04)', cardLine: 'rgba(23,19,15,0.16)'},
};

export const getStyle = (name) => STYLES[name] || STYLES.connect;

// Timing numbers (frames at 30 fps) follow motionmaxxing (Apache-2.0, commit 8c8ec0f2a6f6):
// entry 12, opacity 6, blur 7, exit 13. Ease out when landing, accelerate when leaving.
export const TIMING = {enter: 12, opacity: 6, blur: 7, exit: 13};

// subject colours (2-3 per film, each tied to one meaning); gold stays the brand accent
export const HUE = {gold: '#D6892A', goldHi: '#F2B45A', ivory: '#EBE2D2', teal: '#3FB7A6', coral: '#E0605A', red: '#D8433B', blue: '#4C8CC6', violet: '#9B7BD8', leaf: '#7FB069', ink: '#0B0A09', black: '#17130F', white: '#F6F1E7', sky: '#7CC4E8', sand: '#D9C3A0', rose: '#D97B93', indigo: '#5B66C9', mint: '#8FD3B6', amber: '#FFB547'};

// stages: a picture scene may stand on its own dark ground instead of the film's background ("stage": "night").
// All of them sit next to the black x gold base; none is bright.
export const STAGE = {base: '#0B0A09', night: '#0A1018', deep: '#081312', wine: '#170D10', slate: '#12151A', moss: '#0E140E', plum: '#120E18', paper: '#F2ECE0'};

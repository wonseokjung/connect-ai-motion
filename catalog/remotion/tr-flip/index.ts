// Flip (@remotion/transitions). A transition item exports (W, H, line) => presentation.
import {flip} from '@remotion/transitions/flip';

export default (w: number, h: number, it: any) => flip({direction: it.direction || 'from-right', perspective: Math.max(w, h) * 1.2});

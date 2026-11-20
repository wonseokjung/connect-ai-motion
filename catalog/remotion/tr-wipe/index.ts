// Wipe (@remotion/transitions). A transition item exports (W, H, line) => presentation.
import {wipe} from '@remotion/transitions/wipe';

export default (w: number, h: number, it: any) => wipe({direction: it.direction || 'from-left'});

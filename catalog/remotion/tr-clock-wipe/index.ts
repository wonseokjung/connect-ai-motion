// Clock wipe (@remotion/transitions). A transition item exports (W, H, line) => presentation.
import {clockWipe} from '@remotion/transitions/clock-wipe';

export default (w: number, h: number, it: any) => clockWipe({width: w, height: h});

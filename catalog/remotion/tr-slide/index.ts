// Push (@remotion/transitions). A transition item exports (W, H, line) => presentation.
import {slide} from '@remotion/transitions/slide';

export default (w: number, h: number, it: any) => slide({direction: it.direction || 'from-right'});

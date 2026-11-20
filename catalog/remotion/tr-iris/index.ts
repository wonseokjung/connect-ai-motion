// Iris (@remotion/transitions). A transition item exports (W, H, line) => presentation.
import {iris} from '@remotion/transitions/iris';

export default (w: number, h: number, it: any) => iris({width: w, height: h});

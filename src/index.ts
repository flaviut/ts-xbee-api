import { ParsableFrame } from './lib/frame-parser';
import { BuildableFrame } from './lib/frame-builder';

export { ParsableFrame } from './lib/frame-parser';
export { BuildableFrame } from './lib/frame-builder';

export * as C from './lib/constants';

import { FRAME_TYPE as FrameType } from './lib/constants';
export { FRAME_TYPE as FrameType, FRAME_TYPES } from './lib/constants';

export type SpecificParsableFrame<FT extends FrameType> = Extract<
  ParsableFrame,
  { type: FT }
>;
export type SpecificBuildableFrame<FT extends FrameType> = Extract<
  BuildableFrame,
  { type: FT }
>;

export { ChecksumMismatchError, UnknownFrameType } from './lib/errors';

export { XBeeAPIOptions, XbeeParser, XbeeBuilder } from './lib/xbee-api';

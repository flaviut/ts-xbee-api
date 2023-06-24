import {ParsableFrame} from "./lib/frame-parser";
import {BuildableFrame} from "./lib/frame-builder";

export {ParsableFrame} from "./lib/frame-parser";
export {BuildableFrame} from "./lib/frame-builder";

export * as C from "./lib/constants";
import * as C from "./lib/constants";

export const FRAME_TYPES = C.FRAME_TYPES;

import {FrameType, AtCommand} from "./lib/xbee-api";

export {FrameType, AtCommand} from "./lib/xbee-api";

export type SpecificParsableFrame<FT extends FrameType> = Extract<
  ParsableFrame,
  { type: FT }
>;
export type SpecificBuildableFrame<FT extends FrameType> = Extract<
  BuildableFrame,
  { type: FT }
>;

export type {ChecksumMismatchError, UnknownFrameType} from "./lib/errors";

export {XBeeAPIOptions, XbeeParser, XbeeBuilder} from "./lib/xbee-api";

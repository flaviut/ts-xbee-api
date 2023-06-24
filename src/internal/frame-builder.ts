/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

import assert from "assert";
import BufferBuilder from "buffer-builder";

import * as C from "./constants";

type BufferConstructable = number[] | ArrayBuffer | Buffer | string;

// Appends data provided as Array, String, or Buffer
function appendData(data: BufferConstructable, builder: BufferBuilder): void {
  let buf: Buffer;

  if (Array.isArray(data)) {
    buf = Buffer.from(data);
  } else if (data instanceof ArrayBuffer) {
    buf = Buffer.from(data);
  } else if (Buffer.isBuffer(data)) {
    buf = Buffer.from(data);
  } else {
    buf = Buffer.from(data, "ascii");
  }

  builder.appendBuffer(buf);
}

type Uint8 = number;
type Uint16 = number;

function atCommandParser(
  frame:
    | {
        type: C.FRAME_TYPE.AT_COMMAND;
        /** sequence number of the frame */
        id?: Uint8;
        command: C.AT_COMMAND;
        commandParameter: BufferConstructable;
      }
    | {
        type: C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE;
        /** sequence number of the frame */
        id?: Uint8;
        command: C.AT_COMMAND;
        commandParameter: BufferConstructable;
      },
  builder: BufferBuilder
): void {
  builder.appendUInt8(frame.type);
  builder.appendUInt8(this.getFrameId(frame));
  builder.appendString(frame.command, "ascii");
  appendData(frame.commandParameter, builder);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function FrameBuilder() {
  return {
    frameId: 0,
    nextFrameId: function nextFrameId() {
      this.frameId ??= 1;
      this.frameId = this.frameId >= 0xff ? 1 : ++this.frameId;
      return this.frameId;
    },

    getFrameId: function getFrameId(frame) {
      assert(frame, "Frame parameter must be supplied");
      frame.id = frame.id || (frame.id !== 0 && this.nextFrameId()) || frame.id;
      return frame.id;
    },

    [C.FRAME_TYPE.AT_COMMAND]: atCommandParser,
    [C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE]: atCommandParser,

    [C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST]: function (
      frame: {
        type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST;
        /** sequence number of the frame */
        id?: Uint8;
        destination64?: BufferConstructable; // 64-bit, optional, default UNKNOWN_64
        destination16?: BufferConstructable; // 16-bit, optional, default UNKNOWN_16
        remoteCommandOptions?: number; // optional, 0x02 is default
        command: C.AT_COMMAND;
        commandParameter: BufferConstructable;
      },
      builder: BufferBuilder
    ) {
      builder.appendUInt8(frame.type);
      builder.appendUInt8(this.getFrameId(frame));
      builder.appendString(frame.destination64 || C.UNKNOWN_64, "hex");
      builder.appendString(frame.destination16 || C.UNKNOWN_16, "hex");
      builder.appendUInt8(frame.remoteCommandOptions || 0x02);
      builder.appendString(frame.command, "ascii");
      appendData(frame.commandParameter, builder);
    },

    [C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST]: function (
      frame: {
        // aka Extended Transmit Status
        type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST;
        /** sequence number of the frame */
        id?: Uint8;
        destination64?: BufferConstructable; // 64-bit
        destination16?: BufferConstructable; // 16-bit
        broadcastRadius?: Uint8;
        options?: Uint8;
        data: BufferConstructable;
      },
      builder: BufferBuilder
    ) {
      builder.appendUInt8(frame.type);
      builder.appendUInt8(this.getFrameId(frame));
      builder.appendString(frame.destination64 || C.UNKNOWN_64, "hex");
      builder.appendString(frame.destination16 || C.UNKNOWN_16, "hex");
      builder.appendUInt8(frame.broadcastRadius || 0x00);
      builder.appendUInt8(frame.options || 0x00);
      appendData(frame.data, builder);
    },

    [C.FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME]: function (
      frame: {
        type: C.FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME;
        /** sequence number of the frame */
        id?: Uint8;
        destination64?: BufferConstructable; // 64-bit, optional, default UNKNOWN_64
        destination16?: BufferConstructable; // 16-bit, optional, default UNKNOWN_16
        sourceEndpoint: Uint8;
        destinationEndpoint: Uint8;
        clusterId: Uint16 | BufferConstructable; // 16-bit
        profileId: Uint16 | BufferConstructable; // 16-bit
        broadcastRadius?: Uint8; // default 0
        options?: Uint8; // default 0
        data: BufferConstructable;
      },
      builder: BufferBuilder
    ) {
      builder.appendUInt8(frame.type);
      builder.appendUInt8(this.getFrameId(frame));
      builder.appendString(frame.destination64 || C.UNKNOWN_64, "hex");
      builder.appendString(frame.destination16 || C.UNKNOWN_16, "hex");
      builder.appendUInt8(frame.sourceEndpoint);
      builder.appendUInt8(frame.destinationEndpoint);

      if (typeof frame.clusterId === "number") {
        builder.appendUInt16BE(frame.clusterId, "hex");
      } else {
        builder.appendString(frame.clusterId, "hex");
      }

      if (typeof frame.profileId === "number") {
        builder.appendUInt16BE(frame.profileId, "hex");
      } else {
        builder.appendString(frame.profileId, "hex");
      }

      builder.appendUInt8(frame.broadcastRadius || 0x00);
      builder.appendUInt8(frame.options || 0x00);
      appendData(frame.data, builder);
    },

    [C.FRAME_TYPE.CREATE_SOURCE_ROUTE]: function (
      frame: {
        type: C.FRAME_TYPE.CREATE_SOURCE_ROUTE;
        /** sequence number of the frame */
        id?: Uint8;
        destination64: BufferConstructable; // 64-bit
        destination16: BufferConstructable; // 16-bit
        addresses: number[]; // max 30 addresses, 16 bit integer addresses
      },
      builder: BufferBuilder
    ) {
      builder.appendUInt8(frame.type);
      builder.appendUInt8(0); // Frame ID is always zero for this
      builder.appendString(frame.destination64, "hex");
      builder.appendString(frame.destination16, "hex");
      builder.appendUInt8(0); // Route command options always zero
      builder.appendUInt8(frame.addresses.length); // Number of hops
      for (let i = 0; i < frame.addresses.length; i++) {
        builder.appendUInt16BE(frame.addresses[i], "hex");
      }
    },

    [C.FRAME_TYPE.TX_REQUEST_64]: function (
      frame: {
        type: C.FRAME_TYPE.TX_REQUEST_64;
        /** sequence number of the frame */
        id?: Uint8;
        destination64?: BufferConstructable; // 64-bit
        options?: number; // 0x00 is default
        data: BufferConstructable;
      },
      builder: BufferBuilder
    ) {
      builder.appendUInt8(frame.type);
      builder.appendUInt8(this.getFrameId(frame));
      builder.appendString(frame.destination64 || C.UNKNOWN_64, "hex");
      builder.appendUInt8(frame.options || 0x00);
      appendData(frame.data, builder);
    },

    [C.FRAME_TYPE.TX_REQUEST_16]: function (
      frame: {
        type: C.FRAME_TYPE.TX_REQUEST_16;
        /** sequence number of the frame */
        id?: Uint8;
        destination16?: BufferConstructable; // 16-bit
        options?: number; // 0x00 is default
        data: BufferConstructable;
      },
      builder: BufferBuilder
    ) {
      builder.appendUInt8(frame.type);
      builder.appendUInt8(this.getFrameId(frame));
      builder.appendString(frame.destination16 || C.BROADCAST_16_XB, "hex");
      builder.appendUInt8(frame.options || 0x00);
      appendData(frame.data, builder);
    },

    [C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET]: function (
      frame: {
        type: C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET;
        sender64?: BufferConstructable; // 64-bit
        sender16?: BufferConstructable; // 16-bit
        receiveOptions?: Set<C.RECEIVE_OPTIONS>;
        data: BufferConstructable;
      },
      builder: BufferBuilder
    ) {
      builder.appendUInt8(frame.type);
      builder.appendString(frame.sender64 || C.UNKNOWN_64, "hex");
      builder.appendString(frame.sender16 || C.UNKNOWN_16, "hex");
      builder.appendUInt8(
        Array.from(frame.receiveOptions ?? []).reduce(
          (result: number, b) => result | b,
          0
        )
      );
      appendData(frame.data, builder);
    },
  } as const;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
type FrameBuilder = ReturnType<typeof FrameBuilder>;
export default FrameBuilder;

type NewOmit<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};
export type BuildableFrame = Parameters<
  FrameBuilder[keyof NewOmit<
    FrameBuilder,
    "frameId" | "nextFrameId" | "getFrameId"
  >]
>[0];

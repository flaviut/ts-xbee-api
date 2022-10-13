/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

import BufferBuilder from "buffer-builder";
import {
    BROADCAST_16_XB,
    FRAME_TYPE,
    SpecificXbeeFrameInput,
    UNKNOWN_16,
    UNKNOWN_64
} from "./constants";

export let frameId = 0

export const nextFrameId = () => {
    frameId = frameId >= 0xff ? 1 : ++frameId
    return frameId
}
const getFrameId = (frame: { id?: number }): number => {
    const id = frame.id ?? nextFrameId()
    return frame.id = id
}

// workaround https://github.com/microsoft/TypeScript/issues/17002
function isArray(arg: ReadonlyArray<any> | any): arg is ReadonlyArray<any> {
    return Array.isArray(arg)
}

// Appends data provided as Array, String, or Buffer
function appendData(data: string | Buffer | Uint8Array | ArrayBuffer | SharedArrayBuffer | ReadonlyArray<number>, builder: BufferBuilder) {
    let buf: Buffer

    if (isArray(data) || data instanceof Uint8Array) {
        buf = Buffer.from(data)
    } else if (Buffer.isBuffer(data) || data instanceof ArrayBuffer || data instanceof SharedArrayBuffer) {
        buf = Buffer.from(data)
    } else {
        buf = Buffer.from(data, 'ascii')
    }

    builder.appendBuffer(buf)
}

const atCommandBuilder = (frame: SpecificXbeeFrameInput<FRAME_TYPE.AT_COMMAND | FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE>, builder: BufferBuilder) => {
    builder.appendUInt8(frame.type)
    builder.appendUInt8(getFrameId(frame))
    builder.appendString(frame.command, 'ascii')
    appendData(frame.commandParameter, builder)
}

export const FrameBuilder: {
    [key in FRAME_TYPE]?: (frame: SpecificXbeeFrameInput<key>, builder: BufferBuilder) => void
} = {
    [FRAME_TYPE.AT_COMMAND]: atCommandBuilder,
    [FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE]: atCommandBuilder,

    [FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST]: (frame: SpecificXbeeFrameInput<FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST>, builder: BufferBuilder) => {
        builder.appendUInt8(frame.type)
        builder.appendUInt8(getFrameId(frame))
        builder.appendString(frame.destination64 || UNKNOWN_64, 'hex')
        builder.appendString(frame.destination16 || UNKNOWN_16, 'hex')
        builder.appendUInt8(frame.remoteCommandOptions || 0x02)
        builder.appendString(frame.command, 'ascii')
        appendData(frame.commandParameter, builder)
    },

    [FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST]: (frame: SpecificXbeeFrameInput<FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST>, builder: BufferBuilder) => {
        builder.appendUInt8(frame.type)
        builder.appendUInt8(getFrameId(frame))
        builder.appendString(frame.destination64 || UNKNOWN_64, 'hex')
        builder.appendString(frame.destination16 || UNKNOWN_16, 'hex')
        builder.appendUInt8(frame.broadcastRadius || 0x00)
        builder.appendUInt8(frame.options || 0x00)
        appendData(frame.data, builder)
    },

    [FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME]: (frame: SpecificXbeeFrameInput<FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME>, builder: BufferBuilder) => {
        builder.appendUInt8(frame.type)
        builder.appendUInt8(getFrameId(frame))
        builder.appendString(frame.destination64 || UNKNOWN_64, 'hex')
        builder.appendString(frame.destination16 || UNKNOWN_16, 'hex')
        builder.appendUInt8(frame.sourceEndpoint)
        builder.appendUInt8(frame.destinationEndpoint)

        if (typeof (frame.clusterId) === 'number') {
            builder.appendUInt16BE(frame.clusterId)
        } else {
            builder.appendString(frame.clusterId, 'hex')
        }

        if (typeof (frame.profileId) === 'number') {
            builder.appendUInt16BE(frame.profileId)
        } else {
            builder.appendString(frame.profileId, 'hex')
        }

        builder.appendUInt8(frame.broadcastRadius || 0x00)
        builder.appendUInt8(frame.options || 0x00)
        appendData(frame.data, builder)
    },

    [FRAME_TYPE.CREATE_SOURCE_ROUTE]: (frame: SpecificXbeeFrameInput<FRAME_TYPE.CREATE_SOURCE_ROUTE>, builder: BufferBuilder) => {
        builder.appendUInt8(frame.type)
        builder.appendUInt8(0) // Frame ID is always zero for this
        builder.appendString(frame.destination64, 'hex')
        builder.appendString(frame.destination16, 'hex')
        builder.appendUInt8(0) // Route command options always zero
        builder.appendUInt8(frame.addresses.length) // Number of hops
        frame.addresses.forEach(item => {
            builder.appendUInt16BE(item)
        });
    },

    [FRAME_TYPE.TX_REQUEST_64]: (frame: SpecificXbeeFrameInput<FRAME_TYPE.TX_REQUEST_64>, builder: BufferBuilder) => {
        builder.appendUInt8(frame.type)
        builder.appendUInt8(getFrameId(frame))
        builder.appendString(frame.destination64 || UNKNOWN_64, 'hex')
        builder.appendUInt8(frame.options || 0x00)
        appendData(frame.data, builder)
    },

    [FRAME_TYPE.TX_REQUEST_16]: (frame: SpecificXbeeFrameInput<FRAME_TYPE.TX_REQUEST_16>, builder: BufferBuilder) => {
        builder.appendUInt8(frame.type)
        builder.appendUInt8(getFrameId(frame))
        builder.appendString(frame.destination16 || BROADCAST_16_XB, 'hex')
        builder.appendUInt8(frame.options || 0x00)
        appendData(frame.data, builder)
    },
}

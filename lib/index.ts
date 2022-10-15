/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

import stream from "stream";
import assert from "assert";
import events from "events";
import BufferBuilder from "buffer-builder";
import BufferReader from "buffer-reader";
import TypedEmitter from "typed-emitter";

export * as C from './constants'
import * as C from './constants'
import frame_parser, {ParsableFrame} from './frame-parser'
import frame_builder, {BuildableFrame} from './frame-builder'
import {ChecksumMismatchError, FrameBuildingNotSupportedError} from "./errors";


export interface XBeeAPIOptions {
    /** 1 is default, 2 is with escaping (set ATAP=2) */
    api_mode: 1 | 2,
    /** This does nothing, yet! */
    module: "802.15.4" | "ZNet" | "ZigBee" | "Any",
    /** if set to true, only raw byte frames are emitted (after validation) but not parsed to objects. */
    raw_frames: boolean,
    /** If false, do not convert adc value to millivolt */
    convert_adc: boolean
    /** Set the value to convert adc value to millivolt */
    vref_adc: number,
    /** size of the package parser buffer. When receiving A LOT of packets, you might want to decrease this to a smaller value (but typically not less than 128) */
    parser_buffer_size: number,
    /** size of the package builder buffer. when sending A LOT of packets, you might want to decrease this to a smaller value (but typically not less than 128) */
    builder_buffer_size: number
    /** a logger object, used to print various information */
    logger: { log: (msg: string) => void, warn: (msg: string) => void, error: (msg: string) => void }
}

const DEFAULT_OPTIONS: XBeeAPIOptions = {
    raw_frames: false,
    api_mode: 1,
    module: "Any",
    convert_adc: true,
    vref_adc: 1200,
    parser_buffer_size: 512,
    builder_buffer_size: 512,
    logger: console,
};

type XBeeEvents = {
    error: (err: ChecksumMismatchError) => void,
    frame_object: (frame: ParsableFrame) => void,
    frame_raw: (frame: Buffer) => void,
}

export class XBeeAPI extends (events.EventEmitter as { new(): TypedEmitter<XBeeEvents> }) {
    readonly builder: stream.Transform;
    readonly parser: stream.Transform;
    readonly parseState: {
        buffer: Buffer;
        offset: number; // Offset in buffer
        length: number; // Packet Length
        total: number; // To test Checksum
        checksum: number; // Checksum byte
        b: number; // Working byte
        escape_next: boolean; // For escaping in AP=2
        waiting: boolean;
    }
    readonly options: XBeeAPIOptions;
    private escapeBuffer: undefined | Buffer;

    constructor(options: Partial<XBeeAPIOptions> = {}) {
        super();
        this.builder = new stream.Transform({objectMode: true});
        this.builder._transform = (frame, enc, cb) => {
            this.builder.push(this.buildFrame(frame));
            cb();
        }

        this.parser = new stream.Transform({objectMode: true});
        this.parser._transform = (chunk, enc, cb) => {
            this.parseRaw.call(this, chunk, enc, cb);
        }

        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };

        this.parseState = {
            buffer: Buffer.alloc(this.options.parser_buffer_size),
            offset: 0,
            length: 0,
            total: 0,
            checksum: 0x00,
            b: 0x00,
            escape_next: false,
            waiting: true
        };
    }


    escape(buffer) {
        if (this.escapeBuffer === undefined)
            this.escapeBuffer = Buffer.alloc(this.options.parser_buffer_size);

        let offset = 0;
        this.escapeBuffer.writeUInt8(buffer[0], offset++);
        for (let i = 1; i < buffer.length; i++) {
            if (C.ESCAPE_BYTES.indexOf(buffer[i]) > -1) {
                this.escapeBuffer.writeUInt8(C.ESCAPE, offset++);
                this.escapeBuffer.writeUInt8(buffer[i] ^ C.ESCAPE_WITH, offset++);
            } else {
                this.escapeBuffer.writeUInt8(buffer[i], offset++);
            }
        }

        return Buffer.from(this.escapeBuffer.slice(0, offset));
    }

    buildFrame(frame: BuildableFrame) {
        assert(frame, 'Frame parameter must be a frame object');

        let packet = Buffer.alloc(this.options.builder_buffer_size); // Packet buffer
        let payload = packet.slice(3); // Reference the buffer past the header
        let builder = new BufferBuilder(payload);

        if (!frame_builder[frame.type])
            throw new FrameBuildingNotSupportedError(frame.type);

        // Let the builder fill the payload
        frame_builder[frame.type]((frame as any), builder);

        // Calculate & Append Checksum
        let checksum = 0;
        for (let i = 0; i < builder.length; i++) checksum += payload[i];
        builder.appendUInt8(255 - (checksum % 256));

        // Get just the payload
        payload = payload.slice(0, builder.length);

        // Build the header at the start of the packet buffer
        builder = new BufferBuilder(packet);
        builder.appendUInt8(C.START_BYTE);
        builder.appendUInt16BE(payload.length - 1); // Sans checksum

        // Get the header and payload as one contiguous buffer
        packet = packet.slice(0, builder.length + payload.length);

        // Escape the packet, if needed
        return this.options.api_mode === 2 ? this.escape(packet) : packet;
    }

    // Note that this expects the whole frame to be escaped!
    parseFrame(rawFrame): ParsableFrame {
        // Trim the header and trailing checksum
        const reader = new BufferReader(rawFrame.slice(3, rawFrame.length - 1));

        const frame = {
            type: reader.nextUInt8() // Read Frame Type
        };

        // Frame type specific parsing.
        frame_parser[frame.type](frame, reader, this.options);

        return frame as any;
    }

    canParse(buffer) {
        const type = buffer.readUInt8(3);
        return type in frame_parser;
    }

    canBuild(type) {
        return type in frame_builder;
    }

    nextFrameId() {
        return frame_builder.nextFrameId();
    }

    newStream(): stream.Transform { // Transform stream for Node Serialport 5.0.0+
        return this.parser;
    }

    parseRaw(buffer, enc, cb) {
        const S = this.parseState;
        for (let i = 0; i < buffer.length; i++) {
            S.b = buffer[i];
            if ((S.waiting || (this.options.api_mode === 2 && !S.escape_next)) && S.b === C.START_BYTE) {
                S.buffer = Buffer.alloc(this.options.parser_buffer_size);
                S.length = 0;
                S.total = 0;
                S.checksum = 0x00;
                S.offset = 0;
                S.escape_next = false;
                S.waiting = false;
            }

            if (this.options.api_mode === 2 && S.b === C.ESCAPE) {
                S.escape_next = true;
                continue;
            }

            if (S.escape_next) {
                S.b = 0x20 ^ S.b;
                S.escape_next = false;
            }

            if (!S.waiting) {
                if (S.buffer.length > S.offset) {
                    S.buffer.writeUInt8(S.b, S.offset++);
                } else {
                    this.options.logger.warn(
                        "Packet being parsed doesn't fit allocated buffer.\n" +
                        "Consider increasing parser_buffer_size option.");
                    S.waiting = true;
                }
            }

            if (S.offset === 1) {
                continue;
            }

            if (S.offset === 2) {
                S.length = S.b << 8; // most sign. bit of the length
                continue;
            }
            if (S.offset === 3) {
                S.length += S.b;     // least sign. bit of the length
                continue;
            }

            if (S.offset > 3) { // unnessary check
                if (S.offset < S.length + 4) {
                    S.total += S.b;
                    continue;
                } else {
                    S.checksum = S.b;
                }
            }

            if (S.length > 0 && S.offset === S.length + 4) {
                const actualChecksum = 0xFF - (S.total % 0x100);
                if (S.checksum !== actualChecksum) {
                    this.emit('error', new ChecksumMismatchError(S, actualChecksum));
                }

                const rawFrame = S.buffer.slice(0, S.offset);
                if (this.options.raw_frames || !this.canParse(rawFrame)) {
                    if (cb !== undefined && typeof (cb) == 'function') this.parser.push(rawFrame);
                    else this.emit("frame_raw", rawFrame);
                } else {
                    const frame = this.parseFrame(rawFrame);
                    if (cb !== undefined && typeof (cb) == 'function') this.parser.push(frame);
                    else this.emit("frame_object", frame);
                }

                // Reset some things so we don't try to reeimt the same package if there is more (bogus?) data
                S.waiting = true;
                S.length = 0;
            }
        }
        if (cb !== undefined && typeof (cb) == 'function') cb();
    }

}

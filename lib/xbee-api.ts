/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

import stream from "stream";
import events from "events";
import BufferBuilder from "buffer-builder";
import BufferReader from "buffer-reader";
import {FrameBuilder, nextFrameId} from "./frame-builder";
import {
    ESCAPE,
    ESCAPE_BYTES,
    ESCAPE_WITH,
    FRAME_TYPE,
    START_BYTE,
    XBeeAPIOptions,
    XBeeFrame,
    XBeeFrameInput
} from "./constants";
import {FrameParser, ParsedFrame} from "./frame-parser";

export * as constants from "./constants";
export {XBeeAPIOptions} from "./constants";


const DEFAULT_OPTIONS: XBeeAPIOptions = {
    raw_frames: false,
    api_mode: 1,
    module: "Any",
    convert_adc: true,
    vref_adc: 1200,
    parser_buffer_size: 512,
    builder_buffer_size: 512
};

export class XBeeAPI extends events.EventEmitter {
    readonly builder: stream.Transform;
    readonly parser: stream.Transform;
    private readonly parseState: {
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

    escape(buffer: string | any[] | Buffer) {
        if (this.escapeBuffer === undefined)
            this.escapeBuffer = Buffer.alloc(this.options.parser_buffer_size);

        let offset = 0;
        this.escapeBuffer.writeUInt8(buffer[0], offset++);
        for (let i = 1; i < buffer.length; i++) {
            if (ESCAPE_BYTES.indexOf(buffer[i]) > -1) {
                this.escapeBuffer.writeUInt8(ESCAPE, offset++);
                this.escapeBuffer.writeUInt8(buffer[i] ^ ESCAPE_WITH, offset++);
            } else {
                this.escapeBuffer.writeUInt8(buffer[i], offset++);
            }
        }

        return Buffer.from(this.escapeBuffer.slice(0, offset));
    }

    buildFrame(frame: XBeeFrameInput) {
        let packet = Buffer.alloc(this.options.builder_buffer_size); // Packet buffer
        let payload = packet.slice(3); // Reference the buffer past the header
        let builder = new BufferBuilder(payload);

        // Let the builder fill the payload
        FrameBuilder[frame.type]!(frame as any, builder);

        // Calculate & Append Checksum
        let checksum = 0;
        for (let i = 0; i < builder.length; i++) checksum += payload[i];
        builder.appendUInt8(255 - (checksum % 256));

        // Get just the payload
        payload = payload.slice(0, builder.length);

        // Build the header at the start of the packet buffer
        builder = new BufferBuilder(packet);
        builder.appendUInt8(START_BYTE);
        builder.appendUInt16BE(payload.length - 1); // Sans checksum

        // Get the header and payload as one contiguous buffer
        packet = packet.slice(0, builder.length + payload.length);

        // Escape the packet, if needed
        return this.options.api_mode === 2 ? this.escape(packet) : packet;
    };

    // Note that this expects the whole frame to be escaped!
    parseFrame(rawFrame: Buffer): XBeeFrame {
        // Trim the header and trailing checksum
        const reader = new BufferReader(rawFrame.slice(3, rawFrame.length - 1));

        const type = reader.nextUInt8() as FRAME_TYPE;
        const frame = FrameParser[type]!(reader, this.options) as ParsedFrame<typeof type>
        return {
            type: type as any,
            ...frame
        } as XBeeFrame;
    };

    canParse(buffer: Buffer) {
        const type = buffer.readUInt8(3);
        return type in FrameParser;
    };

    canBuild(type: number) {
        return type in FrameBuilder;
    };

    nextFrameId() {
        return nextFrameId();
    };

    asParser() {
        return this.parser;
    }

    parseRaw(buffer: string | any[], enc: any, cb?: () => void) {
        const S = this.parseState;
        for (let i = 0; i < buffer.length; i++) {
            S.b = buffer[i];
            if ((S.waiting || (this.options.api_mode === 2 && !S.escape_next)) && S.b === START_BYTE) {
                S.buffer = Buffer.alloc(this.options.parser_buffer_size);
                S.length = 0;
                S.total = 0;
                S.checksum = 0x00;
                S.offset = 0;
                S.escape_next = false;
                S.waiting = false;
            }

            if (this.options.api_mode === 2 && S.b === ESCAPE) {
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
                    console.warn("Packet being parsed doesn't fit allocated buffer.\n" +
                        "Consider increasing parser_buffer_size option.");
                    S.waiting = true;
                }
            }

            if (S.offset === 1) {
                continue;
            }

            if (S.offset === 2) {
                S.length = S.b << 8; // most significant bit of the length
                continue;
            }
            if (S.offset === 3) {
                S.length += S.b;     // least significant bit of the length
                continue;
            }

            if (S.offset > 3) { // unnecessary check
                if (S.offset < S.length + 4) {
                    S.total += S.b;
                    continue;
                } else {
                    S.checksum = S.b;
                }
            }

            if (S.length > 0 && S.offset === S.length + 4) {
                if (S.checksum !== (255 - (S.total % 256))) {
                    const err = new Error("Checksum Mismatch " + JSON.stringify(S));
                    this.emit('error', err);
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

                // Reset some things, so we don't try to re-emit the same package if there is more (bogus?) data
                S.waiting = true;
                S.length = 0;
            }
        }
        if (cb != null) cb();
    };
}


/*r
 * xbee-api 
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

import * as xbee_api from "./xbee-api";
import {constants as C} from "./xbee-api";
import {AT_COMMAND} from "./constants";
import * as stream from "stream";

describe('Main', () => {
    it('should support default options', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        expect(xbeeAPI.options.api_mode).toEqual(1)
    })

    it('should apply options', () => {
        const xbeeAPI = new xbee_api.XBeeAPI({api_mode: 2});
        // given a byte array like [3,21], convert to a decimal value.
        expect(xbeeAPI.options.api_mode).toEqual(2)
    })
});

describe('frameId', () => {
    it('should increment', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const fId1 = xbeeAPI.nextFrameId();
        const fId2 = xbeeAPI.nextFrameId();
        expect(fId1 + 1).toEqual(fId2);
    })
})

// These have to be tested both for AP=1 and 2
describe('API Frame building', () => {
    it('AT Command Requests', () => {
        const frame = {
            type: C.FRAME_TYPE.AT_COMMAND,
            id: 0x52,
            command: AT_COMMAND.NJ,
            commandParameter: [],
        } as const;

        // AT Command; 0x08; Queries ATNJ
        const expected0 = new Buffer([0x7E, 0x00, 0x04, 0x08, 0x52, 0x4E, 0x4A, 0x0D]);

        const xbeeAPI = new xbee_api.XBeeAPI();
        expect(expected0).toEqual(xbeeAPI.buildFrame(frame))
    })
    it('AT Command Queue Requests', () => {
        const frame = {
            type: C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE,
            id: 0x01,
            command: AT_COMMAND.BD,
            commandParameter: [0x07]
        } as const;

        // AT Command - Queue Param. Value; 0x09; Queues ATBD7
        const expected0 = new Buffer([0x7E, 0x00, 0x05, 0x09, 0x01, 0x42, 0x44, 0x07, 0x68]);

        const xbeeAPI = new xbee_api.XBeeAPI();
        expect(expected0).toEqual(xbeeAPI.buildFrame(frame))
    })
    it('AT Remote Command Requests', () => {
        const frame = {
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            id: 0x01,
            destination64: "0013a20040401122",
            destination16: "fffe",
            remoteCommandOptions: 0x02,
            command: AT_COMMAND.BH,
            commandParameter: [0x01]
        } as const;

        // Remote AT Command Req.; 0x17; ATBH1
        const expected0 = new Buffer([0x7E, 0x00, 0x10, 0x17, 0x01, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x40, 0x11, 0x22, 0xFF, 0xFE, 0x02, 0x42, 0x48, 0x01, 0xF5]);

        const xbeeAPI = new xbee_api.XBeeAPI();
        expect(expected0).toEqual(xbeeAPI.buildFrame(frame))
    })
    it('Transmit Requests', () => {
        const frame = {
            type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
            id: 0x01,
            destination64: "0013a200400a0127",
            destination16: "fffe",
            broadcastRadius: 0x00,
            options: 0x00,
            data: "TxData0A"
        } as const;

        // Transmit request; 0x10; sends chars: TxData0A (AP=1)
        const expected0 = new Buffer([0x7E, 0x00, 0x16, 0x10, 0x01, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x0A, 0x01, 0x27, 0xFF, 0xFE, 0x00, 0x00, 0x54, 0x78, 0x44, 0x61, 0x74, 0x61, 0x30, 0x41, 0x13]);

        const xbeeAPI = new xbee_api.XBeeAPI();
        expect(expected0).toEqual(xbeeAPI.buildFrame(frame))
    })
    it('Keep Frame ID Zero', () => {
        const frame = {
            type: C.FRAME_TYPE.AT_COMMAND,
            id: 0x00,
            command: AT_COMMAND.NJ,
            commandParameter: [],
        } as const;

        // AT Command; 0x08; Queries ATNJ
        const expected0 = new Buffer([0x7E, 0x00, 0x04, 0x08, 0x00, 0x4E, 0x4A, 0x5F]);

        const xbeeAPI = new xbee_api.XBeeAPI();
        expect(expected0).toEqual(xbeeAPI.buildFrame(frame))
    })
    it('Assign ID When Missing', () => {
        const frame = {
            type: C.FRAME_TYPE.AT_COMMAND,
            command: AT_COMMAND.NJ,
            commandParameter: [],
        } as const;

        const xbeeAPI = new xbee_api.XBeeAPI();
        const firstId = xbeeAPI.nextFrameId();

        const buf = xbeeAPI.buildFrame(frame);

        expect(firstId + 1).toEqual(buf[4])
    })
})

describe('Stream Interface', () => {
    it('Encode Decode', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();

        const send_frame = {
            type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
            id: 0x01,
            destination64: "0013a200400a0127",
            destination16: "fffe",
            broadcastRadius: 0x00,
            options: 0x00,
            data: "TxData0A"
        } as const;
        // Transmit request; 0x10; sends chars: TxData0A (AP=1)
        const expected0 = new Buffer([0x7E, 0x00, 0x16, 0x10, 0x01, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x0A, 0x01, 0x27, 0xFF, 0xFE, 0x00, 0x00, 0x54, 0x78, 0x44, 0x61, 0x74, 0x61, 0x30, 0x41, 0x13]);
        // Remote Command Response; 0x97; ATSL [OK] 40522BAA
        const rawFrame0 = new Buffer([0x7E, 0x00, 0x13, 0x97, 0x55, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x53, 0x4C, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0xF0]);
        // ZigBee Transmit Status; 0x8B; 0 retransmit, Success, Address Discovery
        const rawFrame1 = new Buffer([0x7E, 0x00, 0x07, 0x8B, 0x01, 0x7D, 0x84, 0x00, 0x00, 0x01, 0x71]);

        const mockserialR = new stream.Readable();
        const mockserialW = new stream.Writable();
        mockserialW._write = jest.fn((chunk, enc, cb) => {
            expect(expected0).toEqual(chunk)
        });
        mockserialR._read = function (size) {
        };
        mockserialR.pipe(xbeeAPI.parser);
        xbeeAPI.builder.pipe(mockserialW);

        const onData = jest.fn((frame) => {
            if (frame.id == 0x01) {
                expect(frame.remote16).toEqual("7d84")
                expect(frame.transmitRetryCount).toEqual(0)
                expect(frame.deliveryStatus).toEqual(0)
                expect(frame.discoveryStatus).toEqual(1)
            } else if (frame.id == 0x55) {
                expect(frame.remote64).toEqual('0013a20040522baa')
                expect(frame.remote16).toEqual('7d84')
                expect(frame.command).toEqual("SL")
                expect(frame.commandStatus).toEqual(0)
                expect(frame.commandData).toEqual(new Buffer([0x40, 0x52, 0x2b, 0xaa]));
            }
        })
        xbeeAPI.parser.on('data', onData);

        xbeeAPI.builder.write(send_frame);
        mockserialR.emit('data', rawFrame0);
        mockserialR.emit('data', rawFrame1);
        mockserialR.emit('end');

        expect(onData).toHaveBeenCalledTimes(2);
        expect(mockserialW._write).toHaveBeenCalledTimes(1);
    })
})

describe('API Frame Parsing', () => {
    it('AT Remote Command Responses', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();

        xbeeAPI.once("frame_object", function (frame) { // frame1
            expect(frame.id).toEqual(0x55)
            expect(frame.remote64).toEqual('0013a20040522baa')
            expect(frame.remote16).toEqual('7d84')
            expect(frame.command).toEqual("SL")
            expect(frame.commandStatus).toEqual(0)
            expect(frame.commandData).toEqual(new Buffer([0x40, 0x52, 0x2b, 0xaa]));
        });

        // Remote Command Response; 0x97; ATSL [OK] 40522BAA
        const rawFrame = new Buffer([0x7E, 0x00, 0x13, 0x97, 0x55, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x53, 0x4C, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0xF0]);
        parser.write(rawFrame);
    })
    it('AT Command Responses, BD AT Command', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();

        xbeeAPI.once("frame_object", function (frame) { // frame0
            expect(frame.id).toEqual(0x01)
            expect(frame.command).toEqual("BD")
            expect(frame.commandStatus).toEqual(0)
        });

        // AT Command Response; 0x88; ATBD [OK] (no data)
        const rawFrame = new Buffer([0x7E, 0x00, 0x05, 0x88, 0x01, 0x42, 0x44, 0x00, 0xF0]);
        parser.write(rawFrame);
    })
    it('AT Command Responses, ND AT Command with no data', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();

        xbeeAPI.once("frame_object", function (frame) { // frame0
            expect(frame.id).toEqual(0x01)
            expect(frame.command).toEqual("ND")
            expect(frame.commandStatus).toEqual(0)
            expect(frame.commandData).toEqual(new Buffer([]));
        });

        // AT Command Response; 0x88; ATND [OK] (no data)
        const rawFrame = new Buffer([0x7E, 0x00, 0x05, 0x88, 0x01, 0x4E, 0x44, 0x00, 0xE4]);
        parser.write(rawFrame);
    })
    it('AT Command Responses, ND AT Command with data', () => {
        const xbeeAPI = new xbee_api.XBeeAPI({api_mode: 2});
        const parser = xbeeAPI.asParser();

        xbeeAPI.once("frame_object", function (frame) { // frame0
            expect(frame.id).toEqual(0x01)
            expect(frame.command).toEqual("ND")
            expect(frame.commandStatus).toEqual(0)
            expect(frame.nodeIdentification.remote16).toEqual('fffe');
            expect(frame.nodeIdentification.remote64).toEqual('0013a20040d814a8');
            expect(frame.nodeIdentification.nodeIdentifier).toEqual('4d');
        });

        // AT Command Response; 0x88; ATND [OK] (with data)
        const rawFrame = new Buffer([0x7E, 0x00, 0x12, 0x88, 0x01, 0x4E, 0x44, 0x00, 0xFF, 0xFE, 0x00, 0x7D, 0x33, 0xA2, 0x00, 0x40, 0xD8, 0x14, 0xA8, 0x34, 0x64, 0x00, 0xC6]);
        parser.write(rawFrame);
    })
    it('Transmit Status', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();
        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote16).toEqual("7d84")
            expect(frame.id).toEqual(0x01)
            expect(frame.transmitRetryCount).toEqual(0)
            expect(frame.deliveryStatus).toEqual(0)
            expect(frame.discoveryStatus).toEqual(1)
        });
        // ZigBee Transmit Status; 0x8B; 0 retransmit, Success, Address Discovery
        const rawFrame = new Buffer([0x7E, 0x00, 0x07, 0x8B, 0x01, 0x7D, 0x84, 0x00, 0x00, 0x01, 0x71]);
        parser.write(rawFrame);
    })
    it('Modem Status', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();
        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.modemStatus).toEqual(6)
        });
        // Modem status; 0x8A; Coordinator Started
        const rawFrame = new Buffer([0x7E, 0x00, 0x02, 0x8A, 0x06, 0x6F]);
        parser.write(rawFrame);
    })

    it('Receive Packet', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();
        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote64).toEqual('0013a20040522baa')
            expect(frame.remote16).toEqual('7d84')
            expect(frame.receiveOptions).toEqual(1)
            expect(frame.data).toEqual(new Buffer([0x52, 0x78, 0x44, 0x61, 0x74, 0x61]));
        });
        // Receive Packet; 0x90; Receive packet with chars RxData
        const rawFrame = new Buffer([0x7E, 0x00, 0x12, 0x90, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x01, 0x52, 0x78, 0x44, 0x61, 0x74, 0x61, 0x0D]);
        parser.write(rawFrame);
    })

    it('Leading Garbage', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();
        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote64).toEqual('0013a20040522baa')
            expect(frame.remote16).toEqual('7d84')
            expect(frame.receiveOptions).toEqual(1)
            expect(frame.data).toEqual(new Buffer([0x52, 0x78, 0x44, 0x61, 0x74, 0x61]));
        });
        // Receive Packet; 0x90; Receive packet with chars RxData
        const garbage = [];
        for (let i = 0; i < 520; i++) garbage.push(0x00);
        const garbageBuffer = new Buffer(garbage);
        const rawFrame = new Buffer([0x7E, 0x00, 0x12, 0x90, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x01, 0x52, 0x78, 0x44, 0x61, 0x74, 0x61, 0x0D]);
        const garbagedFrame = Buffer.concat([garbageBuffer, rawFrame]);
        parser.write(garbagedFrame);
    })
    it('Receive Packet with AO=1', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();
        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote64).toEqual('0013a20040c401a9')
            expect(frame.remote16).toEqual('0000')
            expect(frame.sourceEndpoint).toEqual('e8')
            expect(frame.destinationEndpoint).toEqual('e8')
            expect(frame.clusterId).toEqual('0011')
            expect(frame.profileId).toEqual('c105')
            expect(frame.receiveOptions).toEqual(1)
            expect(frame.data).toEqual(new Buffer([0x74, 0x65, 0x73, 0x74, 0x20, 0x6D, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65]));
        });
        // Receive Packet; 0x90; Receive packet with chars RxData
        const rawFrame = new Buffer([0x7E, 0x00, 0x1E, 0x91, 0x00, 0x13, 0xA2, 0x00, 0x40, 0xC4, 0x01, 0xA9, 0x00, 0x00, 0xE8, 0xE8, 0x00, 0x11, 0xC1, 0x05, 0x01, 0x74, 0x65, 0x73, 0x74, 0x20, 0x6D, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x9E]);
        parser.write(rawFrame);
    })

    it('Receive Packet 16-bit IO', () => {
        const xbeeAPI = new xbee_api.XBeeAPI({api_mode: 1});
        const parser = xbeeAPI.asParser();
        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote16).toEqual('1234')
            expect(frame.data.analogSamples.length).toEqual(frame.data.sampleQuantity)
            expect(frame.data.channelMask).toEqual(0x0E58)
        });
        // Receive Packet; 0x83; Receive packet from IC or IR setting
        const rawFrame = new Buffer([0x7E, 0x00, 0x10, 0x83, 0x12, 0x34, 0x1B, 0x00, 0x01, 0x0E, 0x58, 0x00, 0x18, 0x00, 0x46, 0x01, 0x54, 0x02, 0x0A, 0xF5]);
        parser.write(rawFrame);
    })

    it('Route Record', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();
        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote64).toEqual('0013a2004068f65b')
            expect(frame.remote16).toEqual('6d32')
            expect(frame.receiveOptions).toEqual(0)
            expect(frame.hopCount).toEqual(3)
            expect(frame.addresses).toEqual([0x1234, 0x5678, 0x90AB])
        });
        // Receive Packet; 0xa1; Receive packet with 3 intermediate hops
        const rawFrame = new Buffer([0x7e, 0x00, 0x13, 0xa1, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x68, 0xf6, 0x5b, 0x6d, 0x32, 0x00, 0x03, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xbf]);
        parser.write(rawFrame);
    })

    it('ZigBee IO Data Sample Rx', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();

        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote64).toEqual('0013a20040522baa')
            expect(frame.remote16).toEqual('7d84')
            expect(frame.receiveOptions).toEqual(1)
            expect(frame.numSamples).toEqual(1)
            expect(frame.digitalSamples).toEqual({
                "DIO2": 1,
                "DIO3": 0,
                "DIO4": 1
            })
            expect(frame.analogSamples).toEqual({
                "AD1": 644
            })
        })

        // Receive IO Data Sample; 0x92; ...
        const rawFrame = new Buffer([0x7E, 0x00, 0x14, 0x92, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x01, 0x01, 0x00, 0x1C, 0x02, 0x00, 0x14, 0x02, 0x25, 0xF5]);
        parser.write(rawFrame);
    })
    it('AP=1 Containing Start Byte', () => {
        const xbeeAPI = new xbee_api.XBeeAPI({api_mode: 1});
        const parser = xbeeAPI.asParser();
        const parsed = 0;

        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote64).toEqual('0013a200415b7ed6')
            expect(frame.remote16).toEqual('fffe')
            expect(frame.receiveOptions).toEqual(194)
            expect(frame.numSamples).toEqual(1)
            expect(frame.digitalSamples).toEqual({});
            expect(frame.analogSamples).toEqual({
                "AD2": 1200,
                "AD3": 1200
            });
        });
        const rawFrame = new Buffer([0x7e, 0x00, 0x14, 0x92, 0x00, 0x13, 0xa2, 0x00, 0x41, 0x5b, 0x7e, 0xd6, 0xff, 0xfe, 0xc2, 0x01, 0x00, 0x00, 0x0c, 0x03, 0xff, 0x03, 0xff, 0xf8]);
        parser.write(rawFrame);
    })
    it('Multiple Frames In One Buffer', () => {       // AP=1
        const xbeeAPI = new xbee_api.XBeeAPI({api_mode: 1});
        const parser = xbeeAPI.asParser();
        let parsed = 0;

        xbeeAPI.on("frame_object", function (frame) {
            if (parsed === 0) {
                expect(frame.remote64).toEqual('0013a20040522baa')
                expect(frame.remote16).toEqual('7d84')
                expect(frame.receiveOptions).toEqual(1)
                expect(frame.numSamples).toEqual(1)
                expect(frame.digitalSamples).toEqual({
                    "DIO2": 1,
                    "DIO3": 0,
                    "DIO4": 1
                });
                expect(frame.analogSamples).toEqual({
                    "AD1": 644
                });
            } else if (parsed === 1) {
                expect(frame.remote64).toEqual('0013a20041550883')
                expect(frame.remote16).toEqual('fffe')
                expect(frame.receiveOptions).toEqual(194)
                expect(frame.numSamples).toEqual(1)
                expect(frame.digitalSamples).toEqual({});
                expect(frame.analogSamples).toEqual({
                    "AD2": 1200,
                    "AD3": 1200
                });
            }
            parsed++;
        });

        const rawFrames = new Buffer([0x7E, 0x00, 0x14, 0x92, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x01, 0x01, 0x00, 0x1C, 0x02, 0x00, 0x14, 0x02, 0x25, 0xF5, 0x7E, 0x00, 0x14, 0x92, 0x00, 0x13, 0xA2, 0x00, 0x41, 0x55, 0x08, 0x83, 0xFF, 0xFE, 0xC2, 0x01, 0x00, 0x00, 0x0C, 0x03, 0xFF, 0x03, 0xFF, 0xC7]);
        parser.write(rawFrames);
    })
    it('XBee Sensor Read Indicator', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();

        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.remote64).toEqual('0013a20040522baa')
            expect(frame.remote16).toEqual('dd6c')
            expect(frame.receiveOptions).toEqual(1)
            expect(frame.sensors).toEqual(0x03)
            expect(frame.sensorValues).toEqual({
                "AD0": 40,
                "AD1": 4120,
                "AD2": 4680,
                "AD3": 1640,
                "T": 362,
                "temperature": 22.625,
                "relativeHumidity": 30.71,
                "trueHumidity": 30.54,
                "waterPresent": false
            });
        });

        // Receive IO Data Sample; 0x94; ...
        const rawFrame = new Buffer([0x7E, 0x00, 0x17, 0x94, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2b, 0xAA, 0xDD, 0x6c, 0x01, 0x03, 0x00, 0x02, 0x00, 0xCE, 0x00, 0xEA, 0x00, 0x52, 0x01, 0x6A, 0x8B]);
        parser.write(rawFrame);
    })
    it('Node Identification Indicator', () => {
        const xbeeAPI = new xbee_api.XBeeAPI();
        const parser = xbeeAPI.asParser();

        xbeeAPI.once("frame_object", function (frame) {
            expect(frame.sender64).toEqual('0013a20040522baa',)
            expect(frame.sender16).toEqual('7d84',)
            expect(frame.receiveOptions).toEqual(2,)
            expect(frame.remote16).toEqual('7d84',)
            expect(frame.remote64).toEqual('0013a20040522baa',)
            expect(frame.nodeIdentifier).toEqual(" ",)
            expect(frame.remoteParent16).toEqual('fffe',)
            expect(frame.deviceType).toEqual(1,)
            expect(frame.sourceEvent).toEqual(1,)
            // digi app profile...
        });

        // Receive IO Data Sample; 0x95; ...
        const rawFrame = new Buffer([0x7E, 0x00, 0x20, 0x95, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x7D, 0x84, 0x02, 0x7D, 0x84, 0x00, 0x13, 0xA2, 0x00, 0x40, 0x52, 0x2B, 0xAA, 0x20, 0x00, 0xFF, 0xFE, 0x01, 0x01, 0xC1, 0x05, 0x10, 0x1E, 0x1B]);
        parser.write(rawFrame);
    })
    it('Escaping (AP=2)', () => {
        const xbeeAPI = new xbee_api.XBeeAPI({api_mode: 2});
        const parser = xbeeAPI.asParser();
        let parsed = 0;

        xbeeAPI.on("frame_object", function (frame) {
            if (parsed === 0) {
                expect(frame.id).toEqual(0x7D)
            } else if (parsed === 1) {
                expect(frame.id).toEqual(0x7E)
            } else if (parsed === 2) {
                expect(frame.id).toEqual(0x62)
            } else if (parsed === 3) {
                expect(frame.id).toEqual(0x64)
            } else if (parsed === 4) {
                expect(frame.id).toEqual(0x65)
            } else if (parsed === 5) {
                expect(frame.id).toEqual(0x66)
            }
            parsed++;
        });

        // ZigBee Transmit Status; 0x8B; here, frameId happens to be 7D and needs to be escaped
        const rawFrame0 = new Buffer([0x7e, 0x0, 0x7, 0x8b, 0x7d, 0x5d, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x63]);
        parser.write(rawFrame0);

        // ZigBee Transmit Status; 0x8B; here, frameId happens to be 7E and needs to be escaped
        const rawFrame1 = new Buffer([0x7e, 0x0, 0x7, 0x8b, 0x7d, 0x5e, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x62]);
        parser.write(rawFrame1);

        // ZigBee Transmit Status; 0x8B; here, checksum happebs to be 7E and needs to be escaped (frameId 62)
        const rawFrame2 = new Buffer([0x7e, 0x0, 0x7, 0x8b, 0x62, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7d, 0x5e]);
        parser.write(rawFrame2);

        // ZigBee Transmit Status; 0x8B; some frames without escaping (frameId = 0x64)
        const rawFrame3 = new Buffer([0x7e, 0x0, 0x7, 0x8b, 0x64, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7c]);
        parser.write(rawFrame3);

        // ZigBee Transmit Status; 0x8B; some frames without escaping (frameId = 0x65)
        const rawFrame4 = new Buffer([0x7e, 0x0, 0x7, 0x8b, 0x65, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7b]);
        parser.write(rawFrame4);

        // ZigBee Transmit Status; 0x8B; some frames without escaping (frameId = 0x66)
        const rawFrame5 = new Buffer([0x7e, 0x0, 0x7, 0x8b, 0x66, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7a]);
        parser.write(rawFrame5);
    })
})

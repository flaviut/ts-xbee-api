/* r
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

import { FrameType, XBeeBuilder, XBeeParser, C } from '../index';
import * as stream from 'stream';
import { concat } from './buffer-tools';
import { BuildableFrame } from 'ts-xbee-api';
import { vi } from 'vitest';

describe('Main', () => {
  it('should support default options', () => {
    const xbeeAPI = new XBeeBuilder();
    expect(xbeeAPI._options.api_mode).toEqual(1);
  });

  it('should apply options', () => {
    const xbeeAPI = new XBeeBuilder({ api_mode: 2 });
    // given a byte array like [3,21], convert to a decimal value.
    expect(xbeeAPI._options.api_mode).toEqual(2);
  });
});

describe('frameId', () => {
  it('should increment', () => {
    const xbeeAPI = new XBeeBuilder();
    const fId1 = xbeeAPI.nextFrameId();
    const fId2 = xbeeAPI.nextFrameId();
    expect(fId1 + 1).toEqual(fId2);
  });
});

// These have to be tested both for AP=1 and 2
describe('API Frame building', () => {
  it('Keep Frame ID Zero', () => {
    const frame: BuildableFrame = {
      type: FrameType.AT_COMMAND,
      id: 0x00,
      command: C.AT_COMMAND.NJ,
      commandParameter: [],
    };

    // AT Command; 0x08; Queries ATNJ
    const expected0 = Uint8Array.from([
      0x7e, 0x00, 0x04, 0x08, 0x00, 0x4e, 0x4a, 0x5f,
    ]);

    expect(XBeeBuilder.buildFrame(frame)).toEqual(expected0);
  });
  it('Assign ID When Missing', () => {
    const frame: BuildableFrame = {
      type: FrameType.AT_COMMAND,
      command: C.AT_COMMAND.NJ,
      commandParameter: [],
    };

    const buf = XBeeBuilder.buildFrame(frame);
    expect(buf[4]).toEqual(1);
  });

  it('AT_COMMAND', () => {
    const frame: BuildableFrame = {
      type: FrameType.AT_COMMAND,
      id: 0x52,
      command: C.AT_COMMAND.NJ,
      commandParameter: [],
    };

    // AT Command; 0x08; Queries ATNJ
    const expected0 = Uint8Array.from([
      0x7e, 0x00, 0x04, 0x08, 0x52, 0x4e, 0x4a, 0x0d,
    ]);

    expect(XBeeBuilder.buildFrame(frame)).toEqual(expected0);
  });
  it('AT_COMMAND_QUEUE_PARAMETER_VALUE', () => {
    const frame: BuildableFrame = {
      type: FrameType.AT_COMMAND_QUEUE_PARAMETER_VALUE,
      id: 0x01,
      command: C.AT_COMMAND.BD,
      commandParameter: [0x07],
    };

    // AT Command - Queue Param. Value; 0x09; Queues ATBD7
    const expected0 = Uint8Array.from([
      0x7e, 0x00, 0x05, 0x09, 0x01, 0x42, 0x44, 0x07, 0x68,
    ]);

    expect(XBeeBuilder.buildFrame(frame)).toEqual(expected0);
  });
  it('REMOTE_AT_COMMAND_REQUEST', () => {
    const frame: BuildableFrame = {
      type: FrameType.REMOTE_AT_COMMAND_REQUEST,
      id: 0x01,
      destination64: '0013a20040401122',
      destination16: 'fffe',
      remoteCommandOptions: 0x02,
      command: C.AT_COMMAND.BH,
      commandParameter: [0x01],
    };

    // Remote AT Command Req.; 0x17; ATBH1
    const expected0 = Uint8Array.from([
      0x7e, 0x00, 0x10, 0x17, 0x01, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x40, 0x11,
      0x22, 0xff, 0xfe, 0x02, 0x42, 0x48, 0x01, 0xf5,
    ]);

    expect(XBeeBuilder.buildFrame(frame)).toEqual(expected0);
  });
  it('ZIGBEE_TRANSMIT_REQUEST', () => {
    const frame: BuildableFrame = {
      type: FrameType.ZIGBEE_TRANSMIT_REQUEST,
      id: 0x01,
      destination64: '0013a200400a0127',
      destination16: 'fffe',
      broadcastRadius: 0x00,
      options: 0x00,
      data: 'TxData0A',
    };

    // Transmit request; 0x10; sends chars: TxData0A (AP=1)
    const expected0 = Uint8Array.from([
      0x7e, 0x00, 0x16, 0x10, 0x01, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x0a, 0x01,
      0x27, 0xff, 0xfe, 0x00, 0x00, 0x54, 0x78, 0x44, 0x61, 0x74, 0x61, 0x30,
      0x41, 0x13,
    ]);

    expect(XBeeBuilder.buildFrame(frame)).toEqual(expected0);
  });

  it('ZIGBEE_RECEIVE_PACKET', () => {
    const frame: BuildableFrame = {
      type: FrameType.ZIGBEE_RECEIVE_PACKET,
      sender64: '0013A20087654321',
      sender16: '5614',
      receiveOptions: new Set([C.RECEIVE_OPTIONS.PACKET_ACKNOWLEDGED]),
      data: 'TxData',
    };

    // Transmit response; 0x90; sends chars: TxData
    const expected0 = Uint8Array.from([
      0x7e, 0x00, 0x12, 0x90, 0x00, 0x13, 0xa2, 0x00, 0x87, 0x65, 0x43, 0x21,
      0x56, 0x14, 0x01, 0x54, 0x78, 0x44, 0x61, 0x74, 0x61, 0xb9,
    ]);

    expect(expected0).toEqual(XBeeBuilder.buildFrame(frame));
  });
});

describe('Stream Interface', () => {
  it('Encode Decode', () => {
    const parser = new XBeeParser();
    const builder = new XBeeBuilder();

    const sendFrame: BuildableFrame = {
      type: FrameType.ZIGBEE_TRANSMIT_REQUEST,
      id: 0x01,
      destination64: '0013a200400a0127',
      destination16: 'fffe',
      broadcastRadius: 0x00,
      options: 0x00,
      data: 'TxData0A',
    };
    // Transmit request; 0x10; sends chars: TxData0A (AP=1)
    const expected0 = Buffer.from([
      0x7e, 0x00, 0x16, 0x10, 0x01, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x0a, 0x01,
      0x27, 0xff, 0xfe, 0x00, 0x00, 0x54, 0x78, 0x44, 0x61, 0x74, 0x61, 0x30,
      0x41, 0x13,
    ]);
    // Remote Command Response; 0x97; ATSL [OK] 40522BAA
    const rawFrame0 = Uint8Array.from([
      0x7e, 0x00, 0x13, 0x97, 0x55, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b,
      0xaa, 0x7d, 0x84, 0x53, 0x4c, 0x00, 0x40, 0x52, 0x2b, 0xaa, 0xf0,
    ]);
    // ZigBee Transmit Status; 0x8B; 0 retransmit, Success, Address Discovery
    const rawFrame1 = Uint8Array.from([
      0x7e, 0x00, 0x07, 0x8b, 0x01, 0x7d, 0x84, 0x00, 0x00, 0x01, 0x71,
    ]);

    const mockserialR = new stream.Readable();
    const mockserialW = new stream.Writable();
    mockserialW._write = vi.fn();
    mockserialR._read = vi.fn();
    mockserialR.pipe(parser);
    builder.pipe(mockserialW);

    const onData = vi.fn((frame) => {
      if (frame.id === 0x01) {
        expect(frame.remote16).toEqual('7d84');
        expect(frame.transmitRetryCount).toEqual(0);
        expect(frame.deliveryStatus).toEqual(0);
        expect(frame.discoveryStatus).toEqual(1);
      } else if (frame.id === 0x55) {
        expect(frame.remote64).toEqual('0013a20040522baa');
        expect(frame.remote16).toEqual('7d84');
        expect(frame.command).toEqual('SL');
        expect(frame.commandStatus).toEqual(0);
        expect(frame.commandData).toEqual(
          Uint8Array.from([0x40, 0x52, 0x2b, 0xaa])
        );
      }
    });
    parser.on('data', onData);

    builder.write(sendFrame);
    mockserialR.emit('data', rawFrame0);
    mockserialR.emit('data', rawFrame1);
    mockserialR.emit('end');

    expect(onData).toHaveBeenCalledTimes(2);
    expect(mockserialW._write).toHaveBeenCalledTimes(1);
    expect(mockserialW._write).toBeCalledWith(
      expected0,
      'buffer',
      expect.anything()
    );
  });
});

describe('API Frame Parsing', () => {
  it('AT Remote Command Responses', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      // frame1
      expect(frame).toEqual({
        type: FrameType.REMOTE_COMMAND_RESPONSE,
        id: 0x55,
        remote64: '0013a20040522baa',
        remote16: '7d84',
        command: 'SL',
        commandStatus: 0,
        commandData: Uint8Array.from([0x40, 0x52, 0x2b, 0xaa]),
      });
    });

    // Remote Command Response; 0x97; ATSL [OK] 40522BAA
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x13, 0x97, 0x55, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b,
      0xaa, 0x7d, 0x84, 0x53, 0x4c, 0x00, 0x40, 0x52, 0x2b, 0xaa, 0xf0,
    ]);
    parser.write(rawFrame);
  });
  it('AT Command Responses, BD AT Command', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      // frame0
      expect(frame).toMatchObject({
        id: 0x01,
        command: 'BD',
        commandStatus: 0,
      });
    });

    // AT Command Response; 0x88; ATBD [OK] (no data)
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x05, 0x88, 0x01, 0x42, 0x44, 0x00, 0xf0,
    ]);
    parser.write(rawFrame);
  });
  it('AT Command Responses, ND AT Command with no data', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      // frame0
      expect(frame).toMatchObject({
        id: 0x01,
        command: 'ND',
        commandStatus: 0,
        commandData: Uint8Array.from([]),
      });
    });

    // AT Command Response; 0x88; ATND [OK] (no data)
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x05, 0x88, 0x01, 0x4e, 0x44, 0x00, 0xe4,
    ]);
    parser.write(rawFrame);
  });
  it('AT Command Responses, ND AT Command with data', () => {
    const parser = new XBeeParser({ api_mode: 2 });
    parser.once('data', function (frame) {
      // frame0
      expect(frame).toMatchObject({
        id: 0x01,
        command: 'ND',
        commandStatus: 0,
        nodeIdentification: {
          remote16: 'fffe',
          remote64: '0013a20040d814a8',
          nodeIdentifier: '4d',
        },
      });
    });

    // AT Command Response; 0x88; ATND [OK] (with data)
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x12, 0x88, 0x01, 0x4e, 0x44, 0x00, 0xff, 0xfe, 0x00, 0x7d,
      0x33, 0xa2, 0x00, 0x40, 0xd8, 0x14, 0xa8, 0x34, 0x64, 0x00, 0xc6,
    ]);
    parser.write(rawFrame);
  });
  it('Transmit Status', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote16: '7d84',
        id: 0x01,
        transmitRetryCount: 0,
        deliveryStatus: 0,
        discoveryStatus: 1,
      });
    });
    // ZigBee Transmit Status; 0x8B; 0 retransmit, Success, Address Discovery
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x07, 0x8b, 0x01, 0x7d, 0x84, 0x00, 0x00, 0x01, 0x71,
    ]);
    parser.write(rawFrame);
  });
  it('Modem Status', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        modemStatus: 6,
      });
    });
    // Modem status; 0x8A; Coordinator Started
    const rawFrame = Uint8Array.from([0x7e, 0x00, 0x02, 0x8a, 0x06, 0x6f]);
    parser.write(rawFrame);
  });

  it('Receive Packet', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote64: '0013a20040522baa',
        remote16: '7d84',
        receiveOptions: 1,
        data: Uint8Array.from([0x52, 0x78, 0x44, 0x61, 0x74, 0x61]),
      });
    });
    // Receive Packet; 0x90; Receive packet with chars RxData
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x12, 0x90, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b, 0xaa,
      0x7d, 0x84, 0x01, 0x52, 0x78, 0x44, 0x61, 0x74, 0x61, 0x0d,
    ]);
    parser.write(rawFrame);
  });

  it('Leading Garbage', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote64: '0013a20040522baa',
        remote16: '7d84',
        receiveOptions: 1,
        data: Uint8Array.from([0x52, 0x78, 0x44, 0x61, 0x74, 0x61]),
      });
    });
    // Receive Packet; 0x90; Receive packet with chars RxData
    const garbage = [];
    for (let i = 0; i < 520; i++) garbage.push(0x00);
    const garbageBuffer = Uint8Array.from(garbage);
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x12, 0x90, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b, 0xaa,
      0x7d, 0x84, 0x01, 0x52, 0x78, 0x44, 0x61, 0x74, 0x61, 0x0d,
    ]);
    const garbagedFrame = concat(garbageBuffer, rawFrame);
    parser.write(garbagedFrame);
  });
  it('Receive Packet with AO=1', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote64: '0013a20040c401a9',
        remote16: '0000',
        sourceEndpoint: 'e8',
        destinationEndpoint: 'e8',
        clusterId: '0011',
        profileId: 'c105',
        receiveOptions: 1,
        data: Uint8Array.from([
          0x74, 0x65, 0x73, 0x74, 0x20, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67,
          0x65,
        ]),
      });
    });
    // Receive Packet; 0x90; Receive packet with chars RxData
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x1e, 0x91, 0x00, 0x13, 0xa2, 0x00, 0x40, 0xc4, 0x01, 0xa9,
      0x00, 0x00, 0xe8, 0xe8, 0x00, 0x11, 0xc1, 0x05, 0x01, 0x74, 0x65, 0x73,
      0x74, 0x20, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x9e,
    ]);
    parser.write(rawFrame);
  });

  it('Receive Packet 16-bit IO', () => {
    const parser = new XBeeParser({ api_mode: 1 });
    parser.once('data', function (frame) {
      if (frame.type === FrameType.RX_PACKET_16_IO) {
        expect(frame.remote16).toEqual('1234');
        expect(frame.data.analogSamples.length).toEqual(
          frame.data.sampleQuantity
        );
        expect(frame.data.channelMask).toEqual(0x0e58);
      } else {
        expect(frame.type).toEqual(FrameType.RX_PACKET_16_IO);
      }
    });
    // Receive Packet; 0x83; Receive packet from IC or IR setting
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x10, 0x83, 0x12, 0x34, 0x1b, 0x00, 0x01, 0x0e, 0x58, 0x00,
      0x18, 0x00, 0x46, 0x01, 0x54, 0x02, 0x0a, 0xf5,
    ]);
    parser.write(rawFrame);
  });

  it('Route Record', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote64: '0013a2004068f65b',
        remote16: '6d32',
        receiveOptions: 0,
        hopCount: 3,
        addresses: [0x1234, 0x5678, 0x90ab],
      });
    });
    // Receive Packet; 0xa1; Receive packet with 3 intermediate hops
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x13, 0xa1, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x68, 0xf6, 0x5b,
      0x6d, 0x32, 0x00, 0x03, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xbf,
    ]);
    parser.write(rawFrame);
  });

  it('ZigBee IO Data Sample Rx', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote64: '0013a20040522baa',
        remote16: '7d84',
        receiveOptions: 1,
        numSamples: 1,
        digitalSamples: {
          DIO2: 1,
          DIO3: 0,
          DIO4: 1,
        },
        analogSamples: {
          AD1: 644,
        },
      });
    });

    // Receive IO Data Sample; 0x92; ...
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x14, 0x92, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b, 0xaa,
      0x7d, 0x84, 0x01, 0x01, 0x00, 0x1c, 0x02, 0x00, 0x14, 0x02, 0x25, 0xf5,
    ]);
    parser.write(rawFrame);
  });
  it('AP=1 Containing Start Byte', () => {
    const parser = new XBeeParser({ api_mode: 1 });
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote64: '0013a200415b7ed6',
        remote16: 'fffe',
        receiveOptions: 194,
        numSamples: 1,
        digitalSamples: {},
        analogSamples: {
          AD2: 1200,
          AD3: 1200,
        },
      });
    });
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x14, 0x92, 0x00, 0x13, 0xa2, 0x00, 0x41, 0x5b, 0x7e, 0xd6,
      0xff, 0xfe, 0xc2, 0x01, 0x00, 0x00, 0x0c, 0x03, 0xff, 0x03, 0xff, 0xf8,
    ]);
    parser.write(rawFrame);
  });
  it('Multiple Frames In One Buffer', () => {
    // AP=1
    const parser = new XBeeParser({ api_mode: 1 });
    let parsed = 0;

    parser.on('data', function (frame) {
      if (parsed === 0) {
        expect(frame).toMatchObject({
          remote64: '0013a20040522baa',
          remote16: '7d84',
          receiveOptions: 1,
          numSamples: 1,
          digitalSamples: {
            DIO2: 1,
            DIO3: 0,
            DIO4: 1,
          },
          analogSamples: {
            AD1: 644,
          },
        });
      } else if (parsed === 1) {
        expect(frame).toMatchObject({
          remote64: '0013a20041550883',
          remote16: 'fffe',
          receiveOptions: 194,
          numSamples: 1,
          digitalSamples: {},
          analogSamples: {
            AD2: 1200,
            AD3: 1200,
          },
        });
      }
      parsed++;
    });

    const rawFrames = Uint8Array.from([
      0x7e, 0x00, 0x14, 0x92, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b, 0xaa,
      0x7d, 0x84, 0x01, 0x01, 0x00, 0x1c, 0x02, 0x00, 0x14, 0x02, 0x25, 0xf5,
      0x7e, 0x00, 0x14, 0x92, 0x00, 0x13, 0xa2, 0x00, 0x41, 0x55, 0x08, 0x83,
      0xff, 0xfe, 0xc2, 0x01, 0x00, 0x00, 0x0c, 0x03, 0xff, 0x03, 0xff, 0xc7,
    ]);
    parser.write(rawFrames);
  });
  it('XBee Sensor Read Indicator', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        remote64: '0013a20040522baa',
        remote16: 'dd6c',
        receiveOptions: 1,
        sensors: 0x03,
        sensorValues: {
          AD0: 40,
          AD1: 4120,
          AD2: 4680,
          AD3: 1640,
          T: 362,
          temperature: 22.625,
          relativeHumidity: 30.71,
          trueHumidity: 30.54,
          waterPresent: false,
        },
      });
    });

    // Receive IO Data Sample; 0x94; ...
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x17, 0x94, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b, 0xaa,
      0xdd, 0x6c, 0x01, 0x03, 0x00, 0x02, 0x00, 0xce, 0x00, 0xea, 0x00, 0x52,
      0x01, 0x6a, 0x8b,
    ]);
    parser.write(rawFrame);
  });
  it('Node Identification Indicator', () => {
    const parser = new XBeeParser();
    parser.once('data', function (frame) {
      expect(frame).toMatchObject({
        sender64: '0013a20040522baa',
        sender16: '7d84',
        receiveOptions: 2,
        remote16: '7d84',
        remote64: '0013a20040522baa',
        nodeIdentifier: ' ',
        remoteParent16: 'fffe',
        deviceType: 1,
        sourceEvent: 1,
      });
      // digi app profile...
    });

    // Receive IO Data Sample; 0x95; ...
    const rawFrame = Uint8Array.from([
      0x7e, 0x00, 0x20, 0x95, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b, 0xaa,
      0x7d, 0x84, 0x02, 0x7d, 0x84, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b,
      0xaa, 0x20, 0x00, 0xff, 0xfe, 0x01, 0x01, 0xc1, 0x05, 0x10, 0x1e, 0x1b,
    ]);
    parser.write(rawFrame);
  });
  it('Escaping (AP=2)', () => {
    const parser = new XBeeParser({ api_mode: 2 });
    let parsed = 0;

    parser.on('data', function (frame) {
      if (frame.type !== FrameType.ZIGBEE_TRANSMIT_STATUS) {
        expect(frame.type).toEqual(FrameType.ZIGBEE_TRANSMIT_STATUS);
        return;
      }
      if (parsed === 0) {
        expect(frame.id).toEqual(0x7d);
      } else if (parsed === 1) {
        expect(frame.id).toEqual(0x7e);
      } else if (parsed === 2) {
        expect(frame.id).toEqual(0x62);
      } else if (parsed === 3) {
        expect(frame.id).toEqual(0x64);
      } else if (parsed === 4) {
        expect(frame.id).toEqual(0x65);
      } else if (parsed === 5) {
        expect(frame.id).toEqual(0x66);
      }
      parsed++;
    });

    // ZigBee Transmit Status; 0x8B; here, frameId happens to be 7D and needs to be escaped
    const rawFrame0 = Uint8Array.from([
      0x7e, 0x0, 0x7, 0x8b, 0x7d, 0x5d, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x63,
    ]);
    parser.write(rawFrame0);

    // ZigBee Transmit Status; 0x8B; here, frameId happens to be 7E and needs to be escaped
    const rawFrame1 = Uint8Array.from([
      0x7e, 0x0, 0x7, 0x8b, 0x7d, 0x5e, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x62,
    ]);
    parser.write(rawFrame1);

    // ZigBee Transmit Status; 0x8B; here, checksum happebs to be 7E and needs to be escaped (frameId 62)
    const rawFrame2 = Uint8Array.from([
      0x7e, 0x0, 0x7, 0x8b, 0x62, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7d, 0x5e,
    ]);
    parser.write(rawFrame2);

    // ZigBee Transmit Status; 0x8B; some frames without escaping (frameId = 0x64)
    const rawFrame3 = Uint8Array.from([
      0x7e, 0x0, 0x7, 0x8b, 0x64, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7c,
    ]);
    parser.write(rawFrame3);

    // ZigBee Transmit Status; 0x8B; some frames without escaping (frameId = 0x65)
    const rawFrame4 = Uint8Array.from([
      0x7e, 0x0, 0x7, 0x8b, 0x65, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7b,
    ]);
    parser.write(rawFrame4);

    // ZigBee Transmit Status; 0x8B; some frames without escaping (frameId = 0x66)
    const rawFrame5 = Uint8Array.from([
      0x7e, 0x0, 0x7, 0x8b, 0x66, 0x2a, 0x6a, 0x0, 0x0, 0x0, 0x7a,
    ]);
    parser.write(rawFrame5);
  });
});

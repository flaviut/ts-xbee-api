import { type ErrorCallback } from '@serialport/stream';
import { SerialPort } from 'serialport';
import * as stream from 'stream';
import { SpecificParsableFrame } from 'ts-xbee-api';
import { describe, expect } from 'vitest';
import { fromHex, toHex } from './buffer-tools';
import * as C from './constants';
import { XBee } from './xbee-high-level';

class PrintingSerialPort extends SerialPort {
  constructor(options: any) {
    super(options);
    this.on('data', (data: Buffer) => {
      console.log(`Received ${toHex(data)}`);
    });
    this.write = new Proxy(this.write, {
      apply(target, thisArg, args: any) {
        console.log(`Sent ${toHex(args[0])}`);
        return target.apply(thisArg, args);
      },
    });
  }
}

function messageResponsePort(
  mapping: Array<[string, string[]]>
): typeof SerialPort {
  return class extends stream.Duplex {
    close(callback?: ErrorCallback): void {
      if (callback) callback(null);
    }

    open(callback?: ErrorCallback): void {
      if (callback) callback(null);
    }

    get isOpen(): boolean {
      return true;
    }

    constructor() {
      const targetStream = new stream.PassThrough();
      super({
        read() {
          return;
        },
        write: (data, encoding, callback) => {
          targetStream.write(data, encoding, callback);
        },
      });
      targetStream.on('data', (data: Buffer) => {
        const hexData = toHex(data);
        expect(mapping.length, 'to be done receiving messages').toBeGreaterThan(
          0
        );
        const [expected, responses] = mapping.shift()!;
        expect(hexData).toEqual(expected);
        for (const response of responses) {
          this.push(fromHex(response));
        }
      });
    }
  } as any;
}

describe('XBee', function () {
  it.skip('should discover connected devices', async function () {
    const port = await XBee.discover(
      '/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_AC00J6YC-if00-port0',
      [9600, 115200],
      PrintingSerialPort as any
    );
    await port.close();
  });

  it('should discover connected devices (mock)', async function () {
    const port = await XBee.discover(
      '/dev/ttyUSB0',
      [9600, 115200],
      messageResponsePort([
        ['7e00040801415065', []], // first 9600 API message
        ['2b2b2b', []], // second 9600 AT message
        ['7e00040801415065', ['7e0006880141500001e4']], // first 115200 API message
      ])
    );
    await port.close();
  });

  it('should scan the network', async function () {
    const port = await XBee.withBaud(
      '/dev/ttyUSB0',
      115200,
      messageResponsePort([
        ['7e000508014e543c18', ['7e000588014e5400d4']], // set discovery timeout
        [
          '7e000408024e4463', // start discovery
          [
            '7e001988024e4400ed920013a20041aacaf82000fffe0100c105101ef0', // node identification
          ],
        ],
      ])
    );

    const devices: Array<
      SpecificParsableFrame<C.FRAME_TYPE.AT_COMMAND_RESPONSE>
    > = [];
    for await (const device of port.scanNetwork(100)) {
      devices.push(device);
    }
    await port.close();

    expect(devices).toMatchInlineSnapshot(`
      [
        {
          "command": "ND",
          "commandStatus": 0,
          "id": 2,
          "nodeIdentification": {
            "deviceType": 1,
            "digiManufacturerID": "101e",
            "digiProfileID": "c105",
            "nodeIdentifier": " ",
            "remote16": "ed92",
            "remote64": "0013a20041aacaf8",
            "remoteParent16": "fffe",
            "sourceEvent": 0,
          },
          "type": 136,
        },
      ]
    `);
  });
});

# ts-xbee-api

A user-friendly interface to [Digi's XBee](http://www.digi.com/xbee/) line of RF modules. This
is made up of two parts:

- a library for parsing and building XBee frames, especially in association with Node streams, such
  as those provided by the [serialport](https://serialport.io/) package.
- a high-level API for interacting with XBee modules, including a simple API for sending and
  receiving data.

Originally based on [xbee-api](https://github.com/jankolkmeier/xbee-api), but has been extensively
modified, especially as of v2.0.0.

## GETTING STARTED

Installation: `npm install ts-xbee-api`

```typescript
import { XBee } from 'ts-xbee-api';

const xbee = await XBee.discover('/dev/ttyUSB0', [9600, 115200]);
const routerAddress = await xbee.address();
const remoteAddress = '0013A20040B3B3B3';
await xbee.transmit(Uint8Array.from([0x01, 0x02, 0x03]), remoteAddress);
```

## SUPPORTED FIRMWARES AND DEVICES

This module supports the [802.15.4](http://en.wikipedia.org/wiki/IEEE_802.15.4)
and [ZigBee](http://en.wikipedia.org/wiki/ZigBee) (including **ZNet**) protocol stacks.

From the XBee family, Series 1 (802.15.4) and Series 2 (ZNet 2.5 and ZigBee) modules are supported,
since they come with firmwares talking either one of these stacks.

These documents are used as
reference: [90000976.pdf (for Series 2)](https://www.digi.com/resources/documentation/digidocs/PDFs/90000976.pdf)
and
[90000982.pdf (for Series 1)](https://www.digi.com/resources/documentation/digidocs/pdfs/90000982.pdf).
Some frame types are 802.15.4, ZNet or ZigBee specific. Be sure to use the correct ones for your
module (as described in the documents and the list below). Also check out
this [utility from Digi](http://docs.digi.com/display/XCTU/Frames+generator+tool).

Modules must run in API mode. Both AP=1 (without escaping) and AP=2 (with escaping) modes are
supported (set the api_mode parameter accordingly).

Since ZigBee is more robust and offers more features than ZNet (none of which are yet implemented
here, though!), you might be interested in upgrading your Series 2 modules from ZNet 2.5 to
ZigBee: [upgradingfromznettozb.pdf](ftp://ftp1.digi.com/support/documentation/upgradingfromznettozb.pdf).

## SUPPORTED FRAME TYPES

The following frame types are implemented:

- 0x00: TX (Transmit) Request: 64-bit address (802.15.4)
- 0x01: TX (Transmit) Request: 16-bit address (802.15.4)
- 0x08: AT Command (802.15.4, ZNet, ZigBee)
- 0x09: AT Command Queue Parameter Value (802.15.4, ZNet, ZigBee)
- 0x17: Remote Command Request (802.15.4, ZNet, ZigBee)
- 0x21: Create Source Route (ZigBee)
- 0x80: RX (Receive) Packet: 64-bit Address (802.15.4)
- 0x81: RX (Receive) Packet: 16-bit Address (802.15.4)
- 0x82: RX (Receive) Packet: 64-bit Address IO (802.15.4)
- 0x83: RX (Receive) Packet: 16-bit Address IO (802.15.4)
- 0x88: AT Command Response (802.15.4, ZNet, ZigBee)
- 0x89: TX (Transmit) Status (802.15.4)
- 0x8A: Modem Status (802.15.4, ZNet, ZigBee)
- 0x97: Remote Command Response (802.15.4, ZNet, ZigBee)
- 0x10: ZigBee Transmit Request (ZNet, ZigBee)
- 0x11: Explicit Addressing ZigBee Command Frame (ZNet, ZigBee)
- 0x8B: ZigBee Transmit Status (ZNet, ZigBee)
- 0x90: ZigBee Receive Packet (AO=0) (ZNet, ZigBee)
- 0x91: ZigBee Explicit Rx Indicator (AO=1) (ZNet, ZigBee)
- 0x92: ZigBee IO Data Sample Rx Indicator (ZNet, ZigBee)
- 0x94: XBee Sensor Read Indicator (AO=0) (ZNet, ZigBee)
- 0x95: Node Identification Indicator (AO=0) (ZNet, ZigBee)
- 0xA1: Route Record Indicator (ZigBee)

### NOT IMPLEMENTED YET

These (more esoteric) frame types have not been implemented
yet, [Open a new issue](https://github.com/jankolkmeier/xbee-api/issues/new) if you need something
in particular:

- 0x24: Register Joining Device (ZigBee)
- 0xA0: Over-the-Air Firmware Update Status (ZigBee)
- 0xA2: Device Authenticated Indicator (ZigBee)
- 0xA3: Many-to-One Route Request Indicator (ZigBee)
- 0xA4: Register Joining Device Status (ZigBee)
- 0xA5: Join Notification Status (ZigBee)

## Building

Run `nx build new` to build the library.

## Running unit tests

Run `nx test new` to execute the unit tests via [Jest](https://jestjs.io).

const xbee_api = require("ts-xbee-api");
const C = xbee_api.constants;
const xbeeAPI = new xbee_api.XBeeAPI();

// Something we might want to send to an XBee...
const frame_obj = {
  type: C.FRAME_TYPE.AT_COMMAND,
  command: "NI",
  commandParameter: [],
};
console.log(xbeeAPI.buildFrame(frame_obj));
// <Buffer 7e 00 04 08 01 4e 49 5f>

// Something we might receive from an XBee...
const raw_frame = new Buffer([
  0x7e, 0x00, 0x13, 0x97, 0x55, 0x00, 0x13, 0xa2, 0x00, 0x40, 0x52, 0x2b, 0xaa,
  0x7d, 0x84, 0x53, 0x4c, 0x00, 0x40, 0x52, 0x2b, 0xaa, 0xf0,
]);
console.log(xbeeAPI.parseFrame(raw_frame));
// { type: 151,
//   id: 85,
//   remote64: '0013a20040522baa',
//   remote16: '7d84',
//   command: 'SL',
//   commandStatus: 0,
//   commandData: [ 64, 82, 43, 170 ] }

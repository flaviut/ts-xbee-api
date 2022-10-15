/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

'use strict';


export const START_BYTE = 0x7E;
export const ESCAPE = 0x7D;
export const XOFF = 0x13;
export const XON = 0x11;
export const ESCAPE_WITH = 0x20;

export const UNKNOWN_16 = [0xff, 0xfe];
export const UNKNOWN_64 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff];
export const BROADCAST_16_XB = [0xff, 0xff];
export const COORDINATOR_16 = [0x00, 0x00];
export const COORDINATOR_64 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

export const ESCAPE_BYTES = [
    START_BYTE,
    ESCAPE,
    XOFF,
    XON
];

export const FRAME_TYPE = {
    // Frame Type
    AT_COMMAND: 0x08,
    0x08: "AT Command (0x08)",
    AT_COMMAND_QUEUE_PARAMETER_VALUE: 0x09,
    0x09: "AT Command - Queue Parameter Value (0x09)",
    ZIGBEE_TRANSMIT_REQUEST: 0x10,
    0x10: "ZigBee Transmit Request (0x10)",
    EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME: 0x11,
    0x11: "Explicit Addressing ZigBee Command Frame (0x11)",
    REMOTE_AT_COMMAND_REQUEST: 0x17,
    0x17: "Remote Command Request (0x17)",
    CREATE_SOURCE_ROUTE: 0x21,
    0x21: "Create Source Route (0x21)",
    REGISTER_JOINING_DEVICE: 0x24,
    0x24: "Register Joining Device (0x24)",
    AT_COMMAND_RESPONSE: 0x88,
    0x88: "AT Command Response (0x88)",
    MODEM_STATUS: 0x8A,
    0x8A: "Modem Status (0x8A)",
    ZIGBEE_TRANSMIT_STATUS: 0x8B,
    0x8B: "ZigBee Transmit Status (0x8B)",
    ZIGBEE_RECEIVE_PACKET: 0x90,
    0x90: "ZigBee Receive Packet (AO=0) (0x90)",
    ZIGBEE_EXPLICIT_RX: 0x91,
    0x91: "ZigBee Explicit Rx Indicator (AO=1) (0x91)",
    ZIGBEE_IO_DATA_SAMPLE_RX: 0x92,
    0x92: "ZigBee IO Data Sample Rx Indicator (0x92)",
    XBEE_SENSOR_READ: 0x94,
    0x94: "XBee Sensor Read Indicator (AO=0) (0x94)",
    NODE_IDENTIFICATION: 0x95,
    0x95: "Node Identification Indicator (AO=0) (0x95)",
    REMOTE_COMMAND_RESPONSE: 0x97,
    0x97: "Remote Command Response (0x97)",
    OTA_FIRMWARE_UPDATE_STATUS: 0xA0,
    0xA0: "Over-the-Air Firmware Update Status (0xA0)",
    ROUTE_RECORD: 0xA1,
    0xA1: "Route Record Indicator (0xA1)",
    DEVICE_AUTHENITCATED_INDICATOR: 0xA2,
    0xA2: "Device Authenticated Indicator (0xA2)",
    MTO_ROUTE_REQUEST: 0xA3,
    0xA3: "Many-to-One Route Request Indicator (0xA3)",
    REGISTER_JOINING_DEVICE_STATUS: 0xA4,
    0xA4: "Register Joining Device Status (0xA4)",
    JOIN_NOTIFICATION_STATUS: 0xA5,
    0xA5: "Join Notification Status (0xA5)",

    // Series 1/802.15.4 Support
    TX_REQUEST_64: 0x00,
    0x00: "TX (Transmit) Request: 64-bit address (0x00)",
    TX_REQUEST_16: 0x01,
    0x01: "TX (Transmit) Request: 16-bit address (0x01)",
    TX_STATUS: 0x89,
    0x89: "TX (Transmit) Status (0x89)",
    RX_PACKET_64: 0x80,
    0x80: "RX (Receive) Packet: 64-bit Address (0x80)",
    RX_PACKET_16: 0x81,
    0x81: "RX (Receive) Packet: 16-bit Address (0x81)",
    RX_PACKET_64_IO: 0x82,
    0x82: "RX (Receive) Packet: 64-bit Address IO (0x82)",
    RX_PACKET_16_IO: 0x83,
    0x83: "RX (Receive) Packet: 16-bit Address IO (0x83)",
};
export const DISCOVERY_STATUS = {
    NO_DISCOVERY_OVERHEAD: 0x00,
    0x00: "No Discovery Overhead (0x00)",
    ADDRESS_DISCOVERY: 0x01,
    0x01: "Address Discovery (0x01)",
    ROUTE_DISCOVERY: 0x02,
    0x02: "Route Discovery (0x02)",
    ADDRESS_AND_ROUTE_DISCOVERY: 0x03,
    0x03: "Address and Route (0x03)",
    EXTENDED_TIMEOUT_DISCOVERY: 0x40,
    0x40: "Extended Timeout Discovery (0x40)",
};
export const DELIVERY_STATUS = {
    SUCCESS: 0x00,
    0x00: "Success (0x00)",
    MAC_ACK_FALIURE: 0x01,
    0x01: "MAC ACK Failure (0x01)",
    CA_FAILURE: 0x02,
    0x02: "CA Failure (0x02)",
    INVALID_DESTINATION_ENDPOINT: 0x15,
    0x15: "Invalid destination endpoint (0x15)",
    NETWORK_ACK_FAILURE: 0x21,
    0x21: "Network ACK Failure (0x21)",
    NOT_JOINED_TO_NETWORK: 0x22,
    0x22: "Not Joined to Network (0x22)",
    SELF_ADDRESSED: 0x23,
    0x23: "Self-addressed (0x23)",
    ADDRESS_NOT_FOUND: 0x24,
    0x24: "Address Not Found (0x24)",
    ROUTE_NOT_FOUND: 0x25,
    0x25: "Route Not Found (0x25)",
    BROADCAST_SOURCE_FAILED: 0x26,
    0x26: "Broadcast source failed to hear a neighbor relay the message (0x26)",
    INVALID_BINDING_TABLE_INDEX: 0x2B,
    0x2B: "Invalid binding table index (0x2B)",
    RESOURCE_ERROR: 0x2C,
    0x2C: "Resource error lack of free buffers, timers, etc. (0x2C)",
    ATTEMPTED_BROADCAST_WITH_APS_TRANS: 0x2D,
    0x2D: "Attempted broadcast with APS transmission (0x2D)",
    ATTEMPTED_BROADCAST_WITH_APS_TRANS_EE0: 0x2D,
    0x2E: "Attempted unicast with APS transmission, but EE=0 (0x2E)",
    RESOURCE_ERROR_B: 0x32,
    0x32: "Resource error lack of free buffers, timers, etc. (0x32)",
    DATA_PAYLOAD_TOO_LARGE: 0x74,
    0x74: "Data payload too large (0x74)",
    INDIRECT_MESSAGE_UNREQUESTED: 0x75,
    0x75: "Indirect message unrequested (0x75)",
};
export const COMMAND_STATUS = {
    OK: 0x00,
    0x00: "OK (0x00)",
    ERROR: 0x01,
    0x01: "ERROR (0x01)",
    INVALID_COMMAND: 0x02,
    0x02: "Invalid Command (0x02)",
    INVALID_PARAMETER: 0x03,
    0x03: "Invalid Parameter (0x03)",
    REMOTE_CMD_TRANS_FAILURE: 0x04,
    0x04: "Remote Command Transmission Failed (0x04)",
};
export const MODEM_STATUS = {
    HARDWARE_RESET: 0x00,
    0x00: "Hardware Reset (0x00)",
    WATCHDOG_RESET: 0x01,
    0x01: "Watchdog timer reset (0x01)",
    JOINED_NETWORK: 0x02,
    0x02: "Joined Network (0x02)",
    DISASSOCIATED: 0x03,
    0x03: "Disassociated (0x03)",
    COORDINATOR_STARTED: 0x06,
    0x06: "Coordinator started (0x06)",
    SECURITY_KEY_UPDATED: 0x07,
    0x07: "Network security key was updated (0x07)",
    VOLTAGE_SUPPLY_LIMIT_EXCEEDED: 0x0D,
    0x0D: "Voltage supply limit exceeded (0x0D)",
    CONFIGURATION_CHANGED_DURING_JOIN: 0x11,
    0x11: "Modem Configuration changed while join in progress (0x11)",
    STACK_ERROR: 0x80,
    0x80: "Stack Error (0x80)",
};
export const RECEIVE_OPTIONS = {
    PACKET_ACKNOWLEDGED: 0x01,
    0x01: "Packet Acknowledged (0x01)",
    PACKET_WAS_BROADCAST: 0x02,
    0x02: "Packet was a broadcast packet (0x02)",
    PACKET_ENCRYPTED: 0x20,
    0x20: "Packet encrypted with APS encryption (0x20)",
    PACKET_SENT_FROM_END_DEVICE: 0x40,
    0x40: "Packet was sent from an end device (if known) (0x40)",
};
export const DEVICE_TYPE = {
    COORDINATOR: 0x00,
    0x00: "Coordinator (0x00)",
    ROUTER: 0x01,
    0x01: "Router (0x01)",
    END_DEVICE: 0x02,
    0x02: "End Device (0x02)",
};

export const DIGITAL_CHANNELS = {
    // Map mask to name
    MASK: {
        0: ["DIO0", "AD0"],
        1: ["DIO1", "AD1"],
        2: ["DIO2", "AD2"],
        3: ["DIO3", "AD3"],
        4: ["DIO4"],
        5: ["DIO5", "ASSOCIATE"],
        6: ["DIO6", "RTS"],
        7: ["DIO7", "CTS"],
        10: ["DIO10", "RSSI"],
        11: ["DIO11", "PWM"],
        12: ["DIO12", "CD"],
    } as const,
    PIN: {}
};
const dc = DIGITAL_CHANNELS;
export const ANALOG_CHANNELS = {
    MASK: {
        // Map mask to name
        0: ["AD0", "DIO0"],
        1: ["AD1", "DIO1"],
        2: ["AD2", "DIO2"],
        3: ["AD3", "DIO3"],
        7: ["SUPPLY"],
    } as const,
    PIN: {}
};
const ac = ANALOG_CHANNELS;
// Map pin/name to mask
// @ts-ignore
ac.PIN[20] = dc.DIO0 = dc.AD0 = 0;
// @ts-ignore
ac.PIN[19] = dc.DIO1 = dc.AD1 = 1;
// @ts-ignore
ac.PIN[18] = dc.DIO2 = dc.AD2 = 2;
// @ts-ignore
ac.PIN[17] = dc.DIO3 = dc.AD3 = 3;
// @ts-ignore
ac.PIN[11] = dc.DIO4 = 4;
// @ts-ignore
ac.PIN[15] = dc.DIO5 = dc.ASSOCIATE = 5;
// @ts-ignore
ac.PIN[16] = dc.DIO6 = dc.RTS = 6;
// @ts-ignore
ac.PIN[12] = dc.DIO7 = dc.CTS = 7;
// @ts-ignore
ac.PIN[6] = dc.DIO10 = dc.RSSI = 10;
// @ts-ignore
ac.PIN[7] = dc.DIO11 = dc.PWM = 11;
// @ts-ignore
ac.PIN[4] = dc.DIO12 = dc.CD = 12;
// @ts-ignore
// map pin/name to mask
ac.PIN[20] = ac.AD0 = ac.DIO0 = 0;
// @ts-ignore
ac.PIN[19] = ac.AD1 = ac.DIO1 = 1;
// @ts-ignore
ac.PIN[18] = ac.AD2 = ac.AD3 = 3;
// @ts-ignore
ac.PIN[17] = ac.SUPPLY = 7; // 17 True?
export const PULLUP_RESISTOR = {
    MASK: {
        // Map mask to name
        0: ["DIO4"],
        1: ["DIO3", "AD3"],
        2: ["DIO2", "AD2"],
        3: ["DIO1", "AD1"],
        4: ["DIO0", "AD0"],
        5: ["DIO6", "RTS"],
        6: ["DIO8", "DTR", "SLEEP_REQUEST"],
        7: ["DIN", "CONFIG"],
        8: ["DIO5", "ASSOCIATE"],
        9: ["DIO9", "ON"],
        10: ["DIO12"],
        11: ["DIO10", "RSSI", "PWM0"],
        12: ["DIO11", "PWM1"],
        13: ["DIO7", "CTS"],
    } as const,
    PIN: {}
};
const pr = PULLUP_RESISTOR;
// Map pin/name to maks

// @ts-ignore
pr.PIN[11] = pr.DIO4 = 0;
// @ts-ignore
pr.PIN[17] = pr.AD3 = pr.DIO3 = 1;
// @ts-ignore
pr.PIN[18] = pr.AD2 = pr.DIO2 = 2;
// @ts-ignore
pr.PIN[19] = pr.AD1 = pr.DIO1 = 3;
// @ts-ignore
pr.PIN[20] = pr.AD0 = pr.DIO0 = 4;
// @ts-ignore
pr.PIN[16] = pr.RTS = pr.DIO6 = 5;
// @ts-ignore
pr.PIN[9] = pr.DIO8 = pr.DTR = pr.SLEEP_REQUEST = 6;
// @ts-ignore
pr.PIN[3] = pr.DIN = pr.CONFIG = 7;
// @ts-ignore
pr.PIN[15] = pr.ASSOCIATE = pr.DIO5 = 8;
// @ts-ignore
pr.PIN[13] = pr.ON = pr.SLEEP = pr.DIO9 = 9;
// @ts-ignore
pr.PIN[4] = pr.DIO12 = 10;
// @ts-ignore
pr.PIN[6] = pr.PWM0 = pr.RSSI = pr.DIO10 = 11;
// @ts-ignore
pr.PIN[7] = pr.PWM1 = pr.DIO11 = 12;
// @ts-ignore
pr.PIN[12] = pr.CTS = pr.DIO7 = 13;
export const CHANGE_DETECTION = {
    MASK: {
        // Map mask to name
        0: ["DIO0"],
        1: ["DIO1"],
        2: ["DIO2"],
        3: ["DIO3"],
        4: ["DIO4"],
        5: ["DIO5"],
        6: ["DIO6"],
        7: ["DIO7"],
        8: ["DIO8"],
        9: ["DIO9"],
        10: ["DIO10"],
        11: ["DIO11"],
    },
    PIN: {
        20: 0,
        19: 1,
        18: 2,
        17: 3,
        11: 4,
        15: 5,
        16: 6,
        12: 7,
        9: 8,
        13: 9,
        6: 10,
        7: 11,
    },
    DIO0: 0,
    DIO1: 1,
    DIO2: 2,
    DIO3: 3,
    DIO4: 4,
    DIO5: 5,
    DIO6: 6,
    DIO7: 7,
    DIO8: 8,
    DIO9: 9,
    DIO10: 10,
    DIO11: 11,
} as const;
const ic = CHANGE_DETECTION;
export const PIN_MODE: Record<string, {
    UNMONITORED_INPUT?: number
    DIGITAL_INPUT?: number
    DIGITAL_OUTPUT_LOW?: number
    DIGITAL_OUTPUT_HIGH?: number
    DISABLED?: number
    RSSI_PWM?: number
    CTS_FLOW_CTRL?: number
    RS485_TX_LOW?: number
    RS485_TX_HIGH?: number
    ASSOC_LED?: number
    RTS_FLOW_CTRL?: number
    NODE_ID_ENABLED?: number
    ANALOG_INPUT?: number
}> = {};
const pm = PIN_MODE;
export const PIN_COMMAND: {
    PIN: Record<number, string>
    PWM0: string
    DIO10: string
    RSSIM: string
    DIO11: string
    PWM1: string
    DIO12: string
    DIO7: string
    CTS: string
    DIO6: string
    AD0: string
    DIO0: string
    AD1: string
    DIO1: string
    AD2: string
    DIO2: string
    AD3: string
    DIO3: string
    DIO4: string
    DIO5: string
    ASSOC: string
}  = {
    PIN: {}
} as any;
const pc = PIN_COMMAND;

// 
// Pin Modes
//
pm.P2 = pm.P1 = {
    UNMONITORED_INPUT: 0x00,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
};

pm.P0 = {
    DISABLED: 0x00,
    RSSI_PWM: 0x01,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
};

pm.D4 = {
    DISABLED: 0x00,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
};

pm.D7 = {
    DISABLED: 0x00,
    CTS_FLOW_CTRL: 0x01,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05,
    RS485_TX_LOW: 0x06,
    RS485_TX_HIGH: 0x07
};

pm.D5 = {
    DISABLED: 0x00,
    ASSOC_LED: 0x01,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
};

pm.D6 = {
    DISABLED: 0x00,
    RTS_FLOW_CTRL: 0x01,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
};

pm.D0 = pm.D1 = pm.D2 = pm.D3 = {
    DISABLED: 0x00,
    NODE_ID_ENABLED: 0x01, // Only valid for D0!
    ANALOG_INPUT: 0x02,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
};

for (let pin in pm) {
    for (let key in pm[pin]) {
        pm[pin][pm[pin][key]] = key;
    }
}

pc.PIN[6] = pc.PWM0 = pc.DIO10 = pc.RSSIM = "P0";
pc.PIN[7] = pc.DIO11 = pc.PWM1 = "P1";
pc.PIN[4] = pc.DIO12 = "P2";
pc.PIN[12] = pc.DIO7 = pc.CTS = "D7";
pc.PIN[16] = pc.DIO6 = "D6";
pc.PIN[20] = pc.AD0 = pc.DIO0 = "D0";
pc.PIN[19] = pc.AD1 = pc.DIO1 = "D1";
pc.PIN[18] = pc.AD2 = pc.DIO2 = "D2";
pc.PIN[17] = pc.AD3 = pc.DIO3 = "D3";
pc.PIN[11] = pc.DIO4 = "D4";
pc.PIN[15] = pc.DIO5 = pc.ASSOC = "D5";

export const FRAME_TYPE_SETS = {
    "802.15.4": [0x00, 0x01, 0x08, 0x09, 0x17, 0x80, 0x81, 0x82, 0x83, 0x88, 0x89, 0x8A, 0x97],
    "ZNet": [0x08, 0x09, 0x10, 0x11, 0x17, 0x88, 0x8A, 0x8B, 0x90, 0x91, 0x92, 0x94, 0x95, 0x97],
    "ZigBee": [0x08, 0x09, 0x10, 0x11, 0x17, 0x21, 0x24, 0x88, 0x8A, 0x8B, 0x90, 0x91, 0x92, 0x94, 0x95, 0x97, 0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5],
    "Any": [0x00, 0x01, 0x08, 0x09, 0x17, 0x80, 0x81, 0x82, 0x83, 0x88, 0x89, 0x8a, 0x97, 0x10, 0x11, 0x8b, 0x90, 0x91, 0x92, 0x94, 0x95, 0x21, 0x24, 0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5]
};

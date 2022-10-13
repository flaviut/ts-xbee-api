// noinspection JSUnusedGlobalSymbols

/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

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
}

export const START_BYTE = 0x7E
export const ESCAPE = 0x7D
export const XOFF = 0x13
export const XON = 0x11
export const ESCAPE_WITH = 0x20

export const UNKNOWN_16 = [0xff, 0xfe]
export const UNKNOWN_64 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff]
export const BROADCAST_16_XB = [0xff, 0xff]
export const COORDINATOR_16 = [0x00, 0x00]
export const COORDINATOR_64 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]

export const ESCAPE_BYTES = [
    START_BYTE,
    ESCAPE,
    XOFF,
    XON
]

export enum FRAME_TYPE {
    AT_COMMAND = 0x08,
    AT_COMMAND_QUEUE_PARAMETER_VALUE = 0x09,
    ZIGBEE_TRANSMIT_REQUEST = 0x10,
    EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME = 0x11,
    REMOTE_AT_COMMAND_REQUEST = 0x17,
    CREATE_SOURCE_ROUTE = 0x21,
    REGISTER_JOINING_DEVICE = 0x24,
    AT_COMMAND_RESPONSE = 0x88,
    MODEM_STATUS = 0x8A,
    ZIGBEE_TRANSMIT_STATUS = 0x8B,
    ZIGBEE_RECEIVE_PACKET = 0x90,
    ZIGBEE_EXPLICIT_RX = 0x91,
    ZIGBEE_IO_DATA_SAMPLE_RX = 0x92,
    XBEE_SENSOR_READ = 0x94,
    NODE_IDENTIFICATION = 0x95,
    REMOTE_COMMAND_RESPONSE = 0x97,
    OTA_FIRMWARE_UPDATE_STATUS = 0xA0,
    ROUTE_RECORD = 0xA1,
    DEVICE_AUTHENTICATED_INDICATOR = 0xA2,
    MTO_ROUTE_REQUEST = 0xA3,
    REGISTER_JOINING_DEVICE_STATUS = 0xA4,
    JOIN_NOTIFICATION_STATUS = 0xA5,
    // Series 1/802.15.4 Support
    TX_REQUEST_64 = 0x00,
    TX_REQUEST_16 = 0x01,
    TX_STATUS = 0x89,
    RX_PACKET_64 = 0x80,
    RX_PACKET_16 = 0x81,
    RX_PACKET_64_IO = 0x82,
    RX_PACKET_16_IO = 0x83,
}

export const FRAME_TYPE_NAME = {
    [FRAME_TYPE.AT_COMMAND]: "AT Command (0x08)",
    [FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE]: "AT Command - Queue Parameter Value (0x09)",
    [FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST]: "ZigBee Transmit Request (0x10)",
    [FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME]: "Explicit Addressing ZigBee Command Frame (0x11)",
    [FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST]: "Remote Command Request (0x17)",
    [FRAME_TYPE.CREATE_SOURCE_ROUTE]: "Create Source Route (0x21)",
    [FRAME_TYPE.REGISTER_JOINING_DEVICE]: "Register Joining Device (0x24)",
    [FRAME_TYPE.AT_COMMAND_RESPONSE]: "AT Command Response (0x88)",
    [FRAME_TYPE.MODEM_STATUS]: "Modem Status (0x8A)",
    [FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS]: "ZigBee Transmit Status (0x8B)",
    [FRAME_TYPE.ZIGBEE_RECEIVE_PACKET]: "ZigBee Receive Packet (AO=0) (0x90)",
    [FRAME_TYPE.ZIGBEE_EXPLICIT_RX]: "ZigBee Explicit Rx Indicator (AO=1) (0x91)",
    [FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX]: "ZigBee IO Data Sample Rx Indicator (0x92)",
    [FRAME_TYPE.XBEE_SENSOR_READ]: "XBee Sensor Read Indicator (AO=0) (0x94)",
    [FRAME_TYPE.NODE_IDENTIFICATION]: "Node Identification Indicator (AO=0) (0x95)",
    [FRAME_TYPE.REMOTE_COMMAND_RESPONSE]: "Remote Command Response (0x97)",
    [FRAME_TYPE.OTA_FIRMWARE_UPDATE_STATUS]: "Over-the-Air Firmware Update Status (0xA0)",
    [FRAME_TYPE.ROUTE_RECORD]: "Route Record Indicator (0xA1)",
    [FRAME_TYPE.DEVICE_AUTHENTICATED_INDICATOR]: "Device Authenticated Indicator (0xA2)",
    [FRAME_TYPE.MTO_ROUTE_REQUEST]: "Many-to-One Route Request Indicator (0xA3)",
    [FRAME_TYPE.REGISTER_JOINING_DEVICE_STATUS]: "Register Joining Device Status (0xA4)",
    [FRAME_TYPE.JOIN_NOTIFICATION_STATUS]: "Join Notification Status (0xA5)",
    [FRAME_TYPE.TX_REQUEST_64]: "TX (Transmit) Request: 64-bit address (0x00)",
    [FRAME_TYPE.TX_REQUEST_16]: "TX (Transmit) Request: 16-bit address (0x01)",
    [FRAME_TYPE.TX_STATUS]: "TX (Transmit) Status (0x89)",
    [FRAME_TYPE.RX_PACKET_64]: "RX (Receive) Packet: 64-bit Address (0x80)",
    [FRAME_TYPE.RX_PACKET_16]: "RX (Receive) Packet: 16-bit Address (0x81)",
    [FRAME_TYPE.RX_PACKET_64_IO]: "RX (Receive) Packet: 64-bit Address IO (0x82)",
    [FRAME_TYPE.RX_PACKET_16_IO]: "RX (Receive) Packet: 16-bit Address IO (0x83)",
}

export enum DISCOVERY_STATUS {
    NO_DISCOVERY_OVERHEAD = 0x00,
    ADDRESS_DISCOVERY = 0x01,
    ROUTE_DISCOVERY = 0x02,
    ADDRESS_AND_ROUTE_DISCOVERY = 0x03,
    EXTENDED_TIMEOUT_DISCOVERY = 0x40,
}

export const DISCOVERY_STATUS_NAME = {
    [DISCOVERY_STATUS.NO_DISCOVERY_OVERHEAD]: "No Discovery Overhead (0x00)",
    [DISCOVERY_STATUS.ADDRESS_DISCOVERY]: "Address Discovery (0x01)",
    [DISCOVERY_STATUS.ROUTE_DISCOVERY]: "Route Discovery (0x02)",
    [DISCOVERY_STATUS.ADDRESS_AND_ROUTE_DISCOVERY]: "Address and Route (0x03)",
    [DISCOVERY_STATUS.EXTENDED_TIMEOUT_DISCOVERY]: "Extended Timeout Discovery (0x40)",
}

export enum DELIVERY_STATUS {
    SUCCESS = 0x00,
    MAC_ACK_FAILURE = 0x01,
    CA_FAILURE = 0x02,
    INVALID_DESTINATION_ENDPOINT = 0x15,
    NETWORK_ACK_FAILURE = 0x21,
    NOT_JOINED_TO_NETWORK = 0x22,
    SELF_ADDRESSED = 0x23,
    ADDRESS_NOT_FOUND = 0x24,
    ROUTE_NOT_FOUND = 0x25,
    BROADCAST_SOURCE_FAILED = 0x26,
    INVALID_BINDING_TABLE_INDEX = 0x2B,
    RESOURCE_ERROR = 0x2C,
    ATTEMPTED_BROADCAST_WITH_APS_TRANS = 0x2D,
    ATTEMPTED_BROADCAST_WITH_APS_TRANS_EE0 = 0x2D,
    RESOURCE_ERROR_B = 0x32,
    DATA_PAYLOAD_TOO_LARGE = 0x74,
    INDIRECT_MESSAGE_UNREQUESTED = 0x75,
}

export const DELIVERY_STATUS_NAME = {
    [DELIVERY_STATUS.SUCCESS]: "Success (0x00)",
    [DELIVERY_STATUS.MAC_ACK_FAILURE]: "MAC ACK Failure (0x01)",
    [DELIVERY_STATUS.CA_FAILURE]: "CA Failure (0x02)",
    [DELIVERY_STATUS.INVALID_DESTINATION_ENDPOINT]: "Invalid destination endpoint (0x15)",
    [DELIVERY_STATUS.NETWORK_ACK_FAILURE]: "Network ACK Failure (0x21)",
    [DELIVERY_STATUS.NOT_JOINED_TO_NETWORK]: "Not Joined to Network (0x22)",
    [DELIVERY_STATUS.SELF_ADDRESSED]: "Self-addressed (0x23)",
    [DELIVERY_STATUS.ADDRESS_NOT_FOUND]: "Address Not Found (0x24)",
    [DELIVERY_STATUS.ROUTE_NOT_FOUND]: "Route Not Found (0x25)",
    [DELIVERY_STATUS.BROADCAST_SOURCE_FAILED]: "Broadcast source failed to hear a neighbor relay the message (0x26)",
    [DELIVERY_STATUS.INVALID_BINDING_TABLE_INDEX]: "Invalid binding table index (0x2B)",
    [DELIVERY_STATUS.RESOURCE_ERROR]: "Resource error lack of free buffers, timers, etc. (0x2C)",
    [DELIVERY_STATUS.ATTEMPTED_BROADCAST_WITH_APS_TRANS]: "Attempted broadcast with APS transmission (0x2D)",
    [DELIVERY_STATUS.ATTEMPTED_BROADCAST_WITH_APS_TRANS_EE0]: "Attempted unicast with APS transmission, but EE=0 (0x2E)",
    [DELIVERY_STATUS.RESOURCE_ERROR_B]: "Resource error lack of free buffers, timers, etc. (0x32)",
    [DELIVERY_STATUS.DATA_PAYLOAD_TOO_LARGE]: "Data payload too large (0x74)",
    [DELIVERY_STATUS.INDIRECT_MESSAGE_UNREQUESTED]: "Indirect message unrequested (0x75)",
}

export enum COMMAND_STATUS {
    OK = 0x00,
    ERROR = 0x01,
    INVALID_COMMAND = 0x02,
    INVALID_PARAMETER = 0x03,
    REMOTE_CMD_TRANS_FAILURE = 0x04,
}

export const COMMAND_STATUS_NAME = {
    [COMMAND_STATUS.OK]: "OK (0x00)",
    [COMMAND_STATUS.ERROR]: "ERROR (0x01)",
    [COMMAND_STATUS.INVALID_COMMAND]: "Invalid Command (0x02)",
    [COMMAND_STATUS.INVALID_PARAMETER]: "Invalid Parameter (0x03)",
    [COMMAND_STATUS.REMOTE_CMD_TRANS_FAILURE]: "Remote Command Transmission Failed (0x04)",
}

export enum MODEM_STATUS {
    HARDWARE_RESET = 0x00,
    WATCHDOG_RESET = 0x01,
    JOINED_NETWORK = 0x02,
    DISASSOCIATED = 0x03,
    COORDINATOR_STARTED = 0x06,
    SECURITY_KEY_UPDATED = 0x07,
    VOLTAGE_SUPPLY_LIMIT_EXCEEDED = 0x0D,
    CONFIGURATION_CHANGED_DURING_JOIN = 0x11,
    STACK_ERROR = 0x80,
}

export const MODEM_STATUS_NAME = {
    [MODEM_STATUS.HARDWARE_RESET]: "Hardware Reset (0x00)",
    [MODEM_STATUS.WATCHDOG_RESET]: "Watchdog timer reset (0x01)",
    [MODEM_STATUS.JOINED_NETWORK]: "Joined Network (0x02)",
    [MODEM_STATUS.DISASSOCIATED]: "Disassociated (0x03)",
    [MODEM_STATUS.COORDINATOR_STARTED]: "Coordinator started (0x06)",
    [MODEM_STATUS.SECURITY_KEY_UPDATED]: "Network security key was updated (0x07)",
    [MODEM_STATUS.VOLTAGE_SUPPLY_LIMIT_EXCEEDED]: "Voltage supply limit exceeded (0x0D)",
    [MODEM_STATUS.CONFIGURATION_CHANGED_DURING_JOIN]: "Modem Configuration changed while join in progress (0x11)",
    [MODEM_STATUS.STACK_ERROR]: "Stack Error (0x80)",
}

export enum RECEIVE_OPTIONS {
    PACKET_ACKNOWLEDGED = 0x01,
    PACKET_WAS_BROADCAST = 0x02,
    PACKET_ENCRYPTED = 0x20,
    PACKET_SENT_FROM_END_DEVICE = 0x40,
}

export const RECEIVE_OPTIONS_NAME = {
    [RECEIVE_OPTIONS.PACKET_ACKNOWLEDGED]: "Packet Acknowledged (0x01)",
    [RECEIVE_OPTIONS.PACKET_WAS_BROADCAST]: "Packet was a broadcast packet (0x02)",
    [RECEIVE_OPTIONS.PACKET_ENCRYPTED]: "Packet encrypted with APS encryption (0x20)",
    [RECEIVE_OPTIONS.PACKET_SENT_FROM_END_DEVICE]: "Packet was sent from an end device (if known) (0x40)",
}

export enum DEVICE_TYPE {
    COORDINATOR = 0x00,
    ROUTER = 0x01,
    END_DEVICE = 0x02,
}

export const DEVICE_TYPE_NAME = {
    [DEVICE_TYPE.COORDINATOR]: "Coordinator (0x00)",
    [DEVICE_TYPE.ROUTER]: "Router (0x01)",
    [DEVICE_TYPE.END_DEVICE]: "End Device (0x02)",
}

//
// Digital Channel Mask/Pins
//
export const DIGITAL_CHANNELS = {
    // Map mask to name
    MASK: {
        0: ["DIO0", "AD0"] as const,
        1: ["DIO1", "AD1"] as const,
        2: ["DIO2", "AD2"] as const,
        3: ["DIO3", "AD3"] as const,
        4: ["DIO4"] as const,
        5: ["DIO5", "ASSOCIATE"] as const,
        6: ["DIO6", "RTS"] as const,
        7: ["DIO7", "CTS"] as const,
        10: ["DIO10", "RSSI"] as const,
        11: ["DIO11", "PWM"] as const,
        12: ["DIO12", "CD"] as const,
    },

    // Map pin/name to mask
    PIN: {
        20: 0,
        19: 1,
        18: 2,
        17: 3,
        11: 4,
        15: 5,
        16: 6,
        12: 7,
        6: 10,
        7: 11,
        4: 12,
    },
    DIO0: 0,
    DIO1: 1,
    DIO2: 2,
    DIO3: 3,
    DIO4: 4,
    DIO5: 5,
    DIO6: 6,
    DIO7: 7,
    DIO10: 10,
    DIO11: 11,
    DIO12: 12,
    AD0: 0,
    AD1: 1,
    AD2: 2,
    AD3: 3,
    ASSOCIATE: 5,
    RTS: 6,
    CTS: 7,
    RSSI: 10,
    PWM: 11,
    CD: 12,
}
export type DigitalMaskKeys = keyof typeof DIGITAL_CHANNELS['MASK']
export type DigitalPins = typeof DIGITAL_CHANNELS['MASK'][DigitalMaskKeys][0]

//
// Analog Channel Mask/Pins
//
export const ANALOG_CHANNELS = {
// Map mask to name
    MASK: {
        0: ["AD0", "DIO0"] as const,
        1: ["AD1", "DIO1"] as const,
        2: ["AD2", "DIO2"] as const,
        3: ["AD3", "DIO3"] as const,
        7: ["SUPPLY"] as const,
    },
    // map pin/name to mask
    PIN: {
        20: 0,
        19: 1,
        18: 3,
        // 17 True?
        17: 7,
    },
    AD0: 0,
    AD1: 1,
    AD2: 3,
    SUPPLY: 7,
    DIO0: 0,
    DIO1: 1,
    AD3: 3,
}
export type AnalogMaskKeys = keyof typeof ANALOG_CHANNELS['MASK']
export type AnalogPins = typeof ANALOG_CHANNELS['MASK'][AnalogMaskKeys][0]

//
// Pullup-enable Mask/Pins
//
export const PULLUP_RESISTOR = {
    // Map mask to name
    MASK: {
        0: ["DIO4"] as const,
        1: ["DIO3", "AD3"] as const,
        2: ["DIO2", "AD2"] as const,
        3: ["DIO1", "AD1"] as const,
        4: ["DIO0", "AD0"] as const,
        5: ["DIO6", "RTS"] as const,
        6: ["DIO8", "DTR", "SLEEP_REQUEST"] as const,
        7: ["DIN", "CONFIG"] as const,
        8: ["DIO5", "ASSOCIATE"] as const,
        9: ["DIO9", "ON"] as const,
        10: ["DIO12"] as const,
        11: ["DIO10", "RSSI", "PWM0"] as const,
        12: ["DIO11", "PWM1"] as const,
        13: ["DIO7", "CTS"] as const,
    },
    // Map pin/name to maks
    PIN: {
        11: 0,
        17: 1,
        18: 2,
        19: 3,
        20: 4,
        16: 5,
        9: 6,
        3: 7,
        15: 8,
        13: 9,
        4: 10,
        6: 11,
        7: 12,
        12: 13,
    },
    DIO4: 0,
    AD3: 1,
    DIO3: 1,
    AD2: 2,
    DIO2: 2,
    AD1: 3,
    DIO1: 3,
    AD0: 4,
    DIO0: 4,
    RTS: 5,
    DIO6: 5,
    DIO8: 6,
    DTR: 6,
    SLEEP_REQUEST: 6,
    DIN: 7,
    CONFIG: 7,
    ASSOCIATE: 8,
    DIO5: 8,
    ON: 9,
    SLEEP: 9,
    DIO9: 9,
    DIO12: 10,
    PWM0: 11,
    RSSI: 11,
    DIO10: 11,
    PWM1: 12,
    DIO11: 12,
    CTS: 13,
    DIO7: 13
}

//
// Change Reporting Mask/Pins
//
export const CHANGE_DETECTION = {
// Map mask to name
    MASK: {
        0: ["DIO0"] as const,
        1: ["DIO1"] as const,
        2: ["DIO2"] as const,
        3: ["DIO3"] as const,
        4: ["DIO4"] as const,
        5: ["DIO5"] as const,
        6: ["DIO6"] as const,
        7: ["DIO7"] as const,
        8: ["DIO8"] as const,
        9: ["DIO9"] as const,
        10: ["DIO10"] as const,
        11: ["DIO11"] as const,
    },

// Map pin/name to mask
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
}

const PIN_MODE_p1 = {
    UNMONITORED_INPUT: 0x00,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
} as const
const PIN_MODE_d0 = {
    DISABLED: 0x00,
    NODE_ID_ENABLED: 0x01, // Only valid for D0!
    ANALOG_INPUT: 0x02,
    DIGITAL_INPUT: 0x03,
    DIGITAL_OUTPUT_LOW: 0x04,
    DIGITAL_OUTPUT_HIGH: 0x05
} as const
// Pin Modes
export const PIN_MODE = {
    P2: PIN_MODE_p1,
    P1: PIN_MODE_p1,
    P0: {
        DISABLED: 0x00,
        RSSI_PWM: 0x01,
        DIGITAL_INPUT: 0x03,
        DIGITAL_OUTPUT_LOW: 0x04,
        DIGITAL_OUTPUT_HIGH: 0x05
    },
    D4: {
        DISABLED: 0x00,
        DIGITAL_INPUT: 0x03,
        DIGITAL_OUTPUT_LOW: 0x04,
        DIGITAL_OUTPUT_HIGH: 0x05
    },
    D7: {
        DISABLED: 0x00,
        CTS_FLOW_CTRL: 0x01,
        DIGITAL_INPUT: 0x03,
        DIGITAL_OUTPUT_LOW: 0x04,
        DIGITAL_OUTPUT_HIGH: 0x05,
        RS485_TX_LOW: 0x06,
        RS485_TX_HIGH: 0x07
    },
    D5: {
        DISABLED: 0x00,
        ASSOC_LED: 0x01,
        DIGITAL_INPUT: 0x03,
        DIGITAL_OUTPUT_LOW: 0x04,
        DIGITAL_OUTPUT_HIGH: 0x05
    },
    D6: {
        DISABLED: 0x00,
        RTS_FLOW_CTRL: 0x01,
        DIGITAL_INPUT: 0x03,
        DIGITAL_OUTPUT_LOW: 0x04,
        DIGITAL_OUTPUT_HIGH: 0x05,
    },
    D0: PIN_MODE_d0,
    D1: PIN_MODE_d0,
    D2: PIN_MODE_d0,
    D3: PIN_MODE_d0,
} as const

export const PIN_COMMAND = {
    PIN: {
        6: "P0",
        7: "P1",
        4: "P2",
        12: "D7",
        16: "D6",
        20: "D0",
        19: "D1",
        18: "D2",
        17: "D3",
        11: "D4",
        15: "D5",
    },
    PWM0: "P0",
    DIO11: "P1",
    DIO12: "P2",
    DIO7: "D7",
    DIO6: "D6",
    AD0: "D0",
    AD1: "D1",
    AD2: "D2",
    AD3: "D3",
    DIO4: "D4",
    DIO5: "D5",
    DIO10: "P0",
    PWM1: "P1",
    CTS: "D7",
    DIO0: "D0",
    DIO1: "D1",
    DIO2: "D2",
    DIO3: "D3",
    ASSOC: "D5",
    RSSIM: "P0",
} as const

export const FRAME_TYPE_SETS = {
    "802.15.4": [0x00, 0x01, 0x08, 0x09, 0x17, 0x80, 0x81, 0x82, 0x83, 0x88, 0x89, 0x8A, 0x97],
    "ZNet": [0x08, 0x09, 0x10, 0x11, 0x17, 0x88, 0x8A, 0x8B, 0x90, 0x91, 0x92, 0x94, 0x95, 0x97],
    "ZigBee": [0x08, 0x09, 0x10, 0x11, 0x17, 0x21, 0x24, 0x88, 0x8A, 0x8B, 0x90, 0x91, 0x92, 0x94, 0x95, 0x97, 0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5],
    "Any": [0x00, 0x01, 0x08, 0x09, 0x17, 0x80, 0x81, 0x82, 0x83, 0x88, 0x89, 0x8a, 0x97, 0x10, 0x11, 0x8b, 0x90, 0x91, 0x92, 0x94, 0x95, 0x21, 0x24, 0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5]
}


export enum AT_COMMAND {
    // Network commands
    /** Extended PAN ID */
    ID = 'ID',
    /** Scan Channels */
    SC = 'SC',
    /** Scan Duration */
    SD = 'SD',
    /** Zigbee Stack Profile */
    ZS = 'ZS',
    /** Node Join Time */
    NJ = 'NJ',
    /** Network Watchdog Timeout */
    NW = 'NW',
    /** Coordinator Join Verification */
    JV = 'JV',
    /** Join Notification */
    JN = 'JN',
    /** Operating Extended PAN ID */
    OP = 'OP',
    /** Operating 16-bit PAN ID */
    OI = 'OI',
    /** Operating Channel */
    CH = 'CH',
    /** Number of Remaining Children */
    NC = 'NC',
    /** Coordinator Enable */
    CE = 'CE',
    /** Miscellaneous Device Options */
    DO = 'DO',
    /** Joining Device Controls */
    DC = 'DC',
    /** Initial 16-bit PAN ID */
    II = 'II',
    /** Energy Detect */
    ED = 'ED',

// Addressing commands
    /** Serial Number High */
    SH = 'SH',
    /** Serial Number Low */
    SL = 'SL',
    /** 16-bit Network Address */
    MY = 'MY',
    /** 16-bit Parent Network Address */
    MP = 'MP',
    /** Destination Address High */
    DH = 'DH',
    /** Destination Address Low */
    DL = 'DL',
    /** Node Identifier */
    NI = 'NI',
    /** Maximum Unicast Hops */
    NH = 'NH',
    /** Broadcast Hops */
    BH = 'BH',
    /** Aggregate Routing Notification */
    AR = 'AR',
    /** Device Type Identifier */
    DD = 'DD',
    /** Node Discover Timeout */
    NT = 'NT',
    /** Network Discovery Options */
    NO = 'NO',
    /** Maximum Packet Payload Bytes */
    NP = 'NP',
    /** Conflict Report */
    CR = 'CR',

// Zigbee addressing commands
    /** Source Endpoint */
    SE = 'SE',
    /** Destination Endpoint */
    DE = 'DE',
    /** Cluster ID */
    CI = 'CI',
    /** Transmit Options */
    TO = 'TO',

// RF interfacing commands
    /** TX Power Level */
    PL = 'PL',
    /** Power at PL4 */
    PP = 'PP',
    /** Power Mode */
    PM = 'PM',

// Security commands
    /** Encryption Enable */
    EE = 'EE',
    /** Encryption Options */
    EO = 'EO',
    /** Link Key */
    KY = 'KY',
    /** Trust Center Network Key */
    NK = 'NK',

// Serial interfacing commands
    /** Interface Data Rate */
    BD = 'BD',
    /** Parity */
    NB = 'NB',
    /** Stop Bits */
    SB = 'SB',
    /** Packetization Timeout */
    RO = 'RO',
    /** DIO6/RTS */
    D6 = 'D6',
    /** DIO7/CTS */
    D7 = 'D7',
    /** API Enable */
    AP = 'AP',
    /** API Options */
    AO = 'AO',

// Command mode options
    /** Command Mode Timeout */
    CT = 'CT',
    /** Guard Times */
    GT = 'GT',
    /** Command Character */
    CC = 'CC',
    /** Exit Command mode */
    CN = 'CN',

// Sleep commands
    /** Sleep Period */
    SP = 'SP',
    /** Number of Cycles Between ON_SLEEP */
    SN = 'SN',
    /** Sleep Mode */
    SM = 'SM',
    /** Time before Sleep */
    ST = 'ST',
    /** Sleep Options */
    SO = 'SO',
    /** Wake Host Delay */
    WH = 'WH',
    /** Polling Rate */
    PO = 'PO',

// I/O settings commands
    /** AD0/DIO0 Configuration */
    D0 = 'D0',
    /** AD1/DIO1/PTI_En Configuration */
    D1 = 'D1',
    /** AD2/DIO2 Configuration */
    D2 = 'D2',
    /** AD3/DIO3 Configuration */
    D3 = 'D3',
    /** DIO4 Configuration */
    D4 = 'D4',
    /** DIO5/Associate Configuration */
    D5 = 'D5',
    /** DIO8/DTR/SLP_RQ */
    D8 = 'D8',
    /** DIO9/ON_SLEEP */
    D9 = 'D9',
    /** RSSI/PWM0 Configuration */
    P0 = 'P0',
    /** DIO11/PWM1 Configuration */
    P1 = 'P1',
    /** DIO12 Configuration */
    P2 = 'P2',
    /** DIO13/DOUT Configuration */
    P3 = 'P3',
    /** DIO14/DIN */
    P4 = 'P4',
    /** DIO15/SPI_MISO */
    P5 = 'P5',
    /** SPI_MOSI Configuration */
    P6 = 'P6',
    /** DIO17/SPI_SSEL  */
    P7 = 'P7',
    /** DIO18/SPI_SCLK */
    P8 = 'P8',
    /** DIO19/SPI_ATTN/PTI_DATA */
    P9 = 'P9',
    /** Pull-up/Down Resistor Enable */
    PR = 'PR',
    /** Pull Up/Down Direction */
    PD = 'PD',
    /** Associate LED Blink Time */
    LT = 'LT',
    /** RSSI PWM Timer */
    RP = 'RP',

// I/O sampling commands
    /** I/O Sample Rate */
    IR = 'IR',
    /** Digital Change Detection */
    IC = 'IC',
    /** Voltage Supply Monitoring */
    V_PLUS = 'V+',

// Diagnostic commands
    /** Firmware Version */
    VR = 'VR',
    /** Hardware Version */
    HV = 'HV',
    /** Association Indication */
    AI = 'AI',
    /** Voltage Supply Monitoring */
    PERCENT_V = '%V',
    /** Received Signal Strength */
    DB = 'DB',
    /** Temperature */
    TP = 'TP',
    /** Version Long */
    VL = 'VL',

// Execution commands
    /** Apply Changes */
    AC = 'AC',
    /** Active Scan */
    AS = 'AS',
    /** Write */
    WR = 'WR',
    /** Restore Defaults */
    RE = 'RE',
    /** Software Reset */
    FR = 'FR',
    /** Network Reset */
    NR = 'NR',
    /** Sleep Immediately */
    SI = 'SI',
    /** Commissioning Pushbutton */
    CB = 'CB',
    /** Clear Binding and Group Tables */
    AMP_X = '&X',
    /** Node Discovery */
    ND = 'ND',
    /** Destination Node */
    DN = 'DN',
    /** Disable Joining */
    DJ = 'DJ',
    /** Force Sample */
    IS = 'IS',

}

type Uint8 = number;
type Uint16 = number;

export type NodeIdentification<BufferType> = {
    remote16: BufferType,  // 16-bit
    remote64: BufferType,  // 64-bit
    nodeIdentifier: string,
} & ({} | {
    remoteParent16: BufferType,  // 8-bit
    deviceType: Uint8,
    sourceEvent: Uint8,
    digiProfileID: BufferType,  // 8-bit
    digiManufacturerID: BufferType,  // 8-bit
})

type LegacyChannelsKey =
    `ADC${0 | 1 | 2 | 3 | 4 | 5}`
    | `DIO${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`

export type XBeeFrame = ({
    type: FRAME_TYPE.CREATE_SOURCE_ROUTE,
    /** sequence number of the frame */
    id: Uint8,
    destination64: string,  // 64-bit
    destination16: string,  // 16-bit
    addresses: number[], // max 30 addresses, 16 bit integer addresses
} | {
    type: FRAME_TYPE.NODE_IDENTIFICATION
    sender64: string,  // 64-bit
    sender16: string,  // 16-bit
    receiveOptions: Uint8
} & NodeIdentification<string>) | {
    type: FRAME_TYPE.ZIGBEE_RECEIVE_PACKET,
    remote64: string,  // 64-bit
    remote16: string,  // 16-bit
    receiveOptions: number,
    data: Buffer,
} | {
    type: FRAME_TYPE.ZIGBEE_EXPLICIT_RX
    remote64: string,  // 64-bit
    remote16: string,  // 16-bit
    sourceEndpoint: string,  // 8-bit
    destinationEndpoint: string,  // 8-bit
    clusterId: string,  // 16-bit
    profileId: string,  // 16-bit
    receiveOptions: Uint8,
    data: Buffer,
} | {
    type: FRAME_TYPE.XBEE_SENSOR_READ
    remote64: string,  // 64-bit
    remote16: string,  // 16-bit
    receiveOptions: Uint8,
    sensors: Uint8,
    sensorValues: {
        AD0: number
        AD1: number
        AD2: number
        AD3: number
        T: number
        temperature?: number
        relativeHumidity?: number
        trueHumidity?: number
        waterPresent: boolean
    }
} | {
    type: FRAME_TYPE.MODEM_STATUS,
    modemStatus: number,
} | ({
    type: FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX
    remote64: string,  // 64-bit
    remote16: string,  // 16-bit
    receiveOptions: Uint8,
} & ({} | {
    receiveOptions: 0,
    digitalSamples: { [k in DigitalPins]?: number },
    analogSamples: { [k in AnalogPins]?: number },
    numSamples: Uint8,
})) | {
    type: FRAME_TYPE.OTA_FIRMWARE_UPDATE_STATUS
} | {
    type: FRAME_TYPE.MTO_ROUTE_REQUEST
} | ({
    // aka Local AT Command Response
    type: FRAME_TYPE.AT_COMMAND_RESPONSE,
    /** sequence number of the frame */
    id: Uint8,
    command: AT_COMMAND,
    commandStatus: Uint8,
} & ({
    nodeIdentification: NodeIdentification<string>
} | {
    commandData: Buffer,
})) | ({
    type: FRAME_TYPE.REMOTE_COMMAND_RESPONSE
    /** sequence number of the frame */
    id: Uint8,
    remote64: string,  // 64-bit
    remote16: string,  // 16-bit
    command: AT_COMMAND,
    commandStatus: Uint8,  // 0 means success
} & ({
    nodeIdentification: NodeIdentification<string>
} | {
    commandData: Buffer,
})) | {
    // aka Extended Transmit Status
    type: FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
    /** sequence number of the frame */
    id: Uint8,
    destination64: string,  // 64-bit
    destination16: string,  // 16-bit
    broadcastRadius: Uint8,
    options: Uint8,
    data: Buffer,
} | {
    type: FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
    /** sequence number of the frame */
    id: Uint8,
    remote16: string,  // 16-bit
    transmitRetryCount: number,
    deliveryStatus: number,
    discoveryStatus: number,
} | {
    type: FRAME_TYPE.ROUTE_RECORD
    remote64: string,  // 64-bit
    remote16: string,  // 16-bit
    receiveOptions: Uint8,
    hopCount: Uint8,
    addresses: Uint16[],
} | {
    type: FRAME_TYPE.AT_COMMAND
    /** sequence number of the frame */
    id: Uint8,
    command: AT_COMMAND,
    commandParameter: Buffer, // Can either be string or byte array.
} | {
    type: FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE
    /** sequence number of the frame */
    id: Uint8,
    command: AT_COMMAND,
    commandParameter: Buffer,
} | {
    type: FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST
    /** sequence number of the frame */
    id: Uint8,
    destination64: string,  // 64-bit
    destination16: string,  // 16-bit
    remoteCommandOptions: Uint8,
    command: AT_COMMAND,
    commandParameter: Buffer,
} | {
    type: FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME
    /** sequence number of the frame */
    id: Uint8,
    destination64: string,  // 64-bit
    destination16: string,  // 16-bit
    sourceEndpoint: Uint8,
    destinationEndpoint: Uint8,
    clusterId: Uint16,
    profileId: Uint16,
    broadcastRadius: Uint8,
    options: Uint8,
    data: Buffer,
} | {
    type: FRAME_TYPE.TX_REQUEST_64,
    /** sequence number of the frame */
    id: Uint8,
    destination64: string,  // 64-bit
    options: number, // 0x00 is default
    data: Buffer,
} | {
    type: FRAME_TYPE.TX_REQUEST_16,
    /** sequence number of the frame */
    id: Uint8,
    destination16: string,  // 16-bit
    options: number, // 0x00 is default
    data: Buffer,
} | {
    type: FRAME_TYPE.TX_STATUS,
    /** sequence number of the frame */
    id: Uint8,
    deliveryStatus: Uint8,
} | {
    type: FRAME_TYPE.RX_PACKET_64,
    remote64: string,  // 64-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: Buffer,
} | {
    type: FRAME_TYPE.RX_PACKET_16,
    remote16: string,  // 16-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: Buffer,
} | {
    type: FRAME_TYPE.RX_PACKET_64_IO,
    remote64: string,  // 64-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: Buffer,
} | {
    type: FRAME_TYPE.RX_PACKET_16_IO,
    remote16: string,  // 16-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: {
        sampleQuantity: Uint8,
        channelMask: Uint16
        channels: { [k in LegacyChannelsKey]?: number },
        analogSamples: Array<Partial<Record<LegacyChannelsKey, Uint16>>>,
        digitalSamples: string[],
    },
}

type BufferConstructable =
    Buffer
    | string
    | Uint8Array
    | ArrayBuffer
    | SharedArrayBuffer
    | ReadonlyArray<number>
/**
 * The input to the XBee frame builder.
 *
 * Note: when there is a string in a fixed-length field, it will be interpreted as a hex string.
 */
export type XBeeFrameInput = {
    type: FRAME_TYPE.AT_COMMAND
    /** sequence number of the frame */
    id?: Uint8,
    command: AT_COMMAND,
    commandParameter: BufferConstructable, // Can either be string or byte array.
} | {
    type: FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE
    /** sequence number of the frame */
    id?: Uint8,
    command: AT_COMMAND,
    commandParameter: BufferConstructable,
} | {
    type: FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST
    /** sequence number of the frame */
    id?: Uint8,
    destination64?: BufferConstructable,  // 64-bit, optional, default UNKNOWN_64
    destination16?: BufferConstructable,  // 16-bit, optional, default UNKNOWN_16
    remoteCommandOptions?: number, // optional, 0x02 is default
    command: AT_COMMAND,
    commandParameter: BufferConstructable,
} | {
    type: FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME
    /** sequence number of the frame */
    id?: Uint8,
    destination64?: BufferConstructable,  // 64-bit, optional, default UNKNOWN_64
    destination16?: BufferConstructable,  // 16-bit, optional, default UNKNOWN_16
    sourceEndpoint: Uint8,
    destinationEndpoint: Uint8,
    clusterId: Uint16 | BufferConstructable,  // 16-bit
    profileId: Uint16 | BufferConstructable,  // 16-bit
    broadcastRadius?: Uint8,  // default 0
    options?: Uint8,  // default 0
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.CREATE_SOURCE_ROUTE,
    /** sequence number of the frame */
    id?: Uint8,
    destination64: BufferConstructable,  // 64-bit
    destination16: BufferConstructable,  // 16-bit
    addresses: number[], // max 30 addresses, 16 bit integer addresses
} | {
    type: FRAME_TYPE.TX_REQUEST_64,
    /** sequence number of the frame */
    id?: Uint8,
    destination64?: BufferConstructable,  // 64-bit
    options?: number, // 0x00 is default
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.TX_REQUEST_16,
    /** sequence number of the frame */
    id?: Uint8,
    destination16?: BufferConstructable,  // 16-bit
    options?: number, // 0x00 is default
    data: BufferConstructable,
} | ({
    type: FRAME_TYPE.NODE_IDENTIFICATION
    sender64: BufferConstructable,  // 64-bit
    sender16: BufferConstructable,  // 16-bit
    receiveOptions: Uint8
} & NodeIdentification<BufferConstructable>
    ) | {
    type: FRAME_TYPE.ZIGBEE_RECEIVE_PACKET,
    remote64: BufferConstructable,  // 64-bit
    remote16: BufferConstructable,  // 16-bit
    receiveOptions: number,
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.ZIGBEE_EXPLICIT_RX
    remote64: BufferConstructable,  // 64-bit
    remote16: BufferConstructable,  // 16-bit
    sourceEndpoint: string,
    destinationEndpoint: string,
    clusterId: BufferConstructable,  // 16-bit
    profileId: BufferConstructable,  // 16-bit
    receiveOptions: Uint8,
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.XBEE_SENSOR_READ
    remote64: BufferConstructable,  // 64-bit
    remote16: BufferConstructable,  // 16-bit
    receiveOptions: Uint8,
    sensors: Uint8,
    sensorValues: {
        AD0: number
        AD1: number
        AD2: number
        AD3: number
        T: number
        temperature?: number
        relativeHumidity?: number
        trueHumidity?: number
        waterPresent: boolean
    }
} | {
    type: FRAME_TYPE.MODEM_STATUS,
    modemStatus: number,
} | {
    type: FRAME_TYPE.RX_PACKET_64,
    remote64: BufferConstructable,  // 64-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.RX_PACKET_16,
    remote16: BufferConstructable,  // 16-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.RX_PACKET_64_IO,
    remote64: BufferConstructable,  // 64-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.RX_PACKET_16_IO,
    remote16: BufferConstructable,  // 16-bit
    rssi: Uint8,
    receiveOptions: Uint8,
    data: {
        sampleQuantity: Uint8,
        channelMask: Uint16
        channels: { [k in LegacyChannelsKey]?: number },
        analogSamples: Array<Partial<Record<LegacyChannelsKey, Uint16>>>,
        digitalSamples: string[],
    },
} | {
    type: FRAME_TYPE.ROUTE_RECORD
    remote64: BufferConstructable,  // 64-bit
    remote16: BufferConstructable,  // 16-bit
    receiveOptions: Uint8,
    hopCount: Uint8,
    addresses: Uint16[],
} | ({
    type: FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX
    remote64: BufferConstructable,  // 64-bit
    remote16: BufferConstructable,  // 16-bit
    receiveOptions: Uint8,
} & ({} | {
    digitalSamples: { [k in DigitalPins]?: number },
    analogSamples: { [k in AnalogPins]?: number },
    numSamples: Uint8,
})) | {
    type: FRAME_TYPE.OTA_FIRMWARE_UPDATE_STATUS
} | {
    type: FRAME_TYPE.MTO_ROUTE_REQUEST
} | {
    // aka Local AT Command Response
    type: FRAME_TYPE.AT_COMMAND_RESPONSE,
    /** sequence number of the frame */
    id?: Uint8,
    command: AT_COMMAND,
    commandStatus: Uint8,
    commandData?: Buffer,
    nodeIdentification?: NodeIdentification<BufferConstructable>,
} | {
    // aka Extended Transmit Status
    type: FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
    /** sequence number of the frame */
    id?: Uint8,
    destination64: BufferConstructable,  // 64-bit
    destination16: BufferConstructable,  // 16-bit
    broadcastRadius: Uint8,
    options: Uint8,
    data: BufferConstructable,
} | {
    type: FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
    /** sequence number of the frame */
    id?: Uint8,
    remote16: BufferConstructable,  // 16-bit
    transmitRetryCount: number,
    deliveryStatus: number,
    discoveryStatus: number,
} | ({
    type: FRAME_TYPE.REMOTE_COMMAND_RESPONSE
    /** sequence number of the frame */
    id?: Uint8,
    remote64: BufferConstructable,  // 64-bit
    remote16: BufferConstructable,  // 16-bit
    command: AT_COMMAND,
    commandStatus: Uint8,  // 0 means success
} & ({
    commandData: BufferConstructable
} | {
    nodeIdentification: NodeIdentification<BufferConstructable>
} | {
    digitalSamples: { [k in DigitalPins]?: number },
    analogSamples: { [k in AnalogPins]?: number },
    numSamples: Uint8,
})) | {
    type: FRAME_TYPE.TX_STATUS,
    /** sequence number of the frame */
    id?: Uint8,
    deliveryStatus: Uint8,
}

export type SpecificXbeeFrame<FT extends FRAME_TYPE> = Extract<XBeeFrame, { type: FT }>
export type SpecificXbeeFrameInput<FT extends FRAME_TYPE> = Extract<XBeeFrameInput, { type: FT }>

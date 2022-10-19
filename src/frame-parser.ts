/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */

import * as C from './constants'
import BufferReader from 'buffer-reader'

const parseNodeIdentificationPayload = function (frame, reader: BufferReader) {
    frame.remote16 = reader.nextString(2, 'hex')
    frame.remote64 = reader.nextString(8, 'hex')

    // Extract the NI string from the buffer
    frame.nodeIdentifier = reader.nextStringZero('ascii')

    if (reader.buf.length > reader.tell()) {
        frame.remoteParent16 = reader.nextString(2, 'hex')
        frame.deviceType = reader.nextUInt8()
        frame.sourceEvent = reader.nextUInt8()
        frame.digiProfileID = reader.nextString(2, 'hex')
        frame.digiManufacturerID = reader.nextString(2, 'hex')
    }
}

const ParseIOSamplePayload = function (frame, reader: BufferReader, options) {
    frame.digitalSamples = {}
    frame.analogSamples = {}
    frame.numSamples = 0
    // When parsing responses to ATIS, there is no data to parse if IO lines are not enabled
    if (frame.commandStatus !== undefined && frame.commandStatus !== 0) return
    frame.numSamples = reader.nextUInt8()
    const mskD = reader.nextUInt16BE()
    const mskA = reader.nextUInt8()

    if (mskD > 0) {
        const valD = reader.nextUInt16BE()
        for (const dbit of Object.keys(C.DIGITAL_CHANNELS.MASK).map(Number)) {
            if ((mskD & (1 << dbit)) >> dbit) {
                frame.digitalSamples[C.DIGITAL_CHANNELS.MASK[dbit][0]] = (valD & (1 << dbit)) >> dbit
            }
        }
    }

    if (mskA > 0) {
        for (const abit of Object.keys(C.ANALOG_CHANNELS.MASK).map(Number)) {
            if ((mskA & (1 << abit)) >> abit) {
                const valA = reader.nextUInt16BE()

                if (!options.convert_adc) {
                    frame.analogSamples[C.ANALOG_CHANNELS.MASK[abit][0]] = valA
                } else {
                    // Convert to mV, resolution is < 1mV, so rounding is OK
                    frame.analogSamples[C.ANALOG_CHANNELS.MASK[abit][0]] = Math.round((valA * options.vref_adc) / 1023)
                }
            }
        }
    }
}

// Series 1 Support
const received16BitPacketIO = function (frame, reader: BufferReader) {
    let hasDigital = 0
    const data = {
        sampleQuantity: reader.nextUInt8(),
        channelMask: reader.nextUInt16BE(),
        channels: {},
        analogSamples: [],
        digitalSamples: [],
    }

    //analog channels
    for (let a = 0; a <= 5; a++) {
        // exponent looks odd here because analog pins start at 0000001000000000
        if (Boolean(data.channelMask & Math.pow(2, a + 9))) {
            data.channels['ADC' + a] = 1
        }
    }

    // if any of the DIO pins are active, parse the digital samples
    // 0x1ff = 0000000111111111
    if (data.channelMask & 0x1ff) {
        hasDigital = 1
        for (let i = 0; i < data.sampleQuantity; i++) {
            data.digitalSamples.push(reader.nextUInt16BE().toString(2))
        }

        //digital channels
        for (let d = 0; d <= 8; d++) {
            if (Boolean(data.channelMask & Math.pow(2, d))) {
                data.channels['DIO' + d] = 1
            }
        }
    }

    for (let si = 0; si < data.sampleQuantity; si++) {
        const sample = {}
        for (let j = 0; j <= 5; j++) {
            if (data.channels['ADC' + j]) {
                // starts at the 7th byte and moved down by the Digital Samples section
                sample['ADC' + j] = reader.nextUInt16BE()
            }
        }
        data.analogSamples.push(sample)
    }

    frame.data = data
}

type Uint8 = number
type Uint16 = number

const parseAtCommand = (frame: {
    type: C.FRAME_TYPE.AT_COMMAND
    /** sequence number of the frame */
    id: Uint8,
    command: C.AT_COMMAND,
    commandParameter: Buffer, // Can either be string or byte array.
} | {
    type: C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE
    /** sequence number of the frame */
    id: Uint8,
    command: C.AT_COMMAND,
    commandParameter: Buffer,
}, reader: BufferReader) => {
    frame.id = reader.nextUInt8()
    frame.command = reader.nextString(2, 'ascii')
    frame.commandParameter = reader.nextAll()
}
type LegacyChannelsKey =
    `ADC${0 | 1 | 2 | 3 | 4 | 5}`
    | `DIO${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`

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

const frame_parser = {
    [C.FRAME_TYPE.NODE_IDENTIFICATION]: (frame: ({
        type: C.FRAME_TYPE.NODE_IDENTIFICATION
        sender64: string,  // 64-bit
        sender16: string,  // 16-bit
        receiveOptions: Uint8
    } & NodeIdentification<string>), reader: BufferReader) => {
        frame.sender64 = reader.nextString(8, 'hex')
        frame.sender16 = reader.nextString(2, 'hex')
        frame.receiveOptions = reader.nextUInt8()
        parseNodeIdentificationPayload(frame, reader)
    },

    [C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET]: (frame: {
        type: C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET,
        remote64: string,  // 64-bit
        remote16: string,  // 16-bit
        receiveOptions: number,
        data: Buffer,
    }, reader: BufferReader) => {
        frame.remote64 = reader.nextString(8, 'hex')
        frame.remote16 = reader.nextString(2, 'hex')
        frame.receiveOptions = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX]: (frame: {
        type: C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX
        remote64: string,  // 64-bit
        remote16: string,  // 16-bit
        sourceEndpoint: string,  // 8-bit
        destinationEndpoint: string,  // 8-bit
        clusterId: string,  // 16-bit
        profileId: string,  // 16-bit
        receiveOptions: Uint8,
        data: Buffer,
    }, reader: BufferReader) => {
        frame.remote64 = reader.nextString(8, 'hex')
        frame.remote16 = reader.nextString(2, 'hex')
        frame.sourceEndpoint = reader.nextString(1, 'hex')
        frame.destinationEndpoint = reader.nextString(1, 'hex')
        frame.clusterId = reader.nextString(2, 'hex')
        frame.profileId = reader.nextString(2, 'hex')
        frame.receiveOptions = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.XBEE_SENSOR_READ]: (frame: {
        type: C.FRAME_TYPE.XBEE_SENSOR_READ
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
    }, reader: BufferReader) => {
        frame.remote64 = reader.nextString(8, 'hex')
        frame.remote16 = reader.nextString(2, 'hex')
        frame.receiveOptions = reader.nextUInt8()
        frame.sensors = reader.nextUInt8()
        frame.sensorValues = {
            AD0: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
            AD1: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
            AD2: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
            AD3: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
            T: reader.nextUInt16BE(),
            temperature: undefined,
            relativeHumidity: undefined,
            trueHumidity: undefined,
            waterPresent: frame.sensors === 0x60
        }

        if (frame.sensors === 2 || frame.sensors === 3) {
            if (frame.sensorValues.T < 2048) {
                frame.sensorValues.temperature = frame.sensorValues.T / 16
            } else {
                frame.sensorValues.temperature = -(frame.sensorValues.T & 0x7ff) / 16
            }
        }

        if (frame.sensors === 1 || frame.sensors === 3) {
            frame.sensorValues.relativeHumidity = Math.round(100 *
                (((frame.sensorValues.AD3 / frame.sensorValues.AD2) -
                    0.16) / (0.0062))) / 100
        }

        if (frame.sensors === 3) {
            frame.sensorValues.trueHumidity = Math.round(100 *
                (frame.sensorValues.relativeHumidity / (1.0546 -
                    (0.00216 * frame.sensorValues.temperature)))) / 100
        }

    },

    [C.FRAME_TYPE.MODEM_STATUS]: (frame: {
        type: C.FRAME_TYPE.MODEM_STATUS,
        modemStatus: number,
    }, reader: BufferReader) => {
        frame.modemStatus = reader.nextUInt8()
    },

    [C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX]: (frame: ({
        type: C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX
        remote64: string,  // 64-bit
        remote16: string,  // 16-bit
        receiveOptions: Uint8,
    } & ({} | {
        receiveOptions: 0,
        digitalSamples: Record<number, number>,
        analogSamples: Record<number, number>,
        numSamples: Uint8,
    })), reader, options) => {
        frame.remote64 = reader.nextString(8, 'hex')
        frame.remote16 = reader.nextString(2, 'hex')
        frame.receiveOptions = reader.nextUInt8()
        ParseIOSamplePayload(frame, reader, options)
    },

    [C.FRAME_TYPE.AT_COMMAND_RESPONSE]: (frame: ({
        // aka Local AT Command Response
        type: C.FRAME_TYPE.AT_COMMAND_RESPONSE,
        id: Uint8,
        commandStatus: Uint8,
    } & ({
        command: C.AT_COMMAND.ND,
        nodeIdentification: NodeIdentification<string>
    } | {
        command: Exclude<C.AT_COMMAND, C.AT_COMMAND.ND>,
        commandData: Buffer,
    })), reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.command = reader.nextString(2, 'ascii')
        frame.commandStatus = reader.nextUInt8()
        if ((frame.command === "ND") && (frame.commandStatus === C.COMMAND_STATUS.OK) && (reader.buf.length > reader.tell())) {
            (frame as any).nodeIdentification = {}
            parseNodeIdentificationPayload((frame as any).nodeIdentification, reader)
        } else {
            (frame as any).commandData = reader.nextAll()
        }
    },

    [C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE]: (frame: ({
        type: C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE
        /** sequence number of the frame */
        id: Uint8,
        remote64: string,  // 64-bit
        remote16: string,  // 16-bit
        commandStatus: Uint8,  // 0 means success
    } & ({
        command: C.AT_COMMAND.ND,
        nodeIdentification: NodeIdentification<string>
    } | {
        command: Exclude<C.AT_COMMAND, C.AT_COMMAND.ND>,
        commandData: Buffer,
    })), reader, options) => {
        frame.id = reader.nextUInt8()
        frame.remote64 = reader.nextString(8, 'hex')
        frame.remote16 = reader.nextString(2, 'hex')
        frame.command = reader.nextString(2, 'ascii')
        frame.commandStatus = reader.nextUInt8()
        if (frame.command === "IS") {
            ParseIOSamplePayload(frame, reader, options)
        } else if ((frame.command === "ND") && (frame.commandStatus === C.COMMAND_STATUS.OK)) {
            (frame as any).nodeIdentification = {}
            parseNodeIdentificationPayload((frame as any).nodeIdentification, reader)
        } else {
            (frame as any).commandData = reader.nextAll()
        }
    },

    [C.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS]: (frame: {
        type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
        /** sequence number of the frame */
        id: Uint8,
        remote16: string,  // 16-bit
        transmitRetryCount: number,
        deliveryStatus: number,
        discoveryStatus: number,
    }, reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.remote16 = reader.nextString(2, 'hex')
        frame.transmitRetryCount = reader.nextUInt8()
        frame.deliveryStatus = reader.nextUInt8()
        frame.discoveryStatus = reader.nextUInt8()
    },

    [C.FRAME_TYPE.ROUTE_RECORD]: (frame: {
        type: C.FRAME_TYPE.ROUTE_RECORD
        remote64: string,  // 64-bit
        remote16: string,  // 16-bit
        receiveOptions: Uint8,
        hopCount: Uint8,
        addresses: Uint16[],
    }, reader: BufferReader) => {
        frame.remote64 = reader.nextString(8, 'hex')
        frame.remote16 = reader.nextString(2, 'hex')
        frame.receiveOptions = reader.nextUInt8()
        frame.hopCount = reader.nextUInt8()
        frame.addresses = []
        for (let i = 0; i < frame.hopCount; i++) {
            frame.addresses.push(reader.nextUInt16BE())
        }
    },

    [C.FRAME_TYPE.AT_COMMAND]: parseAtCommand,
    [C.FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE]: parseAtCommand,

    [C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST]: (frame: {
        type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST
        /** sequence number of the frame */
        id: Uint8,
        destination64: string,  // 64-bit
        destination16: string,  // 16-bit
        remoteCommandOptions: Uint8,
        command: C.AT_COMMAND,
        commandParameter: Buffer,
    }, reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.destination64 = reader.nextString(8, 'hex')
        frame.destination16 = reader.nextString(2, 'hex')
        frame.remoteCommandOptions = reader.nextUInt8()
        frame.command = reader.nextString(2, 'ascii')
        frame.commandParameter = reader.nextAll()
    },

    [C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST]: (frame: {
        // aka Extended Transmit Status
        type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
        /** sequence number of the frame */
        id: Uint8,
        destination64: string,  // 64-bit
        destination16: string,  // 16-bit
        broadcastRadius: Uint8,
        options: Uint8,
        data: Buffer,
    }, reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.destination64 = reader.nextString(8, 'hex')
        frame.destination16 = reader.nextString(2, 'hex')
        frame.broadcastRadius = reader.nextUInt8()
        frame.options = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME]: (frame: {
        type: C.FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME
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
    }, reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.destination64 = reader.nextString(8, 'hex')
        frame.destination16 = reader.nextString(2, 'hex')
        frame.sourceEndpoint = reader.nextUInt8()
        frame.destinationEndpoint = reader.nextUInt8()
        frame.clusterId = reader.nextUInt16BE()
        frame.profileId = reader.nextUInt16BE()
        frame.broadcastRadius = reader.nextUInt8()
        frame.options = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.TX_REQUEST_64]: (frame: {
        type: C.FRAME_TYPE.TX_REQUEST_64,
        /** sequence number of the frame */
        id: Uint8,
        destination64: string,  // 64-bit
        options: number, // 0x00 is default
        data: Buffer,
    }, reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.destination64 = reader.nextString(8, 'hex')
        frame.options = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.TX_REQUEST_16]: (frame: {
        type: C.FRAME_TYPE.TX_REQUEST_16,
        /** sequence number of the frame */
        id: Uint8,
        destination16: string,  // 16-bit
        options: number, // 0x00 is default
        data: Buffer,
    }, reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.destination16 = reader.nextString(2, 'hex')
        frame.options = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.TX_STATUS]: (frame: {
        type: C.FRAME_TYPE.TX_STATUS,
        /** sequence number of the frame */
        id: Uint8,
        deliveryStatus: Uint8,
    }, reader: BufferReader) => {
        frame.id = reader.nextUInt8()
        frame.deliveryStatus = reader.nextUInt8()
    },

    [C.FRAME_TYPE.RX_PACKET_64]: (frame: {
        type: C.FRAME_TYPE.RX_PACKET_64,
        remote64: string,  // 64-bit
        rssi: Uint8,
        receiveOptions: Uint8,
        data: Buffer,
    }, reader: BufferReader) => {
        frame.remote64 = reader.nextString(8, 'hex')
        frame.rssi = reader.nextUInt8()
        frame.receiveOptions = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.RX_PACKET_16]: (frame: {
        type: C.FRAME_TYPE.RX_PACKET_16,
        remote16: string,  // 16-bit
        rssi: Uint8,
        receiveOptions: Uint8,
        data: Buffer,
    }, reader: BufferReader) => {
        frame.remote16 = reader.nextString(2, 'hex')
        frame.rssi = reader.nextUInt8()
        frame.receiveOptions = reader.nextUInt8()
        frame.data = reader.nextAll()
    },

    [C.FRAME_TYPE.RX_PACKET_64_IO]: (frame: {
        type: C.FRAME_TYPE.RX_PACKET_64_IO,
        remote64: string,  // 64-bit
        rssi: Uint8,
        receiveOptions: Uint8,
        data: Buffer,
    }, reader: BufferReader) => {
        frame.remote64 = reader.nextString(8, 'hex')
        frame.rssi = reader.nextUInt8()
        frame.receiveOptions = reader.nextUInt8()
        frame.data = reader.nextAll()
        // TODO: Parse I/O Data?
    },


    [C.FRAME_TYPE.RX_PACKET_16_IO]: (frame: {
        type: C.FRAME_TYPE.RX_PACKET_16_IO,
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
    }, reader: BufferReader) => {
        frame.remote16 = reader.nextString(2, 'hex')
        frame.rssi = reader.nextUInt8()
        frame.receiveOptions = reader.nextUInt8()
        received16BitPacketIO(frame, reader)
    },
}
export default frame_parser

export type ParsableFrame = Parameters<typeof frame_parser[keyof typeof frame_parser]>[0]

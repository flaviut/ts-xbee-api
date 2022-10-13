/*
 * xbee-api
 * https://github.com/jouz/xbee-api
 *
 * Copyright (c) 2013 Jan Kolkmeier
 * Licensed under the MIT license.
 */


import {
    ANALOG_CHANNELS,
    AnalogMaskKeys,
    AnalogPins,
    AT_COMMAND,
    COMMAND_STATUS,
    DIGITAL_CHANNELS,
    DigitalMaskKeys,
    DigitalPins,
    FRAME_TYPE,
    NodeIdentification,
    SpecificXbeeFrame,
    XBeeAPIOptions
} from "./constants"
import BufferReader from "buffer-reader"

const parseNodeIdentificationPayload = (
    reader: BufferReader,
): NodeIdentification<string> => ({
    remote16: reader.nextString(2, 'hex'),
    remote64: reader.nextString(8, 'hex'),
    // Extract the NI string from the buffer
    nodeIdentifier: reader.nextStringZero('ascii'),

    ...((reader.buf.length > reader.tell()) ? {
        remoteParent16: reader.nextString(2, 'hex'),
        deviceType: reader.nextUInt8(),
        sourceEvent: reader.nextUInt8(),
        digiProfileID: reader.nextString(2, 'hex'),
        digiManufacturerID: reader.nextString(2, 'hex'),
    } : {})
})


const parseIOSamplePayload = (commandStatus: number | undefined, reader: BufferReader, options: XBeeAPIOptions) => {
    const digitalSamples: { [k in DigitalPins]?: number } = {}
    const analogSamples: { [k in AnalogPins]?: number } = {}
    // When parsing responses to ATIS, there is no data to parse if IO lines are not enabled
    if (commandStatus !== undefined && commandStatus !== 0) return {}
    const numSamples = reader.nextUInt8()
    const mskD = reader.nextUInt16BE()
    const mskA = reader.nextUInt8()

    if (mskD > 0) {
        const valD = reader.nextUInt16BE()
        for (const dbit of Object.keys(DIGITAL_CHANNELS.MASK) as unknown as DigitalMaskKeys[]) {
            if ((mskD & (1 << dbit)) >> dbit) {
                digitalSamples[DIGITAL_CHANNELS.MASK[dbit][0]] = (valD & (1 << dbit)) >> dbit
            }
        }
    }

    if (mskA > 0) {
        for (const abit of Object.keys(ANALOG_CHANNELS.MASK) as unknown as AnalogMaskKeys[]) {
            if ((mskA & (1 << abit)) >> abit) {
                const valA = reader.nextUInt16BE()

                if (!options.convert_adc) {
                    analogSamples[ANALOG_CHANNELS.MASK[abit][0]] = valA
                } else {
                    // Convert to mV, resolution is < 1mV, so rounding is OK
                    analogSamples[ANALOG_CHANNELS.MASK[abit][0]] = Math.round((valA * options.vref_adc) / 1023)
                }
            }
        }
    }
    return {
        digitalSamples,
        analogSamples,
        numSamples,
    }
}

type ChannelsKey =
    `ADC${0 | 1 | 2 | 3 | 4 | 5}`
    | `DIO${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
// Series 1 Support
const recieved16BitPacketIO = (reader: BufferReader): { data: SpecificXbeeFrame<FRAME_TYPE.RX_PACKET_16_IO>['data'] } => {
    const data: SpecificXbeeFrame<FRAME_TYPE.RX_PACKET_16_IO>['data'] = {
        sampleQuantity: reader.nextUInt8(),
        channelMask: reader.nextUInt16BE(),
        channels: {},
        analogSamples: [],
        digitalSamples: [],
    }

    //analog channels
    for (let a: 0 | 1 | 2 | 3 | 4 | 5 = 0; a <= 5; a++) {
        // exponent looks odd here because analog pins start at 0000001000000000
        if (Boolean(data.channelMask & Math.pow(2, a + 9))) {
            data.channels[`ADC${a}` as ChannelsKey] = 1
        }
    }

    // if any of the DIO pins are active, parse the digital samples
    // 0x1ff = 0000000111111111
    if (data.channelMask & 0x1ff) {
        for (let i = 0; i < data.sampleQuantity; i++) {
            data.digitalSamples.push(reader.nextUInt16BE().toString(2))
        }

        //digital channels
        for (let d = 0; d <= 8; d++) {
            if (Boolean(data.channelMask & Math.pow(2, d))) {
                data.channels[`DIO${d}` as ChannelsKey] = 1
            }
        }
    }

    for (let si = 0; si < data.sampleQuantity; si++) {
        const sample: Partial<Record<ChannelsKey, number>> = {}
        for (let j = 0; j <= 5; j++) {
            if (data.channels[`ADC${j}` as ChannelsKey]) {
                // starts at the 7th byte and moved down by the Digital Samples section
                sample[`ADC${j}` as ChannelsKey] = reader.nextUInt16BE()
            }
        }
        data.analogSamples.push(sample)
    }

    return {
        data
    }
}

export type ParsedFrame<FT extends FRAME_TYPE> = Omit<SpecificXbeeFrame<FT>, 'type'>

const parseAtCommand =
    (reader: BufferReader): ParsedFrame<FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE> => ({
        id: reader.nextUInt8(),
        command: reader.nextString(2, 'ascii') as AT_COMMAND,
        commandParameter: reader.nextAll(),
    })

export const FrameParser: { [k in FRAME_TYPE]?: (reader: BufferReader, options: XBeeAPIOptions) => ParsedFrame<k> } = {
    [FRAME_TYPE.NODE_IDENTIFICATION]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.NODE_IDENTIFICATION> => ({
            sender64: reader.nextString(8, 'hex'),
            sender16: reader.nextString(2, 'hex'),
            receiveOptions: reader.nextUInt8(),
            ...parseNodeIdentificationPayload(reader)
        }),
    [FRAME_TYPE.ZIGBEE_RECEIVE_PACKET]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.ZIGBEE_RECEIVE_PACKET> => ({
            remote64: reader.nextString(8, 'hex'),
            remote16: reader.nextString(2, 'hex'),
            receiveOptions: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.ZIGBEE_EXPLICIT_RX]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.ZIGBEE_EXPLICIT_RX> => ({
            remote64: reader.nextString(8, 'hex'),
            remote16: reader.nextString(2, 'hex'),
            sourceEndpoint: reader.nextString(1, 'hex'),
            destinationEndpoint: reader.nextString(1, 'hex'),
            clusterId: reader.nextString(2, 'hex'),
            profileId: reader.nextString(2, 'hex'),
            receiveOptions: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.XBEE_SENSOR_READ]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.XBEE_SENSOR_READ> => {
            const remote64 = reader.nextString(8, 'hex')
            const remote16 = reader.nextString(2, 'hex')
            const receiveOptions = reader.nextUInt8()
            const sensors = reader.nextUInt8()
            const sensorValues: SpecificXbeeFrame<FRAME_TYPE.XBEE_SENSOR_READ>['sensorValues'] = {
                AD0: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
                AD1: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
                AD2: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
                AD3: Math.round(1000 * (reader.nextUInt16BE() * 5.1) / 255.0),
                T: reader.nextUInt16BE(),
                temperature: undefined,
                relativeHumidity: undefined,
                trueHumidity: undefined,
                waterPresent: sensors === 0x60
            }

            if (sensors === 2 || sensors === 3) {
                if (sensorValues.T < 2048) {
                    sensorValues.temperature = sensorValues.T / 16
                } else {
                    sensorValues.temperature = -(sensorValues.T & 0x7ff) / 16
                }
            }

            if (sensors === 1 || sensors === 3) {
                sensorValues.relativeHumidity = Math.round(100 *
                    (((sensorValues.AD3 / sensorValues.AD2) -
                        0.16) / (0.0062))) / 100
            }

            if (sensors === 3) {
                sensorValues.trueHumidity = Math.round(100 *
                    (sensorValues.relativeHumidity! / (1.0546 -
                        (0.00216 * sensorValues.temperature!)))) / 100
            }

            return {
                remote64,
                remote16,
                receiveOptions,
                sensors,
                sensorValues
            }
        },
    [FRAME_TYPE.MODEM_STATUS]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.MODEM_STATUS> => ({
            modemStatus: reader.nextUInt8()
        }),
    [FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX]: (reader: BufferReader, options: XBeeAPIOptions): ParsedFrame<FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX> => ({
        remote64: reader.nextString(8, 'hex'),
        remote16: reader.nextString(2, 'hex'),
        receiveOptions: reader.nextUInt8(),
        ...parseIOSamplePayload(undefined, reader, options),
    }),
    [FRAME_TYPE.AT_COMMAND_RESPONSE]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.AT_COMMAND_RESPONSE> => {
            const id = reader.nextUInt8()
            const command = reader.nextString(2, 'ascii') as AT_COMMAND
            const commandStatus = reader.nextUInt8()
            return {
                id,
                command,
                commandStatus,
                ...((command === "ND") && (commandStatus == COMMAND_STATUS.OK) && (reader.buf.length > reader.tell())) ?
                    parseNodeIdentificationPayload(reader)
                    : {commandData: reader.nextAll()}
            }
        },
    [FRAME_TYPE.REMOTE_COMMAND_RESPONSE]:
        (reader: BufferReader, options: XBeeAPIOptions): ParsedFrame<FRAME_TYPE.REMOTE_COMMAND_RESPONSE> => {
            const id = reader.nextUInt8()
            const remote64 = reader.nextString(8, 'hex')
            const remote16 = reader.nextString(2, 'hex')
            const command = reader.nextString(2, 'ascii') as AT_COMMAND
            const commandStatus = reader.nextUInt8()
            return {
                id,
                remote64,
                remote16,
                command,
                commandStatus,
                ...((command === "IS") ?
                    parseIOSamplePayload(commandStatus, reader, options)
                    : ((command === "ND") && (commandStatus === COMMAND_STATUS.OK)) ?
                        {nodeIdentification: parseNodeIdentificationPayload(reader)}
                        :
                        {commandData: reader.nextAll()})
            }
        },
    [FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS> => ({
            id: reader.nextUInt8(),
            remote16: reader.nextString(2, 'hex'),
            transmitRetryCount: reader.nextUInt8(),
            deliveryStatus: reader.nextUInt8(),
            discoveryStatus: reader.nextUInt8(),
        }),
    [FRAME_TYPE.ROUTE_RECORD]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.ROUTE_RECORD> => {
            const remote64 = reader.nextString(8, 'hex')
            const remote16 = reader.nextString(2, 'hex')
            const receiveOptions = reader.nextUInt8()
            const hopCount = reader.nextUInt8()
            const addresses = new Array(hopCount)
                .map<number>(() => reader.nextUInt16BE())
            return {
                remote64,
                remote16,
                receiveOptions,
                hopCount,
                addresses,
            }
        },
    [FRAME_TYPE.AT_COMMAND]: parseAtCommand,
    [FRAME_TYPE.AT_COMMAND_QUEUE_PARAMETER_VALUE]: parseAtCommand,
    [FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST> => ({
            id: reader.nextUInt8(),
            destination64: reader.nextString(8, 'hex'),
            destination16: reader.nextString(2, 'hex'),
            remoteCommandOptions: reader.nextUInt8(),
            command: reader.nextString(2, 'ascii') as AT_COMMAND,
            commandParameter: reader.nextAll(),
        }),
    [FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST> => ({
            id: reader.nextUInt8(),
            destination64: reader.nextString(8, 'hex'),
            destination16: reader.nextString(2, 'hex'),
            broadcastRadius: reader.nextUInt8(),
            options: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME> => ({
            id: reader.nextUInt8(),
            destination64: reader.nextString(8, 'hex'),
            destination16: reader.nextString(2, 'hex'),
            sourceEndpoint: reader.nextUInt8(),
            destinationEndpoint: reader.nextUInt8(),
            clusterId: reader.nextUInt16BE(),
            profileId: reader.nextUInt16BE(),
            broadcastRadius: reader.nextUInt8(),
            options: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.TX_REQUEST_64]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.TX_REQUEST_64> => ({
            id: reader.nextUInt8(),
            destination64: reader.nextString(8, 'hex'),
            options: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.TX_REQUEST_16]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.TX_REQUEST_16> => ({
            id: reader.nextUInt8(),
            destination16: reader.nextString(2, 'hex'),
            options: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.TX_STATUS]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.TX_STATUS> => ({
            id: reader.nextUInt8(),
            deliveryStatus: reader.nextUInt8(),
        }),
    [FRAME_TYPE.RX_PACKET_64]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.RX_PACKET_64> => ({
            remote64: reader.nextString(8, 'hex'),
            rssi: reader.nextUInt8(),
            receiveOptions: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.RX_PACKET_16]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.RX_PACKET_16> => ({
            remote16: reader.nextString(2, 'hex'),
            rssi: reader.nextUInt8(),
            receiveOptions: reader.nextUInt8(),
            data: reader.nextAll(),
        }),
    [FRAME_TYPE.RX_PACKET_64_IO]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.RX_PACKET_64_IO> => ({
            remote64: reader.nextString(8, 'hex'),
            rssi: reader.nextUInt8(),
            receiveOptions: reader.nextUInt8(),
            data: reader.nextAll(),
            // TODO: Parse I/O Data?
        }),
    [FRAME_TYPE.RX_PACKET_16_IO]:
        (reader: BufferReader): ParsedFrame<FRAME_TYPE.RX_PACKET_16_IO> => ({
            remote16: reader.nextString(2, 'hex'),
            rssi: reader.nextUInt8(),
            receiveOptions: reader.nextUInt8(),
            ...recieved16BitPacketIO(reader),
        })
}

import { SerialPortStream } from '@serialport/stream';
import type { Buffer } from 'buffer';
import * as console from 'console';
import { CancellablePromise } from 'real-cancellable-promise';
import { ReadlineParser, SerialPort } from 'serialport';
import * as stream from 'stream';

import {
  C,
  FRAME_TYPES,
  FrameType,
  type ParsableFrame,
  type SpecificParsableFrame,
  XBeeBuilder,
  XBeeParser,
} from 'ts-xbee-api';
import { BufferConstructable, toHex } from './buffer-tools';
import { awaitBufferStream, awaitObjectStream } from './stream-util.js';

function promisify<A>(fn: (cb: (args: A) => void) => void): () => Promise<A> {
  return () =>
    new Promise((resolve) => {
      fn((callbackArgs) => {
        resolve(callbackArgs);
      });
    });
}

async function checkApi(port: SerialPortStream): Promise<boolean> {
  const parser = port.pipe(new XBeeParser());
  const builder = new XBeeBuilder();
  builder.pipe(port);

  builder.write({
    type: FrameType.AT_COMMAND,
    command: C.AT_COMMAND.AP,
    commandParameter: [],
  });
  try {
    await awaitObjectStream(parser, 100);
    return true;
  } catch (e) {
    return false;
  }
}

async function checkAtMode(port: SerialPortStream): Promise<boolean> {
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r' }));
  await CancellablePromise.delay(1100);
  port.write('+++');
  try {
    const response = await awaitBufferStream(parser, 1100);
    if (response.length !== 3 || response.toString() !== 'OK\r') {
      return false;
    }
  } catch (e) {
    return false;
  } finally {
    port.unpipe(parser);
    parser.destroy();
  }

  // returns true if the command was accepted
  async function setAtOption(command: string): Promise<boolean> {
    port.write(command);
    const response = await awaitBufferStream(parser, 100);
    return response.toString() === 'OK\r';
  }

  // switch into API mode
  if (!(await setAtOption('ATAP1\r'))) {
    return false;
  }
  // write the API mode command into non-volatile memory
  if (!(await setAtOption('ATWR\r'))) {
    return false;
  }
  // exit command mode, and into API mode
  try {
    await setAtOption('ATCN\r');
  } catch (e) {
    // ignore errors
  }
  return true;
}

async function discoverBaud(
  path: string,
  bauds: number[],
  SerialPortClass: typeof SerialPort
): Promise<SerialPortStream> {
  for (const baudRate of bauds) {
    console.log(`Trying ${baudRate} baud`);

    const port = new SerialPortClass({
      baudRate,
      path,
      autoOpen: false,
    });
    // listen on both reads and writes to port

    await promisify(port.open.bind(port))();

    // try API mode first
    if (await checkApi(port)) {
      console.log(`Found XBee at ${baudRate} baud through API`);
      return port;
    }

    // try AT mode
    if (await checkAtMode(port)) {
      console.log(`Found XBee at ${baudRate} baud through AT`);
      return port;
    }

    if (port.isOpen) {
      await promisify(port.close.bind(port))();
    }
  }
  throw new Error(`Could not find XBee at ${path}`);
}

interface AwaitResponseParams<FT extends FrameType> {
  timeoutMs: number;
  frameType: FT;
  filter: (f: SpecificParsableFrame<FT>) => boolean;
}

/**
 * A high-level, imperative, promise-based interface to the XBee API.
 *
 * This class is a wrapper around the XBeeBuilder and XBeeParser classes, but
 * provides a more convenient interface by avoiding the need to understand and
 * use streams.
 */
export class XBee {
  private readonly frameStreams = new Map(
    FRAME_TYPES.map((type) => [
      FrameType[type],
      new stream.Readable({
        read() {
          return;
        },
        objectMode: true,
      }),
    ])
  );

  private readonly builder: XBeeBuilder;
  private readonly parser: XBeeParser;

  static async discover(
    uartPath: string,
    bauds: number[],
    SerialPortClass: typeof SerialPort = SerialPort
  ): Promise<XBee> {
    const port = await discoverBaud(uartPath, bauds, SerialPortClass);
    return new XBee(port);
  }

  static async withBaud(
    uartPath: string,
    baud: number,
    SerialPortClass: typeof SerialPort = SerialPort
  ): Promise<XBee> {
    const port = new SerialPortClass({
      baudRate: baud,
      path: uartPath,
      autoOpen: false,
    });
    await promisify(port.open.bind(port))();

    return new XBee(port);
  }

  constructor(private readonly serial: stream.Duplex) {
    this.builder = new XBeeBuilder();
    this.builder.pipe(serial);
    this.parser = new XBeeParser();
    serial.pipe(this.parser);
    this.parser.on('data', (frame: ParsableFrame) => {
      this.frameStreams.get(frame.type).push(frame);
    });
  }

  /** MUST be called when done, or the process will hang */
  async close(): Promise<void> {
    if (this.serial instanceof SerialPort) {
      await promisify(this.serial.close.bind(this.serial))();
    } else {
      this.serial.destroy();
    }
  }

  private filteredFrameStream<FT extends FrameType>(
    frameType: FT,
    filter: (f: SpecificParsableFrame<FT>) => boolean
  ): {
    stream: stream.Readable;
    close: () => void;
  } {
    const frameStream = this.frameStreams.get(frameType)!;
    const readable = new stream.Readable({
      read() {
        return;
      },
      objectMode: true,
    });

    function filterAndForward(frame: SpecificParsableFrame<FT>) {
      if (filter(frame)) {
        readable.push(frame);
      }
    }

    frameStream.on('data', filterAndForward);
    return {
      stream: readable,
      close: () => {
        frameStream.removeListener('data', filterAndForward);
      },
    };
  }

  /** like awaitResponse, but throws if the expected message is not received */
  private async expectResponse<FT extends FrameType>(
    params: AwaitResponseParams<FT>
  ): Promise<SpecificParsableFrame<FT>> {
    const { stream, close } = this.filteredFrameStream(
      params.frameType,
      params.filter
    );
    try {
      return await awaitObjectStream(stream, params.timeoutMs);
    } finally {
      close();
    }
  }

  /** waits for the first response that matches the condition */
  private async awaitResponse<FT extends FrameType>(
    params: AwaitResponseParams<FT>
  ): Promise<SpecificParsableFrame<FT> | null> {
    try {
      return await this.expectResponse(params);
    } catch (e) {
      return null;
    }
  }

  private async expectParameterResponse(
    frameId: number,
    timeoutMs: number
  ): Promise<SpecificParsableFrame<FrameType.AT_COMMAND_RESPONSE>> {
    return await this.expectResponse({
      timeoutMs,
      frameType: FrameType.AT_COMMAND_RESPONSE,
      filter(f) {
        return f.id === frameId;
      },
    });
  }

  private async internalSetParameter(
    parameter: C.AT_COMMAND,
    type: FrameType.AT_COMMAND_QUEUE_PARAMETER_VALUE | FrameType.AT_COMMAND,
    value: BufferConstructable | undefined,
    timeoutMs: number
  ): Promise<void> {
    const frameId = this.builder.nextFrameId();
    const responsePromise = this.expectParameterResponse(frameId, timeoutMs);
    this.builder.write({
      type,
      id: frameId,
      command: parameter,
      commandParameter: value != null ? value : [],
    });

    await responsePromise;
  }

  /**
   * Scans the network for devices, returning a stream of responses. The stream
   * will end after 60 seconds.
   */
  public async *scanNetwork(
    timeoutMs = 60_000
  ): AsyncGenerator<SpecificParsableFrame<FrameType.AT_COMMAND_RESPONSE>> {
    await this.setParameter(C.AT_COMMAND.NT, [0x3c]);

    const frameId = this.builder.nextFrameId();
    const { stream: scanResponseStream, close } = this.filteredFrameStream(
      FrameType.AT_COMMAND_RESPONSE,
      (f) => f.id === frameId
    );
    this.builder.write({
      type: FrameType.AT_COMMAND,
      id: frameId,
      command: C.AT_COMMAND.ND,
      commandParameter: [],
    });
    const timeout = CancellablePromise.delay(timeoutMs);
    const streamIterator = scanResponseStream[Symbol.asyncIterator]();
    try {
      while (true) {
        const nextResult = await CancellablePromise.race([
          streamIterator.next(),
          timeout,
        ]);
        if (typeof nextResult === 'object' && !nextResult.done) {
          yield nextResult.value;
        } else {
          return;
        }
      }
    } finally {
      close();
    }
  }

  /**
   * Enqueues an AT command to be saved. Committed when setParameter()
   * is called or an AC command is issued.
   */
  async enqueueSetParameter(
    parameter: C.AT_COMMAND,
    value: BufferConstructable,
    timeoutMs = 100
  ): Promise<void> {
    await this.internalSetParameter(
      parameter,
      FrameType.AT_COMMAND_QUEUE_PARAMETER_VALUE,
      value,
      timeoutMs
    );
  }

  async setParameter(
    parameter: C.AT_COMMAND,
    value: BufferConstructable | undefined,
    timeoutMs = 100
  ): Promise<void> {
    await this.internalSetParameter(
      parameter,
      FrameType.AT_COMMAND,
      value,
      timeoutMs
    );
  }

  /** returns the parameter value has a hex string */
  async getParameter(
    parameter: C.AT_COMMAND,
    timeoutMs = 100
  ): Promise<string> {
    const frameId = this.builder.nextFrameId();
    const responsePromise = this.expectParameterResponse(frameId, timeoutMs);
    this.builder.write({
      type: FrameType.AT_COMMAND,
      id: frameId,
      command: parameter,
      commandParameter: [],
    });

    const response = await responsePromise;
    if (response.command === C.AT_COMMAND.ND) {
      return JSON.stringify(response.nodeIdentification);
    }
    return toHex(response.commandData);
  }

  private prevModemStatus: SpecificParsableFrame<FrameType.MODEM_STATUS> | null =
    null;

  /**
   * returns the current modem status, or null if no status has been received
   * @param timeoutMs if 0, returns the last known status
   */
  async modemStatus(timeoutMs = 100): Promise<number | null> {
    const nextVal = await this.awaitResponse({
      timeoutMs: timeoutMs,
      frameType: FrameType.MODEM_STATUS,
      filter: () => true,
    });
    if (nextVal != null) {
      this.prevModemStatus = nextVal;
      return nextVal.modemStatus;
    }
    return this.prevModemStatus?.modemStatus ?? null;
  }

  /** returns the current device's address as 16-hex-digit string */
  async address(timeoutMs = 100): Promise<string> {
    const hi = await this.getParameter(C.AT_COMMAND.SH, timeoutMs);
    const lo = await this.getParameter(C.AT_COMMAND.SL, timeoutMs);
    return hi + lo;
  }

  /**
   * run remote AT command
   *
   * @param remoteAddress 16-hex-digit address of the remote device
   * @param parameter parameter to set
   * @param value value to set, see XBee API documentation for details
   * @param timeoutMs timeout in milliseconds
   */
  async setRemoteParameter(
    remoteAddress: string,
    parameter: C.AT_COMMAND,
    value: BufferConstructable,
    timeoutMs = 100
  ): Promise<void> {
    const frameId = this.builder.nextFrameId();
    const response = this.expectResponse({
      timeoutMs: timeoutMs,
      frameType: FrameType.REMOTE_COMMAND_RESPONSE,
      filter: (f) => f.id === frameId,
    });
    this.builder.write({
      type: FrameType.REMOTE_AT_COMMAND_REQUEST,
      id: frameId,
      destination64: remoteAddress,
      command: parameter,
      commandParameter: value != null ? value : [],
    });
    await response;
  }

  /** destination must be a hex string of length 16 */
  transmit(data: Buffer | string, destination: string): void {
    this.builder.write({
      type: FrameType.ZIGBEE_TRANSMIT_REQUEST,
      destination64: destination,
      destination16: 'fffe', // sending to 64-bit address
      data,
    });
  }

  /**
   * Sends a message indicating that a message was received.
   *
   * This is generally used to emulate an XBee device with a computer,
   * since this message is only sent by the XBee & not by an XBee-attached
   * device.
   *
   * @param data data that was sent to the device
   * @param source 16-hex-digit address of the remote device that sent this message
   */
  messageReceived(data: Buffer | string, source: string): void {
    this.builder.write({
      type: FrameType.ZIGBEE_RECEIVE_PACKET,
      sender64: source,
      data,
      receiveOptions: new Set([C.RECEIVE_OPTIONS.PACKET_ACKNOWLEDGED]),
    });
  }

  /**
   * returns a stream of frames of the given type. The stream is in object mode and will emit a
   * SpecificParsableFrame<FT> for each frame received.
   */
  frameStream<FT extends FrameType>(frameType: FT): stream.Readable {
    return this.frameStreams.get(frameType)!;
  }

  /**
   * returns a stream of all frames received, regardless of type. The stream is in object mode and
   * will emit a ParsableFrame for each frame received.
   */
  allFramesStream(): stream.Readable {
    return this.parser;
  }
}

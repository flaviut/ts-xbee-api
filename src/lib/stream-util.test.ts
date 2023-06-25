import { Buffer } from 'buffer';
import { Readable } from 'stream';
import { awaitBufferStream, awaitObjectStream } from './stream-util';

describe('awaitBufferStream', function () {
  it('should return the first chunk of a stream', async function () {
    const stream = new Readable({
      read() {
        this.push(Buffer.from('hello'));
        this.push(null);
      },
    });
    const result = await awaitBufferStream(stream, 10);
    expect(result.toString()).toEqual('hello');
  });

  it('should throw an error if the stream is in object mode', async function () {
    const stream = new Readable({
      objectMode: true,
      read() {
        this.push(Buffer.from('hello'));
        this.push(null);
      },
    });
    await expect(awaitBufferStream(stream, 10)).rejects.toThrowError();
  });

  it('should throw an error if the stream times out', async function () {
    const stream = new Readable({
      read() {
        // do nothing
      },
    });
    await expect(awaitBufferStream(stream, 10)).rejects.toThrowError(
      'Response timed out'
    );
  });
});

describe('awaitObjectStream', function () {
  it('should return the first chunk of a stream', async function () {
    const stream = new Readable({
      objectMode: true,
      read() {
        this.push({ hello: 'world' });
        this.push(null);
      },
    });
    const result = await awaitObjectStream(stream, 10);
    expect(result).toEqual({ hello: 'world' });
  });

  it('should throw an error if the stream is in byte mode', async function () {
    const stream = new Readable({
      read() {
        this.push(Buffer.from('hello'));
        this.push(null);
      },
    });
    await expect(awaitObjectStream(stream, 10)).rejects.toThrowError();
  });

  it('should throw an error if the stream times out', async function () {
    const stream = new Readable({
      objectMode: true,
      read() {
        // do nothing
      },
    });
    await expect(awaitObjectStream(stream, 10)).rejects.toThrowError(
      'Response timed out'
    );
  });
});

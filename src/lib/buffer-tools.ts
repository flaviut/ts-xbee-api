// cross-platform buffer writer and reader. Eliminates dependency on buffer-builder and buffer-reader,
// and avoids the need to use polyfills for nodejs Buffer in the browser.

export type BufferConstructable = number[] | ArrayBuffer | Buffer | string;

type Encodings = 'utf8' | 'hex';

// https://stackoverflow.com/a/69585881/2299084
const HEX_STRINGS = '0123456789abcdef';
const MAP_HEX = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
};

// Fast Uint8Array to hex
export function toHex(bytes: ArrayLike<number>): string {
  return Array.from(bytes || [])
    .map((b) => HEX_STRINGS[b >> 4] + HEX_STRINGS[b & 15])
    .join('');
}

// Mimics Buffer.from(x, 'hex') logic
// Stops on first non-hex string and returns
// https://github.com/nodejs/node/blob/v14.18.1/src/string_bytes.cc#L246-L261
export function fromHex(hexString: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor((hexString || '').length / 2));
  let i;
  for (i = 0; i < bytes.length; i++) {
    // @ts-expect-error
    const a = MAP_HEX[hexString[i * 2]];
    // @ts-expect-error
    const b = MAP_HEX[hexString[i * 2 + 1]];
    if (a === undefined || b === undefined) {
      break;
    }
    bytes[i] = (a << 4) | b;
  }
  return i === bytes.length ? bytes : bytes.slice(0, i);
}

export class BufferBuilder {
  private offset = 0;
  private _length = 0;
  public get length(): number {
    return this._length;
  }

  constructor(private _buffer: Uint8Array) {}

  appendUInt8(value: number): BufferBuilder {
    this._buffer[this.offset++] = value;
    this._length++;
    return this;
  }

  appendUInt16BE(value: number): BufferBuilder {
    this._buffer[this.offset++] = (value >> 8) & 0xff;
    this._buffer[this.offset++] = value & 0xff;
    this._length += 2;
    return this;
  }

  appendBuffer(data: BufferConstructable): BufferBuilder {
    let buf: Uint8Array;
    if (Array.isArray(data)) {
      buf = Uint8Array.from(data);
    } else if (typeof data === 'string') {
      buf = new TextEncoder().encode(data);
    } else {
      buf = new Uint8Array(data);
    }
    this._buffer.set(buf, this.offset);
    this.offset += buf.length;
    this._length += buf.length;
    return this;
  }

  appendString(
    data: BufferConstructable,
    encoding: Encodings = 'utf8'
  ): BufferBuilder {
    let buf: BufferConstructable = data;
    if (encoding === 'hex') {
      buf = fromHex(data as string);
    } else if (encoding === 'utf8' && typeof data === 'string') {
      buf = new TextEncoder().encode(data);
    }
    return this.appendBuffer(buf);
  }

  get buffer(): Uint8Array {
    return this._buffer.slice(0, this._length);
  }
}

export class BufferReader {
  private _offset = 0;

  constructor(private _buffer: Uint8Array) {}

  get buf(): { length: number } {
    return this._buffer;
  }

  nextString(length: number, encoding: Encodings = 'utf8'): string {
    const result = this._buffer.slice(this._offset, this._offset + length);
    this._offset += length;
    if (encoding === 'utf8') {
      return new TextDecoder().decode(result);
    } else {
      return toHex(result);
    }
  }

  tell(): number {
    return this._offset;
  }

  nextStringZero(encoding: Encodings = 'utf8'): string {
    let length = 0;
    for (let i = this._offset; i < this._buffer.length; i++) {
      if (this._buffer[i] === 0) {
        length = i - this._offset;
        break;
      }
    }
    const result = this.nextString(length, encoding);
    this._offset += 1;
    return result;
  }

  nextUInt8(): number {
    const result = this._buffer[this._offset];
    this._offset += 1;
    return result;
  }

  nextUInt16BE(): number {
    const result =
      (this._buffer[this._offset] << 8) | this._buffer[this._offset + 1];
    this._offset += 2;
    return result;
  }

  nextAll(): Uint8Array {
    const result = this._buffer.slice(this._offset);
    this._offset = this._buffer.length;
    return result;
  }
}

export function concat(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

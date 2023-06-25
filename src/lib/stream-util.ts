import { type Buffer } from 'buffer';
import { CancellablePromise } from 'real-cancellable-promise';
import { type Readable } from 'stream';

class StreamReadError extends Error {}

async function awaitStream(
  stream: Readable,
  timeoutMs: number
): Promise<unknown> {
  let onDataCallback: (data: unknown) => void;
  const dataPromise = new CancellablePromise(
    new Promise<unknown>((resolve) => {
      onDataCallback = resolve;
      stream.once('data', onDataCallback);
    }),
    () => {
      stream.off('data', onDataCallback);
    }
  );
  const timeoutPromise = CancellablePromise.delay(timeoutMs).then(async () => {
    throw new StreamReadError('Response timed out');
  });

  try {
    return await CancellablePromise.race([dataPromise, timeoutPromise]);
  } finally {
    dataPromise.cancel();
    timeoutPromise.cancel();
  }
}

export async function awaitBufferStream(
  stream: Readable,
  timeoutMs: number
): Promise<Buffer> {
  if (stream.readableObjectMode) {
    throw new StreamReadError(
      'Expected stream in byte mode, got stream in object mode'
    );
  }
  return (await awaitStream(stream, timeoutMs)) as Buffer;
}

export async function awaitObjectStream(
  stream: Readable,
  timeoutMs: number
): Promise<any> {
  if (!stream.readableObjectMode) {
    throw new StreamReadError(
      'Expected stream in object mode, got stream in byte mode'
    );
  }
  return (await awaitStream(stream, timeoutMs)) as any;
}

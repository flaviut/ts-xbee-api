interface ParseState {
    buffer: Buffer;
    offset: number; // Offset in buffer
    length: number; // Packet Length
    total: number; // To test Checksum
    checksum: number; // Checksum byte
    b: number; // Working byte
    escape_next: boolean; // For escaping in AP=2
    waiting: boolean;
}


export class ChecksumMismatchError extends Error {
    constructor(readonly parseState: ParseState, readonly actual_checksum: number) {
        super(`Checksum mismatch: ${actual_checksum.toString(16)} != ${parseState.checksum.toString(16)}`);
    }
}

export class FrameBuildingNotSupportedError extends Error {
    constructor(readonly frameType: number) {
        super(`Frame building not supported for frame type ${frameType.toString(16)}`);
    }
}

import type { CBOROptions } from "./types.ts";

export const CBOR_OPTIONS: CBOROptions = {
  dictionary: "object",
};

export const POW_2_24 = 5.960464477539063e-8;
export const POW_2_32 = 4294967296;
export const POW_2_53 = 9007199254740992;
export const DECODE_CHUNK_SIZE = 8192;

// CBOR defined tag values
export const kCborTag = 6;

// RFC8746 Tag values for typed little endian arrays
export const kCborTagUint8 = 64;
export const kCborTagUint16 = 69;
export const kCborTagUint32 = 70;
export const kCborTagInt8 = 72;
export const kCborTagInt16 = 77;
export const kCborTagInt32 = 78;
export const kCborTagFloat32 = 85;
export const kCborTagFloat64 = 86;

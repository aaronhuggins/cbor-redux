import type { CBOROptions } from "./types.ts";

export const CBOR_OPTIONS = Object.freeze<CBOROptions>({
  dictionary: "object",
  mode: "strict",
});

/** A symbol which is emitted by the `reviver` and `replacer` functions when a value is not associated with a key or CBOR label.
 * In JSON, a value with no key simply emits an empty string; this would be indistinguishable from a valid CBOR data sequence.
 * Using a symbol acheives emitting a comparable value without the value being a valid CBOR data type.
 */
export const EMPTY_KEY = Symbol("EMPTY_KEY");
/** A symbol which may be returned by the user in the encoder's `replacer` function to omit values. Just like detecting an empty
 * key, using a symbol acheives emitting a comparable value without the value being a valid CBOR data type. Use this in a custom
 * replacer function as the return value to indicate to the encoder that the value is to be skipped from arrays and dictionaries.
 */
export const OMIT_VALUE = Symbol("OMIT_VALUE");

export const POW_2_24 = 5.960464477539063e-8;
export const POW_2_32 = 4294967296;
export const POW_2_53 = 9007199254740992;
export const MAX_SAFE_INTEGER = 18446744073709551616n;
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

import { decode, parse } from "./decode.ts";
import { binarify, encode } from "./encode.ts";

/**
 * An intrinsic object that provides functions to convert JavaScript values
 * to and from the Concise Binary Object Representation (CBOR) format.
 *
 * ```typescript
 * // Simply a conveniently named-export.
 * CBOR.binarify(...)
 * CBOR.decode(...)
 * CBOR.encode(...)
 * CBOR.parse(...)
 * ```
 */
export const CBOR = {
  binarify,
  decode,
  encode,
  parse,
};

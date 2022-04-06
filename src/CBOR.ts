import { decode } from "./decode.ts";
import { encode } from "./encode.ts";

/**
 * An intrinsic object that provides functions to convert JavaScript values
 * to and from the Concise Binary Object Representation (CBOR) format.
 */
export const CBOR: {
  decode: typeof decode;
  encode: typeof encode;
} = {
  decode,
  encode,
};

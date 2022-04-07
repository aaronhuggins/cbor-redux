import { decode, parse } from "./decode.ts";
import { encode, binarify } from "./encode.ts";

/**
 * An intrinsic object that provides functions to convert JavaScript values
 * to and from the Concise Binary Object Representation (CBOR) format.
 */
export const CBOR = {
  binarify,
  decode,
  encode,
  parse,
};

// deno-lint-ignore-file no-explicit-any
import { decode } from "./decode.ts";
import { encode } from "./encode.ts";
import { options } from "./helpers.ts";
import type {
  CBOROptions,
  SimpleValueFunction,
  TaggedValueFunction,
} from "./types.ts";

/**
 * An intrinsic object that provides functions to convert JavaScript values
 * to and from the Concise Binary Object Representation (CBOR) format.
 */
export const CBOR: {
  decode: <T = any>(
    data: ArrayBuffer | SharedArrayBuffer,
    tagger?: TaggedValueFunction,
    simpleValue?: SimpleValueFunction,
  ) => T;
  encode: <T = any>(value: T) => ArrayBuffer;
  options: (options?: CBOROptions) => Readonly<CBOROptions>;
} = {
  decode,
  encode,
  options,
};

// deno-lint-ignore-file no-explicit-any

/** Indicates that the decorder should use either Object or Map as the key/value dictionary. */
export type DictionaryOption = "object" | "map";
/** Indicates that the decoder should loosely accept all keys, or striictly fail on duplicate keys. */
export type ModeOption = "loose" | "strict";

/** Options for the decoder. */
export interface CBOROptions {
  /** Set the dictionary type for supported environments; defaults to `object`. */
  dictionary?: DictionaryOption;
  /** Set the mode to `strict` to hard fail on duplicate keys in CBOR dictionaries; defaults to `strict`. */
  mode?: ModeOption;
}

/** A function to modify values which are encountered during decoding. */
export type CBORReviver = (key: any, value: any) => any;
/** A function to modify the behavior of the encoder; to omit values, return the `OMIT_VALUE` symbol. */
export type CBORReplacer = (key: any, value: any) => any;

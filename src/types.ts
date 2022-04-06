// deno-lint-ignore-file no-explicit-any
export type DictionaryOption = "object" | "map";
export type ModeOption = "loose" | "strict";

export interface CBOROptions {
  /** Set the dictionary type for supported environments; defaults to `object`. */
  dictionary?: DictionaryOption;
  /** Set the mode to `strict` to hard fail on duplicate keys in CBOR dictionaries; defaults to `strict`. */
  mode?: ModeOption;
}

export type CBORReviver = (key: any, value: any) => any;
export type CBORReplacer = (key: any, value: any) => any;

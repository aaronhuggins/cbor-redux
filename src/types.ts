// deno-lint-ignore-file no-explicit-any
import type { SimpleValue } from "./SimpleValue.ts";
import type { TaggedValue } from "./TaggedValue.ts";

export type DictionaryOption = "object" | "map";
export type ModeOption = "loose" | "strict";

export interface CBOROptions {
  /** Set the dictionary type for supported environments; defaults to `object`. */
  dictionary?: DictionaryOption;
  /** Set the mode to `strict` to hard fail on duplicate keys in CBOR dictionaries; defaults to `strict`. */
  mode?: ModeOption;
  /** A function that extracts tagged values. This function is called for each member of an object. */
  tagger?: TaggedValueFunction;
  /** A function that extracts simple values. This function is called for each member of an object. */
  simpleValue?: SimpleValueFunction;
}

/** A function that extracts tagged values. */
export type TaggedValueFunction = (value: any, tag: number) => TaggedValue;
/** A function that extracts simple values. */
export type SimpleValueFunction = (value: any) => SimpleValue;

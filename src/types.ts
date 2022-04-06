// deno-lint-ignore-file no-explicit-any
import type { SimpleValue } from './SimpleValue.ts'
import type { TaggedValue } from './TaggedValue.ts'

export type DictionaryOption = "object" | "map";

export interface CBOROptions {
  /** Set the dictionary type for supported environments; defaults to `object`. */
  dictionary?: DictionaryOption;
}

/** A function that extracts tagged values. */
export type TaggedValueFunction = (value: any, tag: number) => TaggedValue;
/** A function that extracts simple values. */
export type SimpleValueFunction = (value: any) => SimpleValue;

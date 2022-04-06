// deno-lint-ignore-file no-explicit-any
import { CBOR_OPTIONS } from "./constants.ts";
import type { CBOROptions, DictionaryOption, ModeOption } from "./types.ts";

export function objectIs(x: any, y: any) {
  if (typeof Object.is === "function") return Object.is(x, y);

  // SameValue algorithm
  // Steps 1-5, 7-10
  if (x === y) {
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y;
  }

  // Step 6.a: NaN == NaN
  return x !== x && y !== y;
}

export function options(options?: CBOROptions): Readonly<CBOROptions> {
  function isDictionary(value: any): value is DictionaryOption {
    return typeof value === "string" && ["object", "map"].includes(value);
  }
  function isMode(value: any): value is ModeOption {
    return typeof value === "string" && ["loose", "strict"].includes(value);
  }

  const bag: CBOROptions = { ...CBOR_OPTIONS };

  if (typeof options === "object") {
    bag.dictionary = isDictionary(options.dictionary)
      ? options.dictionary
      : CBOR_OPTIONS.dictionary;
    bag.mode = isMode(options.mode) ? options.mode : CBOR_OPTIONS.mode;
  }

  return Object.freeze(bag);
}

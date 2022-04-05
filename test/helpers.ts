// deno-lint-ignore-file no-explicit-any
import { deepStrictEqual, ok } from "https://deno.land/std@0.133.0/node/assert.ts";

export function helpers () {
  return {
    myDeepEqual(actual: any, expected: any, message?: string) {
      if (actual === expected) {
        return true;
      }
      if (expected instanceof ArrayBuffer) {
        expected = new Uint8Array(expected);
      }
      if (actual instanceof Uint8Array && expected instanceof Uint8Array) {
        let bufferMatch = actual.length === expected.length;

        for (let i = 0; i < actual.length; i += 1) {
          bufferMatch = bufferMatch && actual[i] === expected[i];
        }

        if (bufferMatch) return ok(true, message);
      }

      if (
        typeof actual === "number" && typeof expected === "number" &&
        Number.isNaN(expected)
      ) {
        return deepStrictEqual(Number.isNaN(actual), true, message);
      }

      return deepStrictEqual(actual, expected, message);
    },

    hex2arrayBuffer(data: string) {
      const length = data.length / 2;
      const ret = new Uint8Array(length);

      for (let i = 0; i < length; i += 1) {
        ret[i] = parseInt(data.substr(i * 2, 2), 16);
      }

      return ret.buffer;
    },
  };
}

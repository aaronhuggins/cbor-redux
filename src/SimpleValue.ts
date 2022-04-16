// deno-lint-ignore-file no-explicit-any

/** Class for structuring a simple value. Unassigned or reserved simple values
 * are emitted as an instance of this class during decoding. This allows an
 * application to handle custom decoding in the `reviver` function of the decoder.
 *
 * ```typescript
 * const { buffer } = new Uint8Array([0x81,0xf8,0x64])
 * const decoded = decode(buffer, (key, value) => {
 *   // Let's pretend that a simple value of 100 stands for JavaScript NaN
 *   if (value instanceof SimpleValue && value.value === 100) return NaN
 *   return value
 * })
 * console.log(decoded) // Expect: [ NaN ]
 * ```
 *
 * Simple values can alsoe be encoded.
 *
 * ```typescript
 * const example = [NaN]
 * const encoded = encode(example, (key, value) => {
 *   if (Number.isNaN(value)) return new SimpleValue(100)
 *   return value
 * })
 * console.log(new Uint8Array(encoded)) // Expect: Uint8Array(3) [ 129, 248, 100 ]
 * ```
 */
export class SimpleValue {
  static create(value: boolean | number | null | undefined) {
    if (value === undefined) return new SimpleValue(23);
    if (value === null) return new SimpleValue(22);
    if (value === true) return new SimpleValue(21);
    if (value === false) return new SimpleValue(20);
    if (typeof value === "number" && value >= 0 && value <= 255) {
      return new SimpleValue(value);
    }

    throw new Error("CBORError: Value out of range or not a simple value.");
  }

  constructor(value: number) {
    switch (true) {
      case value === 20:
        this.semantic = "false";
        break;
      case value === 21:
        this.semantic = "true";
        break;
      case value === 22:
        this.semantic = "null";
        break;
      case value === 23:
        this.semantic = "undefined";
        break;
      case value > 23 && value < 32:
        this.semantic = "reserved";
        break;
      default:
        this.semantic = "unassigned";
        break;
    }
    this.value = value;
  }

  semantic: "reserved" | "unassigned" | "false" | "true" | "null" | "undefined";
  value: number;

  toPrimitive(): any {
    switch (this.semantic) {
      case "false":
        return false;
      case "true":
        return true;
      case "null":
        return null;
      case "undefined":
      default:
        return undefined;
    }
  }
}

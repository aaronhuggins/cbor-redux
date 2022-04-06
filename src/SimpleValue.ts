// deno-lint-ignore-file no-explicit-any

/** Convenience class for structuring a simple value. */
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

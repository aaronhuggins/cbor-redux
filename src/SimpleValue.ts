// deno-lint-ignore-file no-explicit-any

/** Convenience class for structuring a simple value. */
export class SimpleValue {
  constructor(value: any) {
    this.value = value;
  }

  value: any;
}

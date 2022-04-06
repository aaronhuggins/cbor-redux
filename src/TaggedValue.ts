// deno-lint-ignore-file no-explicit-any

/** Convenience class for structuring a tagged value. */
export class TaggedValue {
  constructor(value: any, tag: number) {
    this.value = value;
    this.tag = tag;
  }

  value: any;
  tag: number;
}

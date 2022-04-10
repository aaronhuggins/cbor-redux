// deno-lint-ignore-file no-explicit-any

/** Class for structuring a tagged value. Tags which are not JavaScript typed
 * arrays are emitted as an instance of this class during decoding. This allows
 * an application to handle tagged values in the `reviver` function of the
 * decoder. Values which are a valid CBOR type will be decoded and assigned to
 * the `TaggedValue.value` property.
 */
export class TaggedValue {
  constructor(value: any, tag: number | bigint) {
    this.value = value;
    this.tag = tag;
  }

  value: any;
  tag: number | bigint;
}

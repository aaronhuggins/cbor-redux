// deno-lint-ignore-file no-explicit-any

/** Class for structuring a tagged value. Tags which are not JavaScript typed
 * arrays are emitted as an instance of this class during decoding. This allows
 * an application to handle tagged values in the `reviver` function of the
 * decoder. Values which are a valid CBOR type will be decoded and assigned to
 * the `TaggedValue.value` property.
 *
 * ```typescript
 * const { buffer } = new Uint8Array([
 *   0xa1,0x63,0x75,0x72,0x6c,0xd8,0x20,0x70,
 *   0x68,0x74,0x74,0x70,0x3a,0x2f,0x2f,0x73,
 *   0x69,0x74,0x65,0x2e,0x63,0x6f,0x6d,0x2f
 * ])
 * const decoded = decode(buffer, (key, value) => {
 *   if (value instanceof TaggedValue && value.tag === 32) return new URL(value.value)
 *   return value
 * })
 * console.log(decoded) // Expect: { url: URL { href: "http://site.com/" } }
 * ```
 *
 * Use this class when encoding custom tags.
 *
 * ```typescript
 * const tagged = new Map([["url", new URL("http://site.com/")]])
 * const encoded = encode(tagged, (key, value) => {
 *   if (value instanceof URL) return new TaggedValue(value.toString(), 32)
 *   return value
 * })
 * ```
 */
export class TaggedValue {
  constructor(value: any, tag: number | bigint) {
    this.value = value;
    this.tag = tag;
  }

  value: any;
  tag: number | bigint;
}

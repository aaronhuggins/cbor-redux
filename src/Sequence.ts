/** Class for containing a CBOR Sequence; used for encoding and decoding.
 *
 * ```typescript
 * const sequence = new Sequence([
 *   { a: "c", b: "d" },
 *   "Sample text.",
 *   9912800498001200n
 * ])
 * const encoded = encode(sequence)
 * ```
 *
 * When expecting data back as a CBOR Sequence, call `decode` with `mode: "sequence"`.
 *
 * ```typescript
 * const { buffer } = new Uint8Array([0xa1,0x61,0x61,0x61,0x63,0xa1,0x61,0x62,0x61,0x64])
 * const decoded = decode(buffer, null, { mode: "sequence" })
 * console.log(decoded)
 * // Expect: Sequence(2) [ { a: "c" }, { b: "d" } ]
 * ```
 */
export class Sequence<T = unknown> {
  static from<T = unknown>(iterable: Iterable<T> | ArrayLike<T>): Sequence<T> {
    return new Sequence(Array.from(iterable));
  }

  private _data: T[];

  constructor(data?: T[]) {
    if (data) this._data = data;
    else this._data = [];
  }

  /** Add data to the sequence and return the index of the item. */
  add(item: T): number {
    return this._data.push(item) - 1;
  }

  /** Removes an item from the sequence, returning the value. */
  remove(index: number): T {
    return this._data.splice(index, 1)[0];
  }

  /** Get an item from the sequence by index. */
  get(index: number): T {
    return this._data[index];
  }

  /** Get a shallow clone of this CBOR Sequence. */
  clone() {
    return new Sequence(this.data);
  }

  /** Get a copy of the CBOR sequence data array. */
  get data(): T[] {
    return Array.from(this._data);
  }

  get size(): number {
    return this._data.length;
  }

  [Symbol.toStringTag]() {
    return "Sequence";
  }

  [Symbol.for("Deno.customInspect")](inspect: typeof Deno.inspect) {
    return `Sequence(${this.size}) ${inspect(this._data)}`;
  }
}

/** Class for containing a CBOR Sequence. */
export class Sequence<T = unknown> {
  static from<T = unknown>(iterable: Iterable<T> | ArrayLike<T>): Sequence<T> {
    return new Sequence(Array.from(iterable));
  }

  #data: T[];

  constructor(data?: T[]) {
    if (data) this.#data = data;
    else this.#data = [];
  }

  /** Add data to the sequence and return the index of the item. */
  add(item: T): number {
    return this.#data.push(item) - 1;
  }

  /** Removes an item from the sequence, returning the value. */
  remove(index: number): T {
    return this.#data.splice(index, 1)[0];
  }

  /** Get an item from the sequence by index. */
  get(index: number): T {
    return this.#data[index];
  }

  /** Get a shallow clone of this CBOR Sequence. */
  clone() {
    return new Sequence(this.data);
  }

  /** Get a copy of the CBOR sequence data array. */
  get data(): T[] {
    return Array.from(this.#data);
  }
}

import "https://raw.githubusercontent.com/aaronhuggins/deno_mocha/e6c179156821c626354a8c792518958625078a82/global_mocha.ts";
import {
  deepStrictEqual,
  notDeepStrictEqual,
  strictEqual,
} from "https://deno.land/std@0.133.0/node/assert.ts";
import { Sequence } from "./Sequence.ts";

describe("Sequence", () => {
  const item = 13;
  let sequence: Sequence<number>;

  it("Creates squence from arbitrary iterable", () => {
    const sequence = Sequence.from(new Set([1, 2, 3, 4, 5, 6]));

    strictEqual(sequence instanceof Sequence, true);
  });

  it("Creates an empty sequence", () => {
    sequence = new Sequence();

    strictEqual(sequence.size, 0);
  });

  it("adds item to sequence", () => {
    sequence.add(item);

    strictEqual(sequence.size, 1);
  });

  it("gets an item from a sequence", () => {
    strictEqual(sequence.get(0), item);
  });

  it("removes an item from a sequence", () => {
    strictEqual(sequence.remove(0), item);
    strictEqual(sequence.size, 0);
  });

  it("should clone a sequence", () => {
    sequence.add(item);
    const clone = sequence.clone();

    deepStrictEqual(clone, sequence);
    deepStrictEqual(clone.data, sequence.data);

    clone.remove(0);

    notDeepStrictEqual(clone.data, sequence.data);
  });
});

// deno-lint-ignore-file no-explicit-any
import "https://raw.githubusercontent.com/aaronhuggins/deno_mocha/e6c179156821c626354a8c792518958625078a82/global_mocha.ts";
import {
  CBOR,
  CBOROptions,
  decode,
  Sequence,
  SimpleValue,
  TaggedValue,
} from "../mod.ts";
import { testcases, TestTaggedValue } from "./testcases.ts";
import {
  deepStrictEqual,
  doesNotThrow,
  ok as okay,
  strictEqual,
  throws,
} from "https://deno.land/std@0.133.0/node/assert.ts";

declare let process: any;

const polyfillFile =
  (typeof process !== "undefined") && (process.release.name === "node")
    ? "../polyfill.js"
    : "../polyfill.ts";
const ok: any = okay;

describe("CBOR", () => {
  for (const testcase of testcases) {
    const name = testcase[0];
    const data = testcase[1];
    const expected = testcase[2] instanceof TestTaggedValue
      ? new TaggedValue(...testcase[2].toArgs())
      : testcase[2];
    const binaryDifference = testcase[3];

    it(name, () => {
      myDeepEqual(CBOR.decode(hex2arrayBuffer(data)), expected, "Decoding");

      const encoded = CBOR.encode(expected);

      myDeepEqual(CBOR.decode(encoded), expected, "Encoding (deepEqual)");

      if (!binaryDifference) {
        let hex = "";
        const uint8Array = new Uint8Array(encoded);

        for (let i = 0; i < uint8Array.length; ++i) {
          hex += (uint8Array[i] < 0x10 ? "0" : "") +
            uint8Array[i].toString(16);
        }

        strictEqual(hex, data, "Encoding (byteMatch)");
      }
    });
  }

  it("CBOR Sequence (one or more concatenated CBOR values)", () => {
    const sequenceData = [{ "1": 2, "3": 4 }, { "2": 1, "4": 5 }];
    const expected = new Sequence(sequenceData);
    const data = hex2arrayBuffer("a201020304a202010405");

    myDeepEqual(
      CBOR.decode(data, null, { mode: "sequence" }),
      expected,
      "Decoding",
    );

    const encoded = CBOR.encode(expected);

    myDeepEqual(
      CBOR.decode(encoded, null, { mode: "sequence" }),
      expected,
      "Encoding (deepEqual)",
    );
  });

  it("Big Array", () => {
    const value = new Array(0x10001);

    for (let i = 0; i < value.length; ++i) {
      value[i] = i;
    }

    deepStrictEqual(CBOR.decode(CBOR.encode(value)), value, "deepEqual");
  });

  it("Remaining Bytes", () => {
    throws(() => {
      const arrayBuffer = new ArrayBuffer(2);

      CBOR.decode(arrayBuffer);
    });
  });

  it("Invalid length encoding", () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer("1e"));
    });
  });

  it("Invalid length", () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer("1f"));
    });
  });

  it("Invalid indefinite length element type", () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer("5f00"));
    });
  });

  it("Invalid indefinite length element length", () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer("5f5f"));
    });
  });

  it("Tagging", () => {
    const arrayBuffer = hex2arrayBuffer("83d81203d9456708f8f0");
    const decoded = CBOR.decode(
      arrayBuffer,
      null,
    );

    ok(decoded[0] instanceof TaggedValue, "first item is a TaggedValue");
    strictEqual(decoded[0].value, 3, "first item value");
    strictEqual(decoded[0].tag, 0x12, "first item tag");

    ok(decoded[1] instanceof TaggedValue, "second item is a TaggedValue");
    strictEqual(decoded[1].value, 8, "second item value");
    strictEqual(decoded[1].tag, 0x4567, "second item tag");

    ok(decoded[2] instanceof SimpleValue, "third item is a SimpleValue");
    strictEqual(decoded[2].value, 0xf0, "third item tag");
  });

  it("should encode string edge cases", () => {
    // See issue https://github.com/paroga/cbor-js/issues/27.
    const str = "\uff08\u9999\u6e2f\uff09";
    const expected = hex2arrayBuffer("6cefbc88e9a699e6b8afefbc89");
    const result = CBOR.encode(str);

    deepStrictEqual(result, expected);
  });

  it("should encode data views and array buffers", () => {
    // See issue https://github.com/paroga/cbor-js/issues/21.
    const objView = { dataView: new Uint32Array(4) };
    const objBuf = { buffer: new ArrayBuffer(8) };
    const view = new Uint8Array(objBuf.buffer);

    for (let i = 0; i < objView.dataView.length; i += 1) {
      objView.dataView[i] = i * 3;
    }

    for (let i = 0; i < view.length; i += 1) {
      view[i] = i * 3;
    }

    const expectedView = hex2arrayBuffer(
      "a1686461746156696577d8465000000000030000000600000009000000",
    );
    const expectedBuf = hex2arrayBuffer("a16662756666657248000306090c0f1215");
    const resultView = CBOR.encode(objView);
    const resultBuf = CBOR.encode(objBuf);

    deepStrictEqual(resultView, expectedView);
    deepStrictEqual(resultBuf, expectedBuf);
  });

  it("should encode big string", () => {
    // See issue https://github.com/paroga/cbor-js/issues/24.
    let value = "";

    for (let i = 0; i < 150000; ++i) {
      value += Math.floor(i % 10).toString();
    }

    deepStrictEqual(CBOR.decode(CBOR.encode(value)), value, "deepEqual");
  });

  it("should use javascript map", () => {
    const opts: CBOROptions = { dictionary: "map" };
    const value = new Map<any, any>([[1, "value1"], [
      new Uint8Array([4, 5, 6]),
      "value2",
    ]]);

    deepStrictEqual(
      CBOR.decode(CBOR.encode(value), null, opts),
      value,
      "deepEqual",
    );
  });

  it("should use replacer array", () => {
    const expected = { Hello: "World" };
    const initial = { Hello: "World", how: "are you?" };
    const encoded = CBOR.encode(initial, ["Hello"]);
    const actual = CBOR.decode(encoded);

    deepStrictEqual(actual, expected, "deepEqual");
  });

  it("should use replacer function", () => {
    const expected = { Hello: "World", how: "do you do?" };
    const initial = { Hello: "World", how: "are you?" };
    const encoded = CBOR.binarify(initial, (_key, value) => {
      if (value === initial.how) return "do you do?";
      return value;
    });
    const actual = CBOR.parse(encoded);

    deepStrictEqual(actual, expected, "deepEqual");
  });

  it("should use reviver function", () => {
    const opts: CBOROptions = { dictionary: "map" };
    const reviver = (key: any, tagged: any) => {
      if (key === "tagged" && tagged instanceof TaggedValue) {
        return tagged.value;
      }
      return tagged;
    };
    const expected = new Map([["tagged", "Greetings!"]]);
    const initial = { tagged: new TaggedValue("Greetings!", 4294967297) };
    const encoded = CBOR.encode(initial);
    const actual = CBOR.decode(encoded, reviver, opts);

    deepStrictEqual(actual, expected, "deepEqual");
  });

  it("should return without slice method", () => {
    const object = { hello: "world!" };
    const expected = hex2arrayBuffer("a16568656c6c6f66776f726c6421");
    const originalSlice = (globalThis as any).ArrayBuffer.prototype.slice;

    delete (globalThis as any).ArrayBuffer.prototype.slice;

    const result = CBOR.encode(object);

    deepStrictEqual(result, expected);

    (globalThis as any).ArrayBuffer.prototype.slice = originalSlice;
  });

  it("should use objectIs polyfill", () => {
    const object = { hello: "world!", greetings: -0 };
    const originalObjectIs = (globalThis as any).Object.is;

    delete (globalThis as any).Object.is;

    doesNotThrow(() => {
      CBOR.encode(object);
      (globalThis as any).Object.is = originalObjectIs;
    });
  });

  it("Polyfill adds CBOR to global scope", async () => {
    const { polyfill } = await import(polyfillFile);

    await polyfill();

    strictEqual((globalThis as any).CBOR.decode.name, decode.name);
    if (typeof (globalThis as any).window === "undefined") {
      (globalThis as any).window = {} as any;
      await polyfill();

      strictEqual((globalThis as any).window.CBOR.decode.name, decode.name);
    }
  });
});

function myDeepEqual(actual: any, expected: any, message?: string) {
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
}

function hex2arrayBuffer(data: string) {
  const length = data.length / 2;
  const ret = new Uint8Array(length);

  for (let i = 0; i < length; i += 1) {
    ret[i] = parseInt(data.substr(i * 2, 2), 16);
  }

  return ret.buffer;
}

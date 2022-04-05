import { CBOR, decode, SimpleValue, TaggedValue } from "../src/CBOR";
import { testcases, TestTaggedValue } from "./testcases";
import { helpers } from "./helpers";
import { deepStrictEqual, doesNotThrow, ok, strictEqual, throws } from "assert";
import { mochaTests } from "./mochaTests";

const { myDeepEqual, hex2arrayBuffer } = helpers(deepStrictEqual, ok);

mochaTests(
  testcases,
  {
    CBOR,
    TaggedValue,
    SimpleValue,
    decode,
    polyfillFile: "../src/polyfill",
  },
  {
    myDeepEqual,
    hex2arrayBuffer,
    TestTaggedValue,
  },
  {
    deepStrictEqual,
    strictEqual,
    doesNotThrow,
    throws,
    ok,
  },
);

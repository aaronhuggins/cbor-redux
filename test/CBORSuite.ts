import { CBOR, decode, SimpleValue, TaggedValue } from "../mod.ts";
import { testcases, TestTaggedValue } from "./testcases.ts";
import { helpers } from "./helpers.ts";
import { mochaTests } from "./mochaTests.ts";
import {
  deepStrictEqual,
  strictEqual,
  doesNotThrow,
  throws,
  ok,
} from "https://deno.land/std@0.133.0/node/assert.ts";

const { myDeepEqual, hex2arrayBuffer } = helpers();

mochaTests(
  testcases,
  {
    CBOR,
    TaggedValue,
    SimpleValue,
    decode,
    polyfillFile: '../polyfill.ts'
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
  }
);

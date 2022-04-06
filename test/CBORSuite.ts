import { CBOR, decode, SimpleValue, TaggedValue } from "../mod.ts";
import { testcases, TestTaggedValue } from "./testcases.ts";
import { hex2arrayBuffer, myDeepEqual } from "./helpers.ts";
import * as mochaTests from "./mochaTests.ts";
import {
  deepStrictEqual,
  doesNotThrow,
  ok,
  strictEqual,
  throws,
} from "https://deno.land/std@0.133.0/node/assert.ts";

/* mochaTests(
  testcases,
  {
    CBOR,
    TaggedValue,
    SimpleValue,
    decode,
    polyfillFile: "../polyfill.ts",
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
*/
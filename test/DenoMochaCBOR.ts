import 'https://deno.land/x/deno_mocha/mod.ts'
import { CBOR, TaggedValue, SimpleValue, decode } from '../mod.ts'
import { testcases } from './testcases.ts'
import { helpers } from './helpers.ts'
import { mochaTests } from './mochaTests.ts'
import { deepStrictEqual, strictEqual, throws, ok } from 'https://deno.land/std/node/assert.ts'

const { myDeepEqual, hex2arrayBuffer } = helpers(deepStrictEqual, ok)

mochaTests(
  testcases,
  {
    CBOR,
    TaggedValue,
    SimpleValue,
    decode
  },
  {
    myDeepEqual,
    hex2arrayBuffer
  },
  {
    deepStrictEqual,
    strictEqual,
    throws,
    ok
  }
)

import { CBOR, TaggedValue, SimpleValue, decode } from '../src/CBOR'
import { testcases } from './testcases'
import { helpers } from './helpers'
import { deepStrictEqual, strictEqual, doesNotThrow, throws, ok } from 'assert'
import { mochaTests } from './mochaTests'

const { myDeepEqual, hex2arrayBuffer } = helpers(deepStrictEqual, ok)

mochaTests(
  testcases,
  {
    CBOR,
    TaggedValue,
    SimpleValue,
    decode,
    polyfillFile: '../src/polyfill'
  },
  {
    myDeepEqual,
    hex2arrayBuffer
  },
  {
    deepStrictEqual,
    strictEqual,
    doesNotThrow,
    throws,
    ok
  }
)

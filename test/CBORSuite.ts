import { CBOR, TaggedValue, SimpleValue, decode } from '../src/CBOR'
import { testcases } from './testcases'
import { helpers } from './helpers'
import { deepStrictEqual, strictEqual, throws, ok } from 'assert'
import { mochaTests } from './mochaTests'

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

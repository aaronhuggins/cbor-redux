import 'https://deno.land/x/deno_mocha/mod.ts'
import { CBOR, TaggedValue, SimpleValue, decode } from '../mod.ts'
import { testcases, TestTaggedValue } from './testcases.ts'
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
    hex2arrayBuffer,
    TestTaggedValue
  },
  {
    deepStrictEqual,
    strictEqual,
    doesNotThrow (block: Function, message: string | Error) {
      try {
        block()
      } catch (error) {
        if (typeof message === 'string') {
          throw new Error(message)
        } else if (message instanceof Error) {
          throw message
        } else {
          throw error
        }
      }
    },
    throws,
    ok
  }
)

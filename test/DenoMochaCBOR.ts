// @deno-types="https://unpkg.com/@types/mocha@8.0.3/index.d.ts"
import 'https://unpkg.com/mocha@8.1.3/mocha.js'
import { deepStrictEqual, strictEqual, throws, ok } from 'https://deno.land/std@0.67.0/node/assert.ts'
import { CBOR, TaggedValue, SimpleValue, decode } from '../mod.ts'
import { testcases } from './testcases.ts'
import { helpers } from './helpers.ts'
import { mochaTests } from './mochaTests.ts'

const { myDeepEqual, hex2arrayBuffer } = helpers(deepStrictEqual, ok)

;(window as any).location = new URL("http://localhost:0")
mocha.setup({ ui: "bdd", reporter: "spec" })
mocha.checkLeaks()

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

mocha.run(function onCompleted (failures: number): void {
  if (failures > 0) {
    Deno.exit(1)
  } else {
    Deno.exit(0)
  }
}).globals(['onerror'])

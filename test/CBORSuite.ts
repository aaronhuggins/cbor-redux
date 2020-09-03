import { CBOR, TaggedValue, SimpleValue } from '../src/CBOR'
import { testcases } from './testcases'
import { myDeepEqual, hex2arrayBuffer } from './helpers'
import { deepStrictEqual, strictEqual, throws, ok } from 'assert'

describe('CBOR', () => {
  for (const testcase of testcases) {
    const name = testcase[0]
    const data = testcase[1]
    const expected = testcase[2]
    const binaryDifference = testcase[3]

    it(name, function () {
      myDeepEqual(CBOR.decode(hex2arrayBuffer(data)), expected, 'Decoding')

      const encoded = CBOR.encode(expected)

      myDeepEqual(CBOR.decode(encoded), expected, 'Encoding (deepEqual)')

      if (!binaryDifference) {
        let hex = ''
        const uint8Array = new Uint8Array(encoded)

        for (var i = 0; i < uint8Array.length; ++i) {
          hex += (uint8Array[i] < 0x10 ? '0' : '') + uint8Array[i].toString(16)
        }

        strictEqual(hex, data, 'Encoding (byteMatch)')
      }
    })
  }

  it('Big Array', function () {
    const value = new Array(0x10001)

    for (let i = 0; i < value.length; ++i) {
      value[i] = i
    }

    deepStrictEqual(CBOR.decode(CBOR.encode(value)), value, 'deepEqual')
  })

  it('Remaining Bytes', function () {
    throws(() => {
      const arrayBuffer = new ArrayBuffer(2)

      CBOR.decode(arrayBuffer)
    })
  })

  it('Invalid length encoding', function () {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('1e'))
    })
  })

  it('Invalid length', function () {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('1f'))
    })
  })

  it('Invalid indefinite length element type', function () {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('5f00'))
    })
  })

  it('Invalid indefinite length element length', function () {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('5f5f'))
    })
  })

  it('Tagging', function () {
    const arrayBuffer = hex2arrayBuffer('83d81203d9456708f8f0')
    const decoded = CBOR.decode(
      arrayBuffer,
      (value: any, tag: any) => {
        return new TaggedValue(value, tag)
      },
      (value: any) => {
        return new SimpleValue(value)
      }
    )

    ok(decoded[0] instanceof TaggedValue, 'first item is a TaggedValue')
    strictEqual(decoded[0].value, 3, 'first item value')
    strictEqual(decoded[0].tag, 0x12, 'first item tag')

    ok(decoded[1] instanceof TaggedValue, 'second item is a TaggedValue')
    strictEqual(decoded[1].value, 8, 'second item value')
    strictEqual(decoded[1].tag, 0x4567, 'second item tag')

    ok(decoded[2] instanceof SimpleValue, 'third item is a SimpleValue')
    strictEqual(decoded[2].value, 0xf0, 'third item tag')
  })
})

import { CBOR } from '../src/CBOR'
import { testcases } from './testcases'
import { myDeepEqual, hex2arrayBuffer } from './helpers'
import { deepStrictEqual, equal } from 'assert'

const object = { hello: 'world!' }
const uint8Array = new Uint8Array([0xa1, 0x65, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x66, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21])
const binary = uint8Array.buffer

describe('CBOR', () => {
  it('should serialize object', () => {
    const bin = CBOR.encode(object)

    deepStrictEqual(bin, binary)
  })

  it('should deserialize object', () => {
    const obj = CBOR.decode(binary)

    deepStrictEqual(obj, object)
  })

  for (const testcase of testcases) {
    const name = testcase[0]
    const data = testcase[1]
    const expected = testcase[2]
    const binaryDifference = testcase[3]

    it(name, function () {
      myDeepEqual(CBOR.decode(hex2arrayBuffer(data)), expected, 'Decoding')
      var encoded = CBOR.encode(expected)
      myDeepEqual(CBOR.decode(encoded), expected, 'Encoding (deepEqual)')
      if (!binaryDifference) {
        var hex = ''
        var uint8Array = new Uint8Array(encoded)
        for (var i = 0; i < uint8Array.length; ++i)
          hex += (uint8Array[i] < 0x10 ? '0' : '') + uint8Array[i].toString(16)
        equal(hex, data, 'Encoding (byteMatch)')
      }
    })
  }
})

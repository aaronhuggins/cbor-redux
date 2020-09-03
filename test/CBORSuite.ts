import { CBOR } from '../src/CBOR'
import { deepStrictEqual } from 'assert'

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
})

import { CBOR, TaggedValue, SimpleValue, decode } from '../src/CBOR'
import { testcases } from './testcases'
import { myDeepEqual, hex2arrayBuffer } from './helpers'
import { deepStrictEqual, strictEqual, throws, ok } from 'assert'

describe('CBOR', () => {
  for (const testcase of testcases) {
    const name = testcase[0]
    const data = testcase[1]
    const expected = testcase[2]
    const binaryDifference = testcase[3]

    it(name, () => {
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

  it('Big Array', () => {
    const value = new Array(0x10001)

    for (let i = 0; i < value.length; ++i) {
      value[i] = i
    }

    deepStrictEqual(CBOR.decode(CBOR.encode(value)), value, 'deepEqual')
  })

  it('Remaining Bytes', () => {
    throws(() => {
      const arrayBuffer = new ArrayBuffer(2)

      CBOR.decode(arrayBuffer)
    })
  })

  it('Invalid length encoding', () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('1e'))
    })
  })

  it('Invalid length', () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('1f'))
    })
  })

  it('Invalid indefinite length element type', () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('5f00'))
    })
  })

  it('Invalid indefinite length element length', () => {
    throws(() => {
      CBOR.decode(hex2arrayBuffer('5f5f'))
    })
  })

  it('Tagging', () => {
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

  it('should encode string edge cases', () => {
    // See issue https://github.com/paroga/cbor-js/issues/27.
    const str = '\uff08\u9999\u6e2f\uff09'
    const expected = hex2arrayBuffer('6cefbc88e9a699e6b8afefbc89')
    const result = CBOR.encode(str)

    deepStrictEqual(result, expected)
  })

  it('should encode data views and array buffers', () => {
    // See issue https://github.com/paroga/cbor-js/issues/21.
    const objView = { dataView: new Uint32Array(4) }
    const objBuf = { buffer: new ArrayBuffer(8) }
    const view = new Uint8Array(objBuf.buffer)

    for (let i = 0; i < objView.dataView.length; i += 1) {
      objView.dataView[i] = i * 3
    }

    for (let i = 0; i < view.length; i += 1) {
      view[i] = i * 3
    }

    const expectedView = hex2arrayBuffer('a16864617461566965775000000000030000000600000009000000')
    const expectedBuf = hex2arrayBuffer('a16662756666657248000306090c0f1215')
    const resultView = CBOR.encode(objView)
    const resultBuf = CBOR.encode(objBuf)

    deepStrictEqual(resultView, expectedView)
    deepStrictEqual(resultBuf, expectedBuf)
  })

  it('should encode big string', () => {
    // See issue https://github.com/paroga/cbor-js/issues/24.
    let value = ''

    for (var i = 0; i < 150000; ++i) {
      value += Math.floor(i % 10).toString()
    }

    deepStrictEqual(CBOR.decode(CBOR.encode(value)), value, 'deepEqual')
  })

  it('should return without slice method', () => {
    const object = { hello: 'world!' }
    const expected = hex2arrayBuffer('a16568656c6c6f66776f726c6421')

    delete global.ArrayBuffer.prototype.slice

    const result = CBOR.encode(object)

    deepStrictEqual(result, expected)
  })

  it ('Polyfill adds CBOR to global scope', async () => {
    const { polyfill } = await import('../src/polyfill')

    await polyfill()

    strictEqual((globalThis as any).CBOR.decode, decode)

    globalThis.window = {} as any

    await polyfill()

    strictEqual((globalThis as any).window.CBOR.decode, decode)
  })
})

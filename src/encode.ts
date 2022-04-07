// deno-lint-ignore-file no-unused-vars no-explicit-any
import {
  EMPTY_KEY,
  kCborTag,
  kCborTagFloat32,
  kCborTagFloat64,
  kCborTagInt16,
  kCborTagInt32,
  kCborTagInt8,
  kCborTagUint16,
  kCborTagUint32,
  kCborTagUint8,
  OMIT_VALUE,
  POW_2_32,
  POW_2_53,
} from "./constants.ts";
import { objectIs } from "./helpers.ts";
import { SimpleValue } from "./SimpleValue.ts";
import { TaggedValue } from "./TaggedValue.ts";
import { CBORReplacer } from "./types.ts";

/**
 * Converts a JavaScript value to a Concise Binary Object Representation (CBOR) buffer.
 * @param value - A JavaScript value, usually an object or array, to be converted.
 * @param replacer - A function that alters the behavior of the encoding process,
 * or an array of strings or numbers naming properties of value that should be included
 * in the output. If replacer is null or not provided, all properties of the object are
 * included in the resulting CBOR buffer.
 * @returns The JavaScript value converted to CBOR format.
 */
export function encode<T = any>(
  value: T,
  replacer?: CBORReplacer | null,
): ArrayBuffer {
  let data = new ArrayBuffer(256);
  let dataView = new DataView(data);
  let byteView = new Uint8Array(data);
  let lastLength: number;
  let offset = 0;
  let replacerFunction: CBORReplacer = (key, value) => value;

  if (typeof replacer === "function") replacerFunction = replacer;

  function prepareWrite(length: number): DataView {
    let newByteLength = data.byteLength;
    const requiredLength = offset + length;
    while (newByteLength < requiredLength) newByteLength <<= 1;
    if (newByteLength !== data.byteLength) {
      const oldDataView = dataView;
      data = new ArrayBuffer(newByteLength);
      dataView = new DataView(data);
      byteView = new Uint8Array(data);
      const uint32count = (offset + 3) >> 2;
      for (let i = 0; i < uint32count; ++i) {
        dataView.setUint32(i << 2, oldDataView.getUint32(i << 2));
      }
    }

    lastLength = length;
    return dataView;
  }
  function commitWrite(...args: any[]) {
    offset += lastLength;
  }
  function writeFloat64(val: number) {
    commitWrite(prepareWrite(8).setFloat64(offset, val));
  }
  function writeUint8(val: number) {
    commitWrite(prepareWrite(1).setUint8(offset, val));
  }
  function writeUint8Array(val: number[] | Uint8Array) {
    prepareWrite(val.length);
    byteView.set(val, offset);
    commitWrite();
  }
  function writeUint16(val: number) {
    commitWrite(prepareWrite(2).setUint16(offset, val));
  }
  function writeUint32(val: number) {
    commitWrite(prepareWrite(4).setUint32(offset, val));
  }
  function writeUint64(val: number) {
    const low = val % POW_2_32;
    const high = (val - low) / POW_2_32;
    const view = prepareWrite(8);
    view.setUint32(offset, high);
    view.setUint32(offset + 4, low);
    commitWrite();
  }
  function writeVarUint(val: number, mod: number) {
    if (val <= 0xff) {
      if (val < 24) {
        writeUint8(val | mod);
      } else {
        writeUint8(0x18 | mod);
        writeUint8(val);
      }
    } else if (val <= 0xffff) {
      writeUint8(0x19 | mod);
      writeUint16(val);
    } else if (val <= 0xffffffff) {
      writeUint8(0x1a | mod);
      writeUint32(val);
    } else {
      writeUint8(0x1b | mod);
      writeUint64(val);
    }
  }
  function writeTypeAndLength(type: number, length: number) {
    if (length < 24) {
      writeUint8((type << 5) | length);
    } else if (length < 0x100) {
      writeUint8((type << 5) | 24);
      writeUint8(length);
    } else if (length < 0x10000) {
      writeUint8((type << 5) | 25);
      writeUint16(length);
    } else if (length < 0x100000000) {
      writeUint8((type << 5) | 26);
      writeUint32(length);
    } else {
      writeUint8((type << 5) | 27);
      writeUint64(length);
    }
  }

  function encodeItem(val: any) {
    if (val === OMIT_VALUE) return;
    let i;

    if (val === false) return writeUint8(0xf4);
    if (val === true) return writeUint8(0xf5);
    if (val === null) return writeUint8(0xf6);
    if (val === undefined) return writeUint8(0xf7);
    if (objectIs(val, -0)) return writeUint8Array([0xf9, 0x80, 0x00]);

    switch (typeof val) {
      case "number":
        if (Math.floor(val) === val) {
          if (0 <= val && val <= POW_2_53) return writeTypeAndLength(0, val);
          if (-POW_2_53 <= val && val < 0) {
            return writeTypeAndLength(1, -(val + 1));
          }
        }
        writeUint8(0xfb);
        return writeFloat64(val);

      case "string": {
        const utf8data = [];
        for (i = 0; i < val.length; ++i) {
          let charCode = val.charCodeAt(i);
          if (charCode < 0x80) {
            utf8data.push(charCode);
          } else if (charCode < 0x800) {
            utf8data.push(0xc0 | (charCode >> 6));
            utf8data.push(0x80 | (charCode & 0x3f));
          } else if (charCode < 0xd800 || charCode >= 0xe000) {
            utf8data.push(0xe0 | (charCode >> 12));
            utf8data.push(0x80 | ((charCode >> 6) & 0x3f));
            utf8data.push(0x80 | (charCode & 0x3f));
          } else {
            charCode = (charCode & 0x3ff) << 10;
            charCode |= val.charCodeAt(++i) & 0x3ff;
            charCode += 0x10000;

            utf8data.push(0xf0 | (charCode >> 18));
            utf8data.push(0x80 | ((charCode >> 12) & 0x3f));
            utf8data.push(0x80 | ((charCode >> 6) & 0x3f));
            utf8data.push(0x80 | (charCode & 0x3f));
          }
        }

        writeTypeAndLength(3, utf8data.length);
        return writeUint8Array(utf8data);
      }
      default: {
        let length;
        let converted;
        if (Array.isArray(val)) {
          length = val.length;
          writeTypeAndLength(4, length);
          for (i = 0; i < length; i += 1) {
            encodeItem(replacerFunction(i, val[i]));
          }
        } // RFC8746 CBOR Tags
        else if (val instanceof Uint8Array) {
          writeVarUint(kCborTagUint8, kCborTag << 5);
          writeTypeAndLength(2, val.length);
          writeUint8Array(val);
        } else if (val instanceof Int8Array) {
          writeVarUint(kCborTagInt8, kCborTag << 5);
          writeTypeAndLength(2, val.byteLength);
          writeUint8Array(new Uint8Array(val.buffer));
        } else if (val instanceof Uint16Array) {
          writeVarUint(kCborTagUint16, kCborTag << 5);
          writeTypeAndLength(2, val.byteLength);
          writeUint8Array(new Uint8Array(val.buffer));
        } else if (val instanceof Int16Array) {
          writeVarUint(kCborTagInt16, kCborTag << 5);
          writeTypeAndLength(2, val.byteLength);
          writeUint8Array(new Uint8Array(val.buffer));
        } else if (val instanceof Uint32Array) {
          writeVarUint(kCborTagUint32, kCborTag << 5);
          writeTypeAndLength(2, val.byteLength);
          writeUint8Array(new Uint8Array(val.buffer));
        } else if (val instanceof Int32Array) {
          writeVarUint(kCborTagInt32, kCborTag << 5);
          writeTypeAndLength(2, val.byteLength);
          writeUint8Array(new Uint8Array(val.buffer));
        } else if (val instanceof Float32Array) {
          writeVarUint(kCborTagFloat32, kCborTag << 5);
          writeTypeAndLength(2, val.byteLength);
          writeUint8Array(new Uint8Array(val.buffer));
        } else if (val instanceof Float64Array) {
          writeVarUint(kCborTagFloat64, kCborTag << 5);
          writeTypeAndLength(2, val.byteLength);
          writeUint8Array(new Uint8Array(val.buffer));
        } else if (ArrayBuffer.isView(val)) {
          converted = new Uint8Array(val.buffer);
          writeTypeAndLength(2, converted.length);
          writeUint8Array(converted);
        } else if (
          val instanceof ArrayBuffer ||
          (typeof SharedArrayBuffer === "function" &&
            val instanceof SharedArrayBuffer)
        ) {
          converted = new Uint8Array(val);
          writeTypeAndLength(2, converted.length);
          writeUint8Array(converted);
        } else if (val instanceof TaggedValue) {
          writeVarUint(val.tag, 0b11000000);
          encodeItem(val.value);
        } else if (val instanceof SimpleValue) {
          writeTypeAndLength(7, val.value);
        } else if (val instanceof Map) {
          length = val.size;
          writeTypeAndLength(5, length);
          for (const [key, value] of val.entries()) {
            const result = replacerFunction(key, value);
            if (result === OMIT_VALUE) continue;
            encodeItem(key);
            encodeItem(result);
          }
        } else {
          const keys = Object.keys(val);
          length = keys.length;
          writeTypeAndLength(5, length);
          for (i = 0; i < length; i += 1) {
            const key = keys[i];
            const result = replacerFunction(key, val[key]);
            if (result === OMIT_VALUE) continue;
            encodeItem(key);
            encodeItem(result);
          }
        }
      }
    }
  }

  encodeItem(replacerFunction(EMPTY_KEY, value));

  if ("slice" in data) return data.slice(0, offset);

  const ret = new ArrayBuffer(offset);
  const retView = new DataView(ret);
  for (let i = 0; i < offset; ++i) retView.setUint8(i, dataView.getUint8(i));
  return ret;
}

/** Converts a JavaScript value to a CBOR binary; extends the replacer to allow an array of `string` or `number`, just like `JSON.stringify`. */
export function binarify (value: any, replacer?: CBORReplacer | Array<string | number> | null): ArrayBuffer {
  if (Array.isArray(replacer)) {
    const exclude = replacer.slice()
    return encode(value, function replacer (key, value) {
      if (exclude.includes(key)) return OMIT_VALUE
      return value
    })
  }

  return encode(value, replacer)
}

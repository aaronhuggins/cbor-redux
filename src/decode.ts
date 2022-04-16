// deno-lint-ignore-file no-explicit-any no-unused-vars
import {
  DECODE_CHUNK_SIZE,
  EMPTY_KEY,
  kCborTagFloat32,
  kCborTagFloat64,
  kCborTagInt16,
  kCborTagInt32,
  kCborTagInt8,
  kCborTagUint16,
  kCborTagUint32,
  kCborTagUint8,
  POW_2_24,
  POW_2_53,
} from "./constants.ts";
import { options } from "./helpers.ts";
import { Sequence } from "./Sequence.ts";
import { SimpleValue } from "./SimpleValue.ts";
import { TaggedValue } from "./TaggedValue.ts";
import { CBOROptions, CBORReviver, CBORSequenceOptions } from "./types.ts";

/**
 * Converts a Concise Binary Object Representation (CBOR) buffer into an object.
 * 
 * ```typescript
 * const buffer = new Uint8Array([0xa2, 0x01, 0x02, 0x03, 0x04]).buffer
 * const decoded = decode(buffer)
 * console.log(decoded) // Expect: { "1": 2, "3": 4 }
 * ```
 * 
 * If maps which preserve the key data types are desired, use `dictionary: "map"`.
 * 
 * ```typescript
 * const buffer = new Uint8Array([0xa2, 0x01, 0x02, 0x03, 0x04]).buffer
 * const decoded = decode(buffer, null, { dictionary: "map" })
 * console.log(decoded) // Expect: Map { 1 => 2, 3 => 4 }
 * ```
 * 
 * @param data - A valid CBOR buffer.
 * @param reviver - If a function, this prescribes how the value originally produced by parsing is transformed, before being returned.
 * @param cborOptions - An options bag to specify the dictionary type and mode for the decoder.
 * @returns The CBOR buffer converted to a JavaScript value.
 */
export function decode<T = any>(
  data: ArrayBuffer | SharedArrayBuffer,
  reviver: CBORReviver | null | undefined,
  cborOptions: CBORSequenceOptions,
): Sequence<T>;
export function decode<T = any>(
  data: ArrayBuffer | SharedArrayBuffer,
  reviver?: CBORReviver | null,
  cborOptions?: CBOROptions,
): T;
export function decode<T = any>(
  data: ArrayBuffer | SharedArrayBuffer,
  reviver?: CBORReviver | null,
  cborOptions: CBOROptions = {},
): T {
  const { dictionary, mode } = options(cborOptions);
  const isStrict = mode === "sequence" || mode === "strict";
  const dataView = new DataView(data);
  const ta = new Uint8Array(data);
  let offset = 0;
  let reviverFunction: CBORReviver = function (key, value) {
    return value;
  };
  if (typeof reviver === "function") reviverFunction = reviver;

  function commitRead<T>(length: number, value: T): T {
    offset += length;
    return value;
  }
  function readArrayBuffer(length: number) {
    return commitRead(length, new Uint8Array(data, offset, length));
  }
  function readFloat16() {
    const tempArrayBuffer = new ArrayBuffer(4);
    const tempDataView = new DataView(tempArrayBuffer);
    const value = readUint16();

    const sign = value & 0x8000;
    let exponent = value & 0x7c00;
    const fraction = value & 0x03ff;

    if (exponent === 0x7c00) exponent = 0xff << 10;
    else if (exponent !== 0) exponent += (127 - 15) << 10;
    else if (fraction !== 0) return (sign ? -1 : 1) * fraction * POW_2_24;

    tempDataView.setUint32(
      0,
      (sign << 16) | (exponent << 13) | (fraction << 13),
    );
    return tempDataView.getFloat32(0);
  }
  function readFloat32(): number {
    return commitRead(4, dataView.getFloat32(offset));
  }
  function readFloat64(): number {
    return commitRead(8, dataView.getFloat64(offset));
  }
  function readUint8(): number {
    return commitRead(1, ta[offset]);
  }
  function readUint16(): number {
    return commitRead(2, dataView.getUint16(offset));
  }
  function readUint32(): number {
    return commitRead(4, dataView.getUint32(offset));
  }
  function readUint64(): bigint {
    return commitRead(8, dataView.getBigUint64(offset));
  }
  function readBreak(): boolean {
    if (ta[offset] !== 0xff) return false;
    offset += 1;
    return true;
  }
  function readLength(additionalInformation: number): number | bigint {
    if (additionalInformation < 24) return additionalInformation;
    if (additionalInformation === 24) return readUint8();
    if (additionalInformation === 25) return readUint16();
    if (additionalInformation === 26) return readUint32();
    if (additionalInformation === 27) {
      const integer = readUint64();
      if (integer < POW_2_53) return Number(integer);
      return integer;
    }
    if (additionalInformation === 31) return -1;
    throw new Error("CBORError: Invalid length encoding");
  }
  function readIndefiniteStringLength(majorType: number): number {
    const initialByte = readUint8();
    if (initialByte === 0xff) return -1;
    const length = readLength(initialByte & 0x1f);
    if (length < 0 || initialByte >> 5 !== majorType) {
      throw new Error("CBORError: Invalid indefinite length element");
    }
    return Number(length);
  }

  function appendUtf16Data(utf16data: number[], length: number) {
    for (let i = 0; i < length; ++i) {
      let value = readUint8();
      if (value & 0x80) {
        if (value < 0xe0) {
          value = ((value & 0x1f) << 6) | (readUint8() & 0x3f);
          length -= 1;
        } else if (value < 0xf0) {
          value = ((value & 0x0f) << 12) | ((readUint8() & 0x3f) << 6) |
            (readUint8() & 0x3f);
          length -= 2;
        } else {
          value = ((value & 0x0f) << 18) | ((readUint8() & 0x3f) << 12) |
            ((readUint8() & 0x3f) << 6) | (readUint8() & 0x3f);
          length -= 3;
        }
      }

      if (value < 0x10000) {
        utf16data.push(value);
      } else {
        value -= 0x10000;
        utf16data.push(0xd800 | (value >> 10));
        utf16data.push(0xdc00 | (value & 0x3ff));
      }
    }
  }

  function decodeItem(): any {
    const initialByte = readUint8();
    const majorType = initialByte >> 5;
    const additionalInformation = initialByte & 0x1f;
    let i;
    let length;

    if (majorType === 7) {
      switch (additionalInformation) {
        case 25:
          return readFloat16();
        case 26:
          return readFloat32();
        case 27:
          return readFloat64();
      }
    }

    length = readLength(additionalInformation);
    if (length < 0 && (majorType < 2 || 6 < majorType)) {
      throw new Error("CBORError: Invalid length");
    }

    switch (majorType) {
      case 0:
        return reviverFunction(EMPTY_KEY, length);
      case 1:
        if (typeof length === "number") {
          return reviverFunction(EMPTY_KEY, -1 - length);
        }
        return reviverFunction(EMPTY_KEY, -1n - length);
      case 2: {
        if (length < 0) {
          const elements = [];
          let fullArrayLength = 0;
          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
            fullArrayLength += length;
            elements.push(readArrayBuffer(length));
          }
          const fullArray = new Uint8Array(fullArrayLength);
          let fullArrayOffset = 0;
          for (i = 0; i < elements.length; ++i) {
            fullArray.set(elements[i], fullArrayOffset);
            fullArrayOffset += elements[i].length;
          }
          return reviverFunction(EMPTY_KEY, fullArray);
        }
        return reviverFunction(EMPTY_KEY, readArrayBuffer(length as number));
      }
      case 3: {
        const utf16data: number[] = [];
        if (length < 0) {
          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
            appendUtf16Data(utf16data, length);
          }
        } else {
          appendUtf16Data(utf16data, length as number);
        }
        let string = "";
        for (i = 0; i < utf16data.length; i += DECODE_CHUNK_SIZE) {
          string += String.fromCharCode.apply(
            null,
            utf16data.slice(i, i + DECODE_CHUNK_SIZE),
          );
        }
        return reviverFunction(EMPTY_KEY, string);
      }
      case 4: {
        let retArray;
        if (length < 0) {
          retArray = [];
          let index = 0;
          while (!readBreak()) {
            retArray.push(reviverFunction(index++, decodeItem()));
          }
        } else {
          retArray = new Array(length);
          for (i = 0; i < length; ++i) {
            retArray[i] = reviverFunction(i, decodeItem());
          }
        }
        return reviverFunction(EMPTY_KEY, retArray);
      }
      case 5: {
        if (dictionary === "map") {
          const retMap = new Map<any, any>();
          for (i = 0; i < length || (length < 0 && !readBreak()); ++i) {
            const key = decodeItem();
            if (isStrict && retMap.has(key)) {
              throw new Error("CBORError: Duplicate key encountered");
            }
            retMap.set(key, reviverFunction(key, decodeItem()));
          }
          return reviverFunction(EMPTY_KEY, retMap);
        }
        const retObject: any = {};
        for (i = 0; i < length || (length < 0 && !readBreak()); ++i) {
          const key = decodeItem();
          if (
            isStrict &&
            Object.prototype.hasOwnProperty.call(retObject, key)
          ) {
            throw new Error("CBORError: Duplicate key encountered");
          }
          retObject[key] = reviverFunction(key, decodeItem());
        }
        return reviverFunction(EMPTY_KEY, retObject);
      }
      case 6: {
        const value = decodeItem();
        const tag = length;
        if (value instanceof Uint8Array) {
          // Handles round-trip of typed arrays as they are a built-in JS language feature.
          // Similar decision was made for built-in JS language primitives with SimpleValue.
          const buffer = value.buffer.slice(
            value.byteOffset,
            value.byteLength + value.byteOffset,
          );
          switch (tag) {
            case kCborTagUint8:
              return reviverFunction(EMPTY_KEY, new Uint8Array(buffer));
            case kCborTagInt8:
              return reviverFunction(EMPTY_KEY, new Int8Array(buffer));
            case kCborTagUint16:
              return reviverFunction(EMPTY_KEY, new Uint16Array(buffer));
            case kCborTagInt16:
              return reviverFunction(EMPTY_KEY, new Int16Array(buffer));
            case kCborTagUint32:
              return reviverFunction(EMPTY_KEY, new Uint32Array(buffer));
            case kCborTagInt32:
              return reviverFunction(EMPTY_KEY, new Int32Array(buffer));
            case kCborTagFloat32:
              return reviverFunction(EMPTY_KEY, new Float32Array(buffer));
            case kCborTagFloat64:
              return reviverFunction(EMPTY_KEY, new Float64Array(buffer));
          }
        }
        return reviverFunction(EMPTY_KEY, new TaggedValue(value, tag));
      }
      case 7:
        switch (length) {
          case 20:
            return reviverFunction(EMPTY_KEY, false);
          case 21:
            return reviverFunction(EMPTY_KEY, true);
          case 22:
            return reviverFunction(EMPTY_KEY, null);
          case 23:
            return reviverFunction(EMPTY_KEY, undefined);
          default:
            return reviverFunction(
              EMPTY_KEY,
              new SimpleValue(length as number),
            );
        }
    }
  }

  const ret = reviverFunction(EMPTY_KEY, decodeItem());
  if (offset !== data.byteLength) {
    if (mode !== "sequence") throw new Error("CBORError: Remaining bytes");

    const seq = new Sequence<any>([ret]);
    for (let i = offset; i < data.byteLength; i += offset) {
      seq.add(reviverFunction(EMPTY_KEY, decodeItem()));
    }

    return seq as any;
  }
  return mode === "sequence" ? new Sequence<any>([ret]) : ret;
}

/**
 * Alias of `decode`. Converts a Concise Binary Object Representation (CBOR) buffer into an object.
 * @param data - A valid CBOR buffer.
 * @param reviver - If a function, this prescribes how the value originally produced by parsing is transformed, before being returned.
 * @param cborOptions - An options bag to specify the dictionary type and mode for the decoder.
 * @returns The CBOR buffer converted to a JavaScript value.
 */
 export function parse(
  data: ArrayBuffer | SharedArrayBuffer,
  reviver: CBORReviver | null | undefined,
  cborOptions: CBORSequenceOptions,
): Sequence<any>;
export function parse(
  data: ArrayBuffer | SharedArrayBuffer,
  reviver?: CBORReviver | null,
  cborOptions?: CBOROptions,
): any;
export function parse(
  data: ArrayBuffer | SharedArrayBuffer,
  reviver: CBORReviver | null | undefined,
  cborOptions: CBOROptions | undefined,
): any {
  return decode(data, reviver, cborOptions);
}

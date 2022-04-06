// deno-lint-ignore-file no-explicit-any no-unused-vars
import {
  DECODE_CHUNK_SIZE,
  kCborTagFloat32,
  kCborTagFloat64,
  kCborTagInt16,
  kCborTagInt32,
  kCborTagInt8,
  kCborTagUint16,
  kCborTagUint32,
  kCborTagUint8,
  POW_2_24,
  POW_2_32,
} from "./constants.ts";
import { options } from "./helpers.ts";
import { SimpleValue } from "./SimpleValue.ts";
import { TaggedValue } from "./TaggedValue.ts";
import {
  CBOROptions,
  SimpleValueFunction,
  TaggedValueFunction,
} from "./types.ts";

/**
 * Converts a Concise Binary Object Representation (CBOR) buffer into an object.
 * @param data - A valid CBOR buffer.
 * @param tagger - A function that extracts tagged values. This function is called for each member of the object.
 * @param simpleValue - A function that extracts simple values. This function is called for each member of the object.
 * @returns The CBOR buffer converted to a JavaScript value.
 */
export function decode<T = any>(
  data: ArrayBuffer | SharedArrayBuffer,
  reviver?: any, // TODO: Define reviver functionality.
  cborOptions: CBOROptions = {},
): T {
  const { dictionary, mode, tagger, simpleValue } = options(cborOptions);
  const dataView = new DataView(data);
  const ta = new Uint8Array(data);
  let offset = 0;
  let tagValueFunction: TaggedValueFunction = function (
    value: any,
    tag: number,
  ): any {
    return new TaggedValue(value, tag);
  };
  let simpleValFunction: SimpleValueFunction = function (
    value: number,
  ): SimpleValue {
    return (undefined as unknown) as SimpleValue;
  };

  if (typeof tagger === "function") tagValueFunction = tagger;
  if (typeof simpleValue === "function") simpleValFunction = simpleValue;

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
  function readUint64(): number {
    return readUint32() * POW_2_32 + readUint32();
  }
  function readBreak(): boolean {
    if (ta[offset] !== 0xff) return false;
    offset += 1;
    return true;
  }
  function readLength(additionalInformation: number): number {
    if (additionalInformation < 24) return additionalInformation;
    if (additionalInformation === 24) return readUint8();
    if (additionalInformation === 25) return readUint16();
    if (additionalInformation === 26) return readUint32();
    if (additionalInformation === 27) return readUint64();
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
    return length;
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
        return length;
      case 1:
        return -1 - length;
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
          return fullArray;
        }
        return readArrayBuffer(length);
      }
      case 3: {
        const utf16data: number[] = [];
        if (length < 0) {
          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
            appendUtf16Data(utf16data, length);
          }
        } else {
          appendUtf16Data(utf16data, length);
        }
        let string = "";
        for (i = 0; i < utf16data.length; i += DECODE_CHUNK_SIZE) {
          string += String.fromCharCode.apply(
            null,
            utf16data.slice(i, i + DECODE_CHUNK_SIZE),
          );
        }
        return string;
      }
      case 4: {
        let retArray;
        if (length < 0) {
          retArray = [];
          while (!readBreak()) retArray.push(decodeItem());
        } else {
          retArray = new Array(length);
          for (i = 0; i < length; ++i) retArray[i] = decodeItem();
        }
        return retArray;
      }
      case 5: {
        if (dictionary === "map") {
          const retMap = new Map<any, any>();
          for (i = 0; i < length || (length < 0 && !readBreak()); ++i) {
            const key = decodeItem();
            if (mode === "strict" && retMap.has(key)) {
              throw new Error("CBORError: Duplicate key encountered");
            }
            retMap.set(key, decodeItem());
          }
          return retMap;
        }
        const retObject: any = {};
        for (i = 0; i < length || (length < 0 && !readBreak()); ++i) {
          const key = decodeItem();
          if (
            mode === "strict" &&
            Object.prototype.hasOwnProperty.call(retObject, key)
          ) {
            throw new Error("CBORError: Duplicate key encountered");
          }
          retObject[key] = decodeItem();
        }
        return retObject;
      }
      case 6: {
        const value = decodeItem();
        const tag = length;
        if (value instanceof Uint8Array) {
          // Handles round-trip of typed arrays as they are a built-in JS language feature.
          switch (tag) {
            case kCborTagUint8:
              return new Uint8Array(value);
            case kCborTagInt8:
              return new Int8Array(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteLength + value.byteOffset,
                ),
              );
            case kCborTagUint16:
              return new Uint16Array(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteLength + value.byteOffset,
                ),
              );
            case kCborTagInt16:
              return new Int16Array(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteLength + value.byteOffset,
                ),
              );
            case kCborTagUint32:
              return new Uint32Array(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteLength + value.byteOffset,
                ),
              );
            case kCborTagInt32:
              return new Int32Array(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteLength + value.byteOffset,
                ),
              );
            case kCborTagFloat32:
              return new Float32Array(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteLength + value.byteOffset,
                ),
              );
            case kCborTagFloat64:
              return new Float64Array(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteLength + value.byteOffset,
                ),
              );
          }
        }
        return tagValueFunction(decodeItem(), length);
      }
      case 7:
        switch (length) {
          case 20:
            return false;
          case 21:
            return true;
          case 22:
            return null;
          case 23:
            return undefined;
          default:
            return simpleValFunction(length);
        }
    }
  }

  const ret = decodeItem();
  if (offset !== data.byteLength) throw new Error("CBORError: Remaining bytes");
  return ret;
}

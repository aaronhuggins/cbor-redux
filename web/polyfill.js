(function() {
    const CBOR_OPTIONS = Object.freeze({
        dictionary: "object",
        mode: "strict"
    });
    const EMPTY_KEY = Symbol("EMPTY_KEY");
    const OMIT_VALUE = Symbol("OMIT_VALUE");
    const MAX_SAFE_INTEGER = 18446744073709551616n;
    const DECODE_CHUNK_SIZE = 8192;
    function objectIs(x, y) {
        if (typeof Object.is === "function") return Object.is(x, y);
        if (x === y) {
            return x !== 0 || 1 / x === 1 / y;
        }
        return x !== x && y !== y;
    }
    function options(options) {
        function isDictionary(value) {
            return typeof value === "string" && [
                "object",
                "map"
            ].includes(value);
        }
        function isMode(value) {
            return typeof value === "string" && [
                "loose",
                "strict",
                "sequence"
            ].includes(value);
        }
        const bag = {
            ...CBOR_OPTIONS
        };
        if (typeof options === "object") {
            bag.dictionary = isDictionary(options.dictionary) ? options.dictionary : CBOR_OPTIONS.dictionary;
            bag.mode = isMode(options.mode) ? options.mode : CBOR_OPTIONS.mode;
        }
        return Object.freeze(bag);
    }
    function lexicographicalCompare(left, right) {
        const minLength = Math.min(left.byteLength, right.byteLength);
        for(let i = 0; i < minLength; i++){
            const result = left[i] - right[i];
            if (result !== 0) return result;
        }
        return left.byteLength - right.byteLength;
    }
    class Sequence {
        static from(iterable) {
            return new Sequence(Array.from(iterable));
        }
        _data;
        constructor(data){
            if (data) this._data = data;
            else this._data = [];
        }
        add(item) {
            return this._data.push(item) - 1;
        }
        remove(index) {
            return this._data.splice(index, 1)[0];
        }
        get(index) {
            return this._data[index];
        }
        clone() {
            return new Sequence(this.data);
        }
        get data() {
            return Array.from(this._data);
        }
        get size() {
            return this._data.length;
        }
        [Symbol.toStringTag]() {
            return "Sequence";
        }
        #toInspectString(inspect) {
            return `${this[Symbol.toStringTag]()}(${this.size}) ${inspect(this._data)}`;
        }
        [Symbol.for("Deno.customInspect")](inspect) {
            return this.#toInspectString(inspect);
        }
        [Symbol.for("nodejs.util.inspect.custom")](_depth, _opts, inspect) {
            return this.#toInspectString(inspect);
        }
    }
    class SimpleValue {
        static create(value) {
            if (value === undefined) return new SimpleValue(23);
            if (value === null) return new SimpleValue(22);
            if (value === true) return new SimpleValue(21);
            if (value === false) return new SimpleValue(20);
            if (typeof value === "number" && value >= 0 && value <= 255) {
                return new SimpleValue(value);
            }
            throw new Error("CBORError: Value out of range or not a simple value.");
        }
        constructor(value){
            switch(true){
                case value === 20:
                    this.semantic = "false";
                    break;
                case value === 21:
                    this.semantic = "true";
                    break;
                case value === 22:
                    this.semantic = "null";
                    break;
                case value === 23:
                    this.semantic = "undefined";
                    break;
                case value > 23 && value < 32:
                    this.semantic = "reserved";
                    break;
                default:
                    this.semantic = "unassigned";
                    break;
            }
            this.value = value;
        }
        semantic;
        value;
        toPrimitive() {
            switch(this.semantic){
                case "false":
                    return false;
                case "true":
                    return true;
                case "null":
                    return null;
                case "undefined":
                default:
                    return undefined;
            }
        }
    }
    class TaggedValue {
        constructor(value, tag){
            this.value = value;
            this.tag = tag;
        }
        value;
        tag;
    }
    function decode(data, reviver, cborOptions = {}) {
        const { dictionary , mode  } = options(cborOptions);
        const isStrict = mode === "sequence" || mode === "strict";
        const dataView = new DataView(data);
        const ta = new Uint8Array(data);
        let offset = 0;
        let reviverFunction = function(_key, value) {
            return value;
        };
        if (typeof reviver === "function") reviverFunction = reviver;
        function commitRead(length, value) {
            offset += length;
            return value;
        }
        function readArrayBuffer(length) {
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
            else if (exponent !== 0) exponent += 127 - 15 << 10;
            else if (fraction !== 0) return (sign ? -1 : 1) * fraction * 5.960464477539063e-8;
            tempDataView.setUint32(0, sign << 16 | exponent << 13 | fraction << 13);
            return tempDataView.getFloat32(0);
        }
        function readFloat32() {
            return commitRead(4, dataView.getFloat32(offset));
        }
        function readFloat64() {
            return commitRead(8, dataView.getFloat64(offset));
        }
        function readUint8() {
            return commitRead(1, ta[offset]);
        }
        function readUint16() {
            return commitRead(2, dataView.getUint16(offset));
        }
        function readUint32() {
            return commitRead(4, dataView.getUint32(offset));
        }
        function readUint64() {
            return commitRead(8, dataView.getBigUint64(offset));
        }
        function readBreak() {
            if (ta[offset] !== 0xff) return false;
            offset += 1;
            return true;
        }
        function readLength(additionalInformation) {
            if (additionalInformation < 24) return additionalInformation;
            if (additionalInformation === 24) return readUint8();
            if (additionalInformation === 25) return readUint16();
            if (additionalInformation === 26) return readUint32();
            if (additionalInformation === 27) {
                const integer = readUint64();
                if (integer < 9007199254740992) return Number(integer);
                return integer;
            }
            if (additionalInformation === 31) return -1;
            throw new Error("CBORError: Invalid length encoding");
        }
        function readIndefiniteStringLength(majorType) {
            const initialByte = readUint8();
            if (initialByte === 0xff) return -1;
            const length = readLength(initialByte & 0x1f);
            if (length < 0 || initialByte >> 5 !== majorType) {
                throw new Error("CBORError: Invalid indefinite length element");
            }
            return Number(length);
        }
        function appendUtf16Data(utf16data, length) {
            for(let i = 0; i < length; ++i){
                let value = readUint8();
                if (value & 0x80) {
                    if (value < 0xe0) {
                        value = (value & 0x1f) << 6 | readUint8() & 0x3f;
                        length -= 1;
                    } else if (value < 0xf0) {
                        value = (value & 0x0f) << 12 | (readUint8() & 0x3f) << 6 | readUint8() & 0x3f;
                        length -= 2;
                    } else {
                        value = (value & 0x0f) << 18 | (readUint8() & 0x3f) << 12 | (readUint8() & 0x3f) << 6 | readUint8() & 0x3f;
                        length -= 3;
                    }
                }
                if (value < 0x10000) {
                    utf16data.push(value);
                } else {
                    value -= 0x10000;
                    utf16data.push(0xd800 | value >> 10);
                    utf16data.push(0xdc00 | value & 0x3ff);
                }
            }
        }
        function decodeItem() {
            const initialByte = readUint8();
            const majorType = initialByte >> 5;
            const additionalInformation = initialByte & 0x1f;
            let i;
            let length;
            if (majorType === 7) {
                switch(additionalInformation){
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
            switch(majorType){
                case 0:
                    return reviverFunction(EMPTY_KEY, length);
                case 1:
                    if (typeof length === "number") {
                        return reviverFunction(EMPTY_KEY, -1 - length);
                    }
                    return reviverFunction(EMPTY_KEY, -1n - length);
                case 2:
                    {
                        if (length < 0) {
                            const elements = [];
                            let fullArrayLength = 0;
                            while((length = readIndefiniteStringLength(majorType)) >= 0){
                                fullArrayLength += length;
                                elements.push(readArrayBuffer(length));
                            }
                            const fullArray = new Uint8Array(fullArrayLength);
                            let fullArrayOffset = 0;
                            for(i = 0; i < elements.length; ++i){
                                fullArray.set(elements[i], fullArrayOffset);
                                fullArrayOffset += elements[i].length;
                            }
                            return reviverFunction(EMPTY_KEY, fullArray);
                        }
                        return reviverFunction(EMPTY_KEY, readArrayBuffer(length));
                    }
                case 3:
                    {
                        const utf16data = [];
                        if (length < 0) {
                            while((length = readIndefiniteStringLength(majorType)) >= 0){
                                appendUtf16Data(utf16data, length);
                            }
                        } else {
                            appendUtf16Data(utf16data, length);
                        }
                        let string = "";
                        for(i = 0; i < utf16data.length; i += DECODE_CHUNK_SIZE){
                            string += String.fromCharCode.apply(null, utf16data.slice(i, i + DECODE_CHUNK_SIZE));
                        }
                        return reviverFunction(EMPTY_KEY, string);
                    }
                case 4:
                    {
                        let retArray;
                        if (length < 0) {
                            retArray = [];
                            let index = 0;
                            while(!readBreak()){
                                retArray.push(reviverFunction(index++, decodeItem()));
                            }
                        } else {
                            retArray = new Array(length);
                            for(i = 0; i < length; ++i){
                                retArray[i] = reviverFunction(i, decodeItem());
                            }
                        }
                        return reviverFunction(EMPTY_KEY, retArray);
                    }
                case 5:
                    {
                        if (dictionary === "map") {
                            const retMap = new Map();
                            for(i = 0; i < length || length < 0 && !readBreak(); ++i){
                                const key = decodeItem();
                                if (isStrict && retMap.has(key)) {
                                    throw new Error("CBORError: Duplicate key encountered");
                                }
                                retMap.set(key, reviverFunction(key, decodeItem()));
                            }
                            return reviverFunction(EMPTY_KEY, retMap);
                        }
                        const retObject = {};
                        for(i = 0; i < length || length < 0 && !readBreak(); ++i){
                            const key = decodeItem();
                            if (isStrict && Object.prototype.hasOwnProperty.call(retObject, key)) {
                                throw new Error("CBORError: Duplicate key encountered");
                            }
                            retObject[key] = reviverFunction(key, decodeItem());
                        }
                        return reviverFunction(EMPTY_KEY, retObject);
                    }
                case 6:
                    {
                        const value = decodeItem();
                        const tag = length;
                        if (value instanceof Uint8Array) {
                            const buffer = value.buffer.slice(value.byteOffset, value.byteLength + value.byteOffset);
                            switch(tag){
                                case 64:
                                    return reviverFunction(EMPTY_KEY, new Uint8Array(buffer));
                                case 72:
                                    return reviverFunction(EMPTY_KEY, new Int8Array(buffer));
                                case 69:
                                    return reviverFunction(EMPTY_KEY, new Uint16Array(buffer));
                                case 77:
                                    return reviverFunction(EMPTY_KEY, new Int16Array(buffer));
                                case 70:
                                    return reviverFunction(EMPTY_KEY, new Uint32Array(buffer));
                                case 78:
                                    return reviverFunction(EMPTY_KEY, new Int32Array(buffer));
                                case 85:
                                    return reviverFunction(EMPTY_KEY, new Float32Array(buffer));
                                case 86:
                                    return reviverFunction(EMPTY_KEY, new Float64Array(buffer));
                            }
                        }
                        return reviverFunction(EMPTY_KEY, new TaggedValue(value, tag));
                    }
                case 7:
                    switch(length){
                        case 20:
                            return reviverFunction(EMPTY_KEY, false);
                        case 21:
                            return reviverFunction(EMPTY_KEY, true);
                        case 22:
                            return reviverFunction(EMPTY_KEY, null);
                        case 23:
                            return reviverFunction(EMPTY_KEY, undefined);
                        default:
                            return reviverFunction(EMPTY_KEY, new SimpleValue(length));
                    }
            }
        }
        const ret = decodeItem();
        if (offset !== data.byteLength) {
            if (mode !== "sequence") throw new Error("CBORError: Remaining bytes");
            const seq = new Sequence([
                ret
            ]);
            while(offset < data.byteLength){
                seq.add(reviverFunction(EMPTY_KEY, decodeItem()));
            }
            return seq;
        }
        return mode === "sequence" ? new Sequence([
            ret
        ]) : ret;
    }
    function parse(data, reviver, cborOptions) {
        return decode(data, reviver, cborOptions);
    }
    function encode(value, replacer) {
        let data = new ArrayBuffer(256);
        let dataView = new DataView(data);
        let byteView = new Uint8Array(data);
        let lastLength;
        let offset = 0;
        let replacerFunction = (_key, value)=>value;
        if (typeof replacer === "function") replacerFunction = replacer;
        if (Array.isArray(replacer)) {
            const exclusive = replacer.slice();
            replacerFunction = (key, value)=>{
                if (key === EMPTY_KEY || exclusive.includes(key)) return value;
                return OMIT_VALUE;
            };
        }
        function prepareWrite(length) {
            let newByteLength = data.byteLength;
            const requiredLength = offset + length;
            while(newByteLength < requiredLength)newByteLength <<= 1;
            if (newByteLength !== data.byteLength) {
                const oldDataView = dataView;
                data = new ArrayBuffer(newByteLength);
                dataView = new DataView(data);
                byteView = new Uint8Array(data);
                const uint32count = offset + 3 >> 2;
                for(let i = 0; i < uint32count; ++i){
                    dataView.setUint32(i << 2, oldDataView.getUint32(i << 2));
                }
            }
            lastLength = length;
            return dataView;
        }
        function commitWrite(..._args) {
            offset += lastLength;
        }
        function writeFloat64(val) {
            commitWrite(prepareWrite(8).setFloat64(offset, val));
        }
        function writeUint8(val) {
            commitWrite(prepareWrite(1).setUint8(offset, val));
        }
        function writeUint8Array(val) {
            prepareWrite(val.length);
            byteView.set(val, offset);
            commitWrite();
        }
        function writeUint16(val) {
            commitWrite(prepareWrite(2).setUint16(offset, val));
        }
        function writeUint32(val) {
            commitWrite(prepareWrite(4).setUint32(offset, val));
        }
        function writeUint64(val) {
            const low = val % 4294967296;
            const high = (val - low) / 4294967296;
            const view = prepareWrite(8);
            view.setUint32(offset, high);
            view.setUint32(offset + 4, low);
            commitWrite();
        }
        function writeBigUint64(val) {
            commitWrite(prepareWrite(8).setBigUint64(offset, val));
        }
        function writeVarUint(val, mod) {
            if (val <= 0xff) {
                if (val < 24) {
                    writeUint8(Number(val) | mod);
                } else {
                    writeUint8(0x18 | mod);
                    writeUint8(Number(val));
                }
            } else if (val <= 0xffff) {
                writeUint8(0x19 | mod);
                writeUint16(Number(val));
            } else if (val <= 0xffffffff) {
                writeUint8(0x1a | mod);
                writeUint32(Number(val));
            } else {
                writeUint8(0x1b | mod);
                if (typeof val === "number") writeUint64(val);
                else writeBigUint64(val);
            }
        }
        function writeTypeAndLength(type, length) {
            if (length < 24) {
                writeUint8(type << 5 | length);
            } else if (length < 0x100) {
                writeUint8(type << 5 | 24);
                writeUint8(length);
            } else if (length < 0x10000) {
                writeUint8(type << 5 | 25);
                writeUint16(length);
            } else if (length < 0x100000000) {
                writeUint8(type << 5 | 26);
                writeUint32(length);
            } else {
                writeUint8(type << 5 | 27);
                writeUint64(length);
            }
        }
        function writeArray(val) {
            const startOffset = offset;
            const length = val.length;
            let total = 0;
            writeTypeAndLength(4, length);
            const typeLengthOffset = offset;
            for(let i = 0; i < length; i += 1){
                const result = replacerFunction(i, val[i]);
                if (result === OMIT_VALUE) continue;
                encodeItem(result);
                total += 1;
            }
            if (length > total) {
                const encoded = byteView.slice(typeLengthOffset, offset);
                offset = startOffset;
                writeTypeAndLength(4, total);
                writeUint8Array(encoded);
            }
        }
        function writeDictionary(val) {
            const encodedMap = [];
            const startOffset = offset;
            let typeLengthOffset = offset;
            let keyCount = 0;
            let keyTotal = 0;
            if (val instanceof Map) {
                keyCount = val.size;
                writeTypeAndLength(5, keyCount);
                typeLengthOffset = offset;
                for (const [key, value] of val.entries()){
                    const result = replacerFunction(key, value);
                    if (result === OMIT_VALUE) continue;
                    let cursor = offset;
                    encodeItem(key);
                    const keyBytes = byteView.slice(cursor, offset);
                    cursor = offset;
                    encodeItem(result);
                    const valueBytes = byteView.slice(cursor, offset);
                    keyTotal += 1;
                    encodedMap.push([
                        keyBytes,
                        valueBytes
                    ]);
                }
            } else {
                const keys = Object.keys(val);
                keyCount = keys.length;
                writeTypeAndLength(5, keyCount);
                typeLengthOffset = offset;
                for(let i = 0; i < keyCount; i += 1){
                    const key = keys[i];
                    const result = replacerFunction(key, val[key]);
                    if (result === OMIT_VALUE) continue;
                    let cursor = offset;
                    encodeItem(key);
                    const keyBytes = byteView.slice(cursor, offset);
                    cursor = offset;
                    encodeItem(result);
                    const valueBytes = byteView.slice(cursor, offset);
                    keyTotal += 1;
                    encodedMap.push([
                        keyBytes,
                        valueBytes
                    ]);
                }
            }
            function sortEncodedKeys(length) {
                offset = startOffset;
                writeTypeAndLength(5, keyTotal);
                encodedMap.sort(([keyA], [keyB])=>lexicographicalCompare(keyA, keyB));
                for(let i = 0; i < length; i += 1){
                    const [encodedKey, encodedValue] = encodedMap[i];
                    writeUint8Array(encodedKey);
                    writeUint8Array(encodedValue);
                }
            }
            if (keyCount > keyTotal) {
                const encodedMapLength = encodedMap.length;
                if (encodedMapLength > 1) {
                    sortEncodedKeys(encodedMapLength);
                } else {
                    const encoded = byteView.slice(typeLengthOffset, offset);
                    offset = startOffset;
                    writeTypeAndLength(5, keyTotal);
                    writeUint8Array(encoded);
                }
            } else {
                const encodedMapLength = encodedMap.length;
                if (encodedMapLength > 1) {
                    sortEncodedKeys(encodedMapLength);
                }
            }
        }
        function writeBigInteger(val) {
            let type = 0;
            if (0 <= val && val <= MAX_SAFE_INTEGER) {
                type = 0;
            } else if (-MAX_SAFE_INTEGER <= val && val < 0) {
                type = 1;
                val = -(val + 1n);
            } else {
                throw new Error("CBORError: Encountered unsafe integer outside of valid CBOR range.");
            }
            if (val < 0x100000000n) {
                return writeTypeAndLength(type, Number(val));
            } else {
                writeUint8(type << 5 | 27);
                writeBigUint64(val);
            }
        }
        function encodeItem(val) {
            if (val === OMIT_VALUE) return;
            if (val === false) return writeUint8(0xf4);
            if (val === true) return writeUint8(0xf5);
            if (val === null) return writeUint8(0xf6);
            if (val === undefined) return writeUint8(0xf7);
            if (objectIs(val, -0)) return writeUint8Array([
                0xf9,
                0x80,
                0x00
            ]);
            switch(typeof val){
                case "bigint":
                    return writeBigInteger(val);
                case "number":
                    if (Math.floor(val) === val) {
                        if (0 <= val && val <= 9007199254740992) return writeTypeAndLength(0, val);
                        if (-9007199254740992 <= val && val < 0) {
                            return writeTypeAndLength(1, -(val + 1));
                        }
                    }
                    writeUint8(0xfb);
                    return writeFloat64(val);
                case "string":
                    {
                        const utf8data = [];
                        const strLength = val.length;
                        for(let i = 0; i < strLength; ++i){
                            let charCode = val.charCodeAt(i);
                            if (charCode < 0x80) {
                                utf8data.push(charCode);
                            } else if (charCode < 0x800) {
                                utf8data.push(0xc0 | charCode >> 6);
                                utf8data.push(0x80 | charCode & 0x3f);
                            } else if (charCode < 0xd800 || charCode >= 0xe000) {
                                utf8data.push(0xe0 | charCode >> 12);
                                utf8data.push(0x80 | charCode >> 6 & 0x3f);
                                utf8data.push(0x80 | charCode & 0x3f);
                            } else {
                                charCode = (charCode & 0x3ff) << 10;
                                charCode |= val.charCodeAt(++i) & 0x3ff;
                                charCode += 0x10000;
                                utf8data.push(0xf0 | charCode >> 18);
                                utf8data.push(0x80 | charCode >> 12 & 0x3f);
                                utf8data.push(0x80 | charCode >> 6 & 0x3f);
                                utf8data.push(0x80 | charCode & 0x3f);
                            }
                        }
                        writeTypeAndLength(3, utf8data.length);
                        return writeUint8Array(utf8data);
                    }
                default:
                    {
                        let converted;
                        if (Array.isArray(val)) {
                            writeArray(val);
                        } else if (val instanceof Uint8Array) {
                            writeVarUint(64, 6 << 5);
                            writeTypeAndLength(2, val.length);
                            writeUint8Array(val);
                        } else if (val instanceof Int8Array) {
                            writeVarUint(72, 6 << 5);
                            writeTypeAndLength(2, val.byteLength);
                            writeUint8Array(new Uint8Array(val.buffer));
                        } else if (val instanceof Uint16Array) {
                            writeVarUint(69, 6 << 5);
                            writeTypeAndLength(2, val.byteLength);
                            writeUint8Array(new Uint8Array(val.buffer));
                        } else if (val instanceof Int16Array) {
                            writeVarUint(77, 6 << 5);
                            writeTypeAndLength(2, val.byteLength);
                            writeUint8Array(new Uint8Array(val.buffer));
                        } else if (val instanceof Uint32Array) {
                            writeVarUint(70, 6 << 5);
                            writeTypeAndLength(2, val.byteLength);
                            writeUint8Array(new Uint8Array(val.buffer));
                        } else if (val instanceof Int32Array) {
                            writeVarUint(78, 6 << 5);
                            writeTypeAndLength(2, val.byteLength);
                            writeUint8Array(new Uint8Array(val.buffer));
                        } else if (val instanceof Float32Array) {
                            writeVarUint(85, 6 << 5);
                            writeTypeAndLength(2, val.byteLength);
                            writeUint8Array(new Uint8Array(val.buffer));
                        } else if (val instanceof Float64Array) {
                            writeVarUint(86, 6 << 5);
                            writeTypeAndLength(2, val.byteLength);
                            writeUint8Array(new Uint8Array(val.buffer));
                        } else if (ArrayBuffer.isView(val)) {
                            converted = new Uint8Array(val.buffer);
                            writeTypeAndLength(2, converted.length);
                            writeUint8Array(converted);
                        } else if (val instanceof ArrayBuffer || typeof SharedArrayBuffer === "function" && val instanceof SharedArrayBuffer) {
                            converted = new Uint8Array(val);
                            writeTypeAndLength(2, converted.length);
                            writeUint8Array(converted);
                        } else if (val instanceof TaggedValue) {
                            writeVarUint(val.tag, 0b11000000);
                            encodeItem(val.value);
                        } else if (val instanceof SimpleValue) {
                            writeTypeAndLength(7, val.value);
                        } else if (val instanceof Sequence) {
                            if (offset !== 0) {
                                throw new Error("CBORError: A CBOR Sequence may not be nested.");
                            }
                            const length = val.size;
                            for(let i = 0; i < length; i += 1)encodeItem(val.get(i));
                        } else {
                            writeDictionary(val);
                        }
                    }
            }
        }
        encodeItem(replacerFunction(EMPTY_KEY, value));
        if ("slice" in data) return data.slice(0, offset);
        const ret = new ArrayBuffer(offset);
        const retView = new DataView(ret);
        for(let i = 0; i < offset; ++i)retView.setUint8(i, dataView.getUint8(i));
        return ret;
    }
    function binarify(value, replacer) {
        return encode(value, replacer);
    }
    const CBOR = {
        binarify,
        decode,
        encode,
        parse
    };
    const mod = {
        EMPTY_KEY: EMPTY_KEY,
        OMIT_VALUE: OMIT_VALUE,
        CBOR,
        decode,
        parse,
        Sequence,
        SimpleValue,
        TaggedValue,
        encode,
        binarify
    };
    if (typeof window === "object") {
        window.CBOR = mod;
    } else {
        globalThis.CBOR = mod;
    }
    return {};
})();

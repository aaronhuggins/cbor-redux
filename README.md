# cbor-redux

The Concise Binary Object Representation (CBOR) data format
([RFC 7049](http://tools.ietf.org/html/rfc7049)) implemented in pure JavaScript,
revived. Typed arrays such as Uint8Array, Int16Array or Float32Array are encoded
with tags according to
[RFC8746 CBOR tags for Typed Arrays](https://datatracker.ietf.org/doc/html/rfc8746).

Rewritten in TypeScript for the browser, Deno, and Node.

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/standard/eslint-config-standard-with-typescript)
[![codecov](https://codecov.io/gh/aaronhuggins/cbor-redux/branch/master/graph/badge.svg)](https://codecov.io/gh/aaronhuggins/cbor-redux)
![GitHub last commit](https://img.shields.io/github/last-commit/aaronhuggins/cbor-redux)
![GitHub contributors](https://img.shields.io/github/contributors/aaronhuggins/cbor-redux)
![npm collaborators](https://img.shields.io/npm/collaborators/cbor-redux)<br />
![GitHub top language](https://img.shields.io/github/languages/top/aaronhuggins/cbor-redux)
![npm bundle size](https://img.shields.io/bundlephobia/min/cbor-redux)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/aaronhuggins/cbor-redux)
![npm](https://img.shields.io/npm/dw/cbor-redux)
![NPM](https://img.shields.io/npm/l/cbor-redux)<br />
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=alert_status)](https://sonarcloud.io/dashboard?id=aaronhuggins_cbor-redux)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=aaronhuggins_cbor-redux)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=security_rating)](https://sonarcloud.io/dashboard?id=aaronhuggins_cbor-redux)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=ncloc)](https://sonarcloud.io/dashboard?id=aaronhuggins_cbor-redux)

## Supported Features

- Concise Binary Object Representation
  ([RFC 7049](https://www.rfc-editor.org/rfc/rfc7049), partial RFC 8949, see
  below)
- Typed Arrays ([RFC 8746](https://www.rfc-editor.org/rfc/rfc8746.html))
- Tags ([RFC 8949](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml))
- Simple Values
  ([RFC 8949](https://www.iana.org/assignments/cbor-simple-values/cbor-simple-values.xhtml))
- Rejection with `mode: 'strict'` of duplicate keys in key/value dictionaries
  ([RFC 8152](https://www.rfc-editor.org/rfc/rfc8152.html#section-14))

### Planned features from (RFC 8949)[https://www.rfc-editor.org/rfc/rfc8949.html#name-changes-from-rfc-7049]

These are not yet supported, but will come in a future release.

- Precise support for distinct integer vs floating-point values, using `bigint`
  and `number`
- Conform to
  ["preferred serialization"](https://www.rfc-editor.org/rfc/rfc8949.html#preferred)
- Implement "deterministic encoding" per
  [spec](https://www.rfc-editor.org/rfc/rfc8949.html#core-det)
- Improved error messaging per
  [Appendix F suggestions](https://www.rfc-editor.org/rfc/rfc8949.html#name-well-formedness-errors-and-)
- Expanding `mode: 'strict'` to reject and fail on all byte sequences which are
  not well-formed CBOR

## Usage

Require `cbor-redux` in [Node](https://www.npmjs.com/package/cbor-redux):

```javascript
const { CBOR } = require("cbor-redux");
```

or import in [Deno](https://deno.land/x/cbor_redux):

```javascript
import { CBOR } from "https://deno.land/x/cbor_redux@0.4.0/mod.ts";
```

or script on an [HTML page](https://www.skypack.dev/npm/cbor-redux):

```html
<script src="https://cdn.skypack.dev/cbor-redux@^0.4.0" type="text/javascript"></script>
```

> For ES5 polyfill, use es5/CBOR.js in the npm package or else
> `<script src="https://unpkg.com/cbor-redux@0.4.0/es5/CBOR.js"></script>`.

Then you can use it via the `CBOR`-object in your code:

```javascript
const initial = { Hello: "World" };
const encoded = CBOR.encode(initial);
const decoded = CBOR.decode(encoded);
```

After running this example `initial` and `decoded` represent the same value.

## API

The `CBOR`-object provides the following two functions:

- **CBOR**._**decode**_(_data: ArrayBuffer_)

  > Take the ArrayBuffer object _data_ and return it decoded as a JavaScript
  > object.

- **CBOR**._**encode**_(_data: any_)

  > Take the JavaScript object _data_ and return it encoded as a ArrayBuffer
  > object.

For complete API details, visit the
[documentation](https://aaronhuggins.github.io/cbor-redux/).

## Combination with WebSocket

The API was designed to play well with the `WebSocket` object in the browser:

```javascript
var websocket = new WebSocket(url);
websocket.binaryType = "arraybuffer";
...
websocket.onmessage = function(event) {
  var message = CBOR.decode(event.data);
};
...
websocket.send(CBOR.encode(message));
```

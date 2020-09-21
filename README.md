# cbor-redux

The Concise Binary Object Representation (CBOR) data format ([RFC 7049](http://tools.ietf.org/html/rfc7049)) implemented in pure JavaScript, revived.

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

## Usage

Require `cbor-redux` in [Node](https://www.npmjs.com/package/cbor-redux):

```javascript
const { CBOR } = require('cbor-redux')
```

or import in [Deno](https://deno.land/x/cbor_redux):

```javascript
import { CBOR } from 'https://deno.land/x/cbor_redux@0.4.0/mod.ts'
```

or script on an [HTML page](https://www.skypack.dev/npm/cbor-redux):

```html
<script src="https://cdn.skypack.dev/cbor-redux@^0.4.0" type="text/javascript"></script>
```

> For ES5 polyfill, use es5/CBOR.js in the npm package or else `<script src="https://unpkg.com/cbor-redux@0.4.0/es5/CBOR.js"></script>`.

Then you can use it via the `CBOR`-object in your code:

```javascript
const initial = { Hello: 'World' }
const encoded = CBOR.encode(initial)
const decoded = CBOR.decode(encoded)
```

After running this example `initial` and `decoded` represent the same value.

## API

The `CBOR`-object provides the following two functions:

- **CBOR**._**decode**_(_data: ArrayBuffer_)

  > Take the ArrayBuffer object _data_ and return it decoded as a JavaScript object.

- **CBOR**._**encode**_(_data: any_)

  > Take the JavaScript object _data_ and return it encoded as a ArrayBuffer object.

For complete API details, visit the [documentation](https://aaronhuggins.github.io/cbor-redux/).

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

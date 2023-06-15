# cbor-redux

The Concise Binary Object Representation (CBOR) data format
([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html)) implemented in pure
JavaScript with an API surface like the built-in JSON functions. Rewritten in
TypeScript for the browser, Deno, and Node.

![GitHub last commit](https://img.shields.io/github/last-commit/aaronhuggins/cbor-redux)
![GitHub contributors](https://img.shields.io/github/contributors/aaronhuggins/cbor-redux)
![npm collaborators](https://img.shields.io/npm/collaborators/cbor-redux)
![GitHub top language](https://img.shields.io/github/languages/top/aaronhuggins/cbor-redux)<br />
![npm bundle size](https://img.shields.io/bundlephobia/min/cbor-redux)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/aaronhuggins/cbor-redux)
![npm](https://img.shields.io/npm/dw/cbor-redux)
![NPM](https://img.shields.io/npm/l/cbor-redux)<br />
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=alert_status)](https://sonarcloud.io/dashboard?id=aaronhuggins_cbor-redux)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=aaronhuggins_cbor-redux)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=security_rating)](https://sonarcloud.io/dashboard?id=aaronhuggins_cbor-redux)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=aaronhuggins_cbor-redux&metric=coverage)](https://sonarcloud.io/summary/new_code?id=aaronhuggins_cbor-redux)

## Using CBOR

Like the JSON API, this library is synchronous. Simply import into your runtime:
Deno, browser, Node ESM, or Node CommonJS.

```typescript
// This is an example Deno import statement.
import { CBOR } from "https://deno.land/x/cbor_redux@1.0.0/mod.ts";

const initial = { Hello: "World", how: "are you?" };
const encoded = CBOR.encode(initial, ["Hello"]);
const decoded = CBOR.decode(encoded);
console.log(decoded); // Output: { Hello: "World" }
```

Unrecognized CBOR tags will be emitted as instances of `TaggedValue`, allowing
an application to use custom handling. Simple values in CBOR that are reserved
or unassigned will be emitted as instances of `SimpleValue` so that they may be
handled directly.

Browser imports are provided in the `web` directory; `web/mod.js` uses module
exports and `web/polyfill.js` is classic JS that attaches as a global variable
`CBOR`. Recommended installation is self-hosted, but versioned releases can be
script-tagged or imported from https://deno.land/x/cbor_redux for development.

For users who need more power and control, the entire library API is documented
at
[doc.deno.land](https://doc.deno.land/https://deno.land/x/cbor_redux@1.0.0/mod.ts).

## Supported Features

- Concise Binary Object Representation
  ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html))
- CBOR Sequences ([RFC 8742](https://www.rfc-editor.org/rfc/rfc8742.html))
- Proper support for large integers; integers larger than a JavaScript `number`
  may safely hold will be decoded as `bigint`. Values of `bigint` will be
  encoded when provided by the application.
- Typed Arrays ([RFC 8746](https://www.rfc-editor.org/rfc/rfc8746.html))
- Tags ([RFC 8949](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml))
- Simple Values
  ([RFC 8949](https://www.iana.org/assignments/cbor-simple-values/cbor-simple-values.xhtml))
- Rejection with `mode: 'strict'` of duplicate keys in key/value dictionaries
  ([RFC 8152](https://www.rfc-editor.org/rfc/rfc8152.html#section-14))
- [Preferred serialization](https://www.rfc-editor.org/rfc/rfc8949.html#preferred)
- "deterministic encoding" per
  [spec in RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html#core-det)

## Contributing code and issues

### Issues

Please report bugs! I maintain this library in my free time, so please do not
expect immediate turn-around for your bug.

Feel free to drop an issue abotu a missing feature of CBOR. Please reference the
appropriate RFC number and explain how you believe the library should behave.

No matter why you're opening an issue, please provide:

- The environment OS
- The JavaScript runtime, and version
- An example working piece of code that reproduces your issue.

### Code

This project accepts pull requests! If you have a fix for a bug or an
implementation of a CBOR feature, bring it. You'll be credited here in the
readme.

Ground rules:

1. Please adhere to the
   [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)
2. Use vanilla TypeScript; no explicit Node, Deno, or browser references
   permitted except for tests
3. Reference an open issue; if one does not exist, please create one

If you have a history of commits and would like maintianer status to help triage
issues and deploy code faster, please open an issue requesting access. Don't be
put off by the fact that this codebase targets Deno. It is compiled and released
for browser and Node; Deno is not a hard prerequisite for contributing (but it
does help).

## Contributors

- Patrick Gansterer ([paroga]()): Original author
- Aaron Huggins ([aaronhuggins]()): Fork maintainer
- Maik Riechert ([letmaik](https://github.com/letmaik)): Added support for Node
- Sangwhan Moon ([cynthia](https://github.com/cynthia)): Performance
  improvements
- Kevin Wooten ([kdubb](https://github.com/kdubb)): Added TaggedValue feature
- Glenn Engel ([glenne](https://github.com/glenne)): Support for Typed Arrays
- Matt Vollrath ([mvollrath](https://github.com/mvollrath)): Optimized byte
  array encoding
- Sami Vaarala ([svaarala](https://github.com/svaarala)): Fixed bug in codepoint
  handling
- Timothy Cyrus ([tcyrus](https://github.com/tcyrus)): Various quality
  improvements
- Benny Neugebauer ([bennycode](https://github.com/bennycode)): Various quality
  improvements
- Tyler Young: Various quality improvements

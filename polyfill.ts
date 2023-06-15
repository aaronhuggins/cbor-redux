// deno-lint-ignore-file no-explicit-any
import * as CBORImpl from "./mod.ts";

declare global {
  interface Window {
    CBOR: typeof CBORImpl;
  }

  let CBOR: typeof CBORImpl;
  // deno-lint-ignore no-var
  var window: Window & typeof globalThis;
}

export function polyfill() {
  // dnt-shim-ignore
  if (typeof window === "object") {
    // dnt-shim-ignore
    window.CBOR = CBORImpl;
  } else {
    // dnt-shim-ignore
    (globalThis as any).CBOR = CBORImpl;
  }
}

polyfill();

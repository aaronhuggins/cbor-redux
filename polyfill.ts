// deno-lint-ignore-file no-explicit-any
import type { CBOR as CBORImpl } from "./src/CBOR.ts";

declare global {
  interface Window {
    CBOR: typeof CBORImpl;
  }

  let CBOR: typeof CBORImpl;
  // deno-lint-ignore no-var
  var window: Window & typeof globalThis
}

/** Method for polyfilling CBOR instead of intentionally importing. */
export async function polyfill() {
  // dnt-shim-ignore
  if (typeof window === "object") {
    // dnt-shim-ignore
    window.CBOR = await import("./mod.ts");
  } else {
    // dnt-shim-ignore
    (globalThis as any).CBOR = await import("./mod.ts");
  }
}

polyfill();

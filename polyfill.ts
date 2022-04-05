import type { CBOR as CBORImpl } from "./src/CBOR.ts";

declare global {
  interface Window {
    CBOR: typeof CBORImpl;
  }

  let CBOR: typeof CBORImpl;
}

/** Method for polyfilling CBOR instead of intentionally importing. */
export async function polyfill() {
  if (typeof window === "object") {
    window.CBOR = await import("./src/CBOR.ts");
  } else {
    // @ts-expect-error: CBOR actually is declared on the global scope so we want this.
    globalThis.CBOR = await import("./src/CBOR.ts");
  }
}

await polyfill();

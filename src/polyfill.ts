/** Method for polyfilling CBOR instead of intentionally importing. */
export async function polyfill () {
  if (typeof window === 'object') {
    // @ts-expect-error
    window.CBOR = await import('./CBOR')
  } else {
    // @ts-expect-error
    globalThis.CBOR = await import('./CBOR')
  }
}

polyfill()

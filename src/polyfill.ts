/** Method for polyfilling CBOR instead of intentionally importing. */
export async function polyfill () {
  // @ts-expect-error
  window.CBOR = await import('./CBOR')
}

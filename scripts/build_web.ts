import { bundle, BundleOptions } from 'https://deno.land/x/emit@0.24.0/mod.ts'

async function bundleFile (file: `../${string}.ts`, options?: BundleOptions): Promise<void> {
  const input = new URL(import.meta.resolve(file))
  const output = new URL(import.meta.resolve(file.replace(/\.ts$/gui, '.js')))
  const result = await bundle(input, options)
  await Deno.writeTextFile(output, result.code)
}

await bundleFile('../mod.ts', { type: 'module' })
await bundleFile('../polyfill.ts', { type: 'classic' })

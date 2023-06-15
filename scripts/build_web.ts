import { bundle, BundleOptions } from 'https://deno.land/x/emit@0.24.0/mod.ts'
import { basename } from 'https://deno.land/std@0.191.0/path/mod.ts'

async function bundleFile (file: `../${string}.ts`, options?: BundleOptions & { outDir?: string }): Promise<void> {
  const fileJs = file.replace(/\.ts$/gui, '.js')
  const outDir = options?.outDir ? new URL(import.meta.resolve(options.outDir)) : undefined
  const input = new URL(import.meta.resolve(file))
  const output = outDir ? new URL(`${outDir.href}/${basename(fileJs)}`) : new URL(import.meta.resolve(fileJs))
  const result = await bundle(input, options)
  if (outDir) {
    await Deno.mkdir(outDir, { recursive: true })
  }
  await Deno.writeTextFile(output, result.code)
}

await bundleFile('../mod.ts', { type: 'module', outDir: '../web' })
await bundleFile('../polyfill.ts', { type: 'classic', outDir: '../web' })

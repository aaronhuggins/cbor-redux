import { bundle, BundleOptions } from "https://deno.land/x/emit@0.24.0/mod.ts";
import { createStreaming } from "https://deno.land/x/dprint@0.2.0/mod.ts";
import { basename } from "https://deno.land/std@0.191.0/path/mod.ts";

const formatter = await createStreaming(
  fetch("https://plugins.dprint.dev/typescript-0.85.0.wasm"),
);
formatter.setConfig({}, { deno: true });

async function bundleFile(
  file: `../${string}.ts`,
  options?: BundleOptions & { outDir?: string },
): Promise<void> {
  const fileJs = file.replace(/\.ts$/gui, ".js");
  const outDir = options?.outDir
    ? new URL(import.meta.resolve(options.outDir))
    : undefined;
  const input = new URL(import.meta.resolve(file));
  const output = outDir
    ? new URL(`${outDir.href}/${basename(fileJs)}`)
    : new URL(import.meta.resolve(fileJs));
  const oldCode = await Deno.readTextFile(output);
  const result = await bundle(input, options);
  const newCode = formatter.formatText(output.pathname, result.code);
  if (outDir) {
    await Deno.mkdir(outDir, { recursive: true });
  }
  if (oldCode !== newCode) {
    await Deno.writeTextFile(output, newCode);
    console.log(output.pathname);
  }
}

await bundleFile("../mod.ts", { type: "module", outDir: "../web" });
await bundleFile("../polyfill.ts", { type: "classic", outDir: "../web" });

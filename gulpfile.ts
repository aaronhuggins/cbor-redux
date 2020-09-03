import { series } from 'gulp'
import { rmdirSync } from 'fs'
import * as shell from 'gulp-shell'

export const docs = shell.task(['typedoc'])

export const codecov = shell.task(['codecov -t ae11a1a7-4cf0-4961-b157-258d7e9674b5'])

// Tests
export const deno_mocha = async function deno_mocha () {
  return await shell.task(['deno run --allow-read ./test/DenoMochaCBOR.ts'])()
}
export const mocha = shell.task(['mocha'])
export const nyc = async function nyc () {
  return await shell.task(['nyc mocha'])()
}
export const test = series(deno_mocha, nyc)

// Compiler
export const tsc = shell.task(['tsc --sourceMap false', 'tsc --sourceMap false --module es2020 --outDir esm '])
export const clean = async () => {
  rmdirSync('./dist', { recursive: true })
  rmdirSync('./esm', { recursive: true })
}

import { rmdirSync } from 'fs'
import * as shell from 'gulp-shell'

export const docs = shell.task(['typedoc'])

// Tests
export const mocha = shell.task(['mocha'])
export const nyc = shell.task(['nyc mocha'])

// Compiler
export const tsc = shell.task(['tsc --sourceMap false', 'tsc --sourceMap false --module es2020 --outDir esm '])
export const clean = async () => {
  rmdirSync('./dist', { recursive: true })
  rmdirSync('./esm', { recursive: true })
}

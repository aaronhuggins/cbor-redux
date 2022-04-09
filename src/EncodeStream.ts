// deno-lint-ignore-file no-unused-vars
import { EMPTY_KEY, OMIT_VALUE } from "./constants.ts";
import { CBORReplacer, CBORReplacerUnion } from "./types.ts";

export class EncodeStream extends TransformStream {
  static create (value: any, replacer?: CBORReplacerUnion): EncodeStream {

  }
  constructor(replacer?: CBORReplacerUnion) {
    super({
      start: () => {},
      transform: (chunk, controller) => {},
      flush: () => {},
    });

    if (typeof replacer === "function") this.#replacer = replacer;
    else if (Array.isArray(replacer)) {
      const exclusive = replacer.slice();
      this.#replacer = (key, value) => {
        if (key === EMPTY_KEY || exclusive.includes(key)) return value;
        return OMIT_VALUE;
      };
    } else this.#replacer = (key, value) => value;
  }

  #replacer: CBORReplacer;
}

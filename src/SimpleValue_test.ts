import "https://raw.githubusercontent.com/aaronhuggins/deno_mocha/e6c179156821c626354a8c792518958625078a82/global_mocha.ts";
import {
  strictEqual,
  throws,
} from "https://deno.land/std@0.133.0/node/assert.ts";
import { SimpleValue } from "./SimpleValue.ts";

describe("SimpleValue", () => {
  let undef: SimpleValue;
  let boolTrue: SimpleValue;
  let boolFalse: SimpleValue;
  let nullValue: SimpleValue;
  let reserved: SimpleValue;
  let unassigned: SimpleValue;

  it("Creates an instance from primitive values", () => {
    undef = SimpleValue.create(undefined);
    boolTrue = SimpleValue.create(true);
    boolFalse = SimpleValue.create(false);
    nullValue = SimpleValue.create(null);
    reserved = SimpleValue.create(29);
    unassigned = SimpleValue.create(200);

    strictEqual(undef.semantic, "undefined");
    strictEqual(boolTrue.semantic, "true");
    strictEqual(boolFalse.semantic, "false");
    strictEqual(nullValue.semantic, "null");
    strictEqual(reserved.semantic, "reserved");
    strictEqual(unassigned.semantic, "unassigned");

    throws(() => {
      // Values greater than 255 should throw an out-of-range error.
      SimpleValue.create(1000);
    });
  });

  it("Should convert an instance to a primitive", () => {
    strictEqual(undef.toPrimitive(), undefined);
    strictEqual(boolTrue.toPrimitive(), true);
    strictEqual(boolFalse.toPrimitive(), false);
    strictEqual(nullValue.toPrimitive(), null);
    strictEqual(reserved.toPrimitive(), undefined);
    strictEqual(unassigned.toPrimitive(), undefined);
  });
});

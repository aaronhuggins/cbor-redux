import {
  parse,
  ParseOptions,
} from "https://deno.land/std@0.133.0/flags/mod.ts";
import { inc as increment } from "https://deno.land/x/semver@v1.4.0/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt@0.22.0/mod.ts";

await emptyDir("./npm");

function versionHandler(): string {
  switch (true) {
    case args.major:
      return increment(version, "major") ?? version;
    case args.minor:
      return increment(version, "minor") ?? version;
    case args.patch:
      return increment(version, "patch") ?? version;
    case args.premajor:
      return increment(version, "premajor") ?? version;
    case args.preminor:
      return increment(version, "preminor") ?? version;
    case args.prepatch:
      return increment(version, "prepatch") ?? version;
    case args.prerelease:
      return increment(version, "prerelease") ?? version;
  }

  return version;
}

const versionFile = "./.version";
const version = await Deno.readTextFile(versionFile);
const argsOpts: ParseOptions = {
  boolean: true,
  default: {
    major: false,
    minor: false,
    patch: false,
    premajor: false,
    preminor: false,
    prepatch: false,
    prerelease: false,
  },
};
const args = parse(Deno.args, argsOpts);
const newVersion = versionHandler();

await build({
  entryPoints: ["./mod.ts", "./polyfill.ts"],
  outDir: "./npm",
  shims: {
    deno: {
      test: "dev",
    },
  },
  package: {
    name: "cbor-redux",
    version: newVersion,
    description:
      "The Concise Binary Object Representation (CBOR) data format (RFC7049) implemented in pure JavaScript, revived.",
    keywords: ["cbor"],
    homepage: "https://github.com/aaronhuggins/cbor-redux#readme",
    bugs: "https://github.com/aaronhuggins/cbor-redux/issues",
    license: "MIT",
    contributors: [
      "Patrick Gansterer <paroga@paroga.com> (http://paroga.com/)",
      "Aaron Huggins <ahuggins@aaronhuggins.com> (https://aaronhuggins.com/)",
      "Glenn Engel <glenne@engel.org>",
    ],
    repository: {
      type: "git",
      url: "https://github.com/aaronhuggins/cbor-redux.git",
    },
  },
});

// post build steps
await Deno.copyFile("LICENSE.md", "npm/LICENSE.md");
await Deno.copyFile("README.md", "npm/README.md");

if (newVersion === version) {
  console.log(
    `[build_npm] Version did not change; nothing to deploy. cbor-redux v${version}`,
  );
} else {
  await Deno.writeTextFile(versionFile, newVersion);
  console.log(`[build_npm] cbor-redux v${newVersion} ready to deploy!`);
}

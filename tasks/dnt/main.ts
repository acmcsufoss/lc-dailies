// Run:
// deno run -A tasks/dnt/main.ts $VERSION

import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./lib/api/types.ts"],
  outDir: "./npm",
  importMap: "./deno.jsonc",
  test: false,
  // see JS docs for overview and more options
  shims: { deno: true },
  package: {
    // package.json properties
    name: "lc-dailies",
    version: Deno.args[0],
    description: "LC-Dailies utility module.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/acmcsufoss/lc-dailies.git",
    },
    bugs: {
      url: "https://github.com/acmcsufoss/lc-dailies/issues",
    },
  },
  postBuild() {
    // post build steps
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});

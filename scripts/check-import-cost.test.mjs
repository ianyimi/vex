import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeMetafile } from "./check-import-cost.mjs";

const CLEAN_METAFILE = {
  inputs: {
    entry: { bytes: 10, imports: [{ path: "a" }] },
    a: { bytes: 20, imports: [] },
  },
  outputs: {
    "out.js": {
      bytes: 30,
      entryPoint: "entry",
      inputs: {
        entry: { bytesInOutput: 10 },
        a: { bytesInOutput: 20 },
      },
    },
  },
};

test("sums output bytes across every output", () => {
  const { bytes } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: null, denyList: [] });
  assert.equal(bytes, 30);
});

test("a clean metafile under budget with no deny-listed input produces no violations", () => {
  const { violations } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: 100, denyList: [/forbidden/] });
  assert.deepEqual(violations, []);
});

test("a deny-listed input produces a violation naming the import chain", () => {
  const metafile = {
    inputs: {
      entry: { bytes: 10, imports: [{ path: "a" }] },
      a: { bytes: 10, imports: [{ path: "b" }] },
      b: { bytes: 10, imports: [] },
    },
    outputs: {
      "out.js": {
        bytes: 30,
        entryPoint: "entry",
        inputs: {
          entry: { bytesInOutput: 10 },
          a: { bytesInOutput: 10 },
          b: { bytesInOutput: 10 },
        },
      },
    },
  };
  const { violations } = analyzeMetafile({ metafile, budgetBytes: null, denyList: [/^b$/] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /entry → a → b/);
});

test("a budget overrun produces a violation naming both byte counts", () => {
  const { violations } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: 10, denyList: [] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /30 bytes/);
  assert.match(violations[0], /10 byte budget/);
});

test("budgetBytes: null skips the byte-budget check entirely", () => {
  const { violations } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: null, denyList: [] });
  assert.deepEqual(violations, []);
});

test("a deny-listed input unreachable from any entry point still reports a violation", () => {
  const metafile = {
    inputs: {
      entry: { bytes: 10, imports: [] },
      orphan: { bytes: 10, imports: [] },
    },
    outputs: {
      "out.js": {
        bytes: 10,
        entryPoint: "entry",
        inputs: {
          entry: { bytesInOutput: 10 },
          orphan: { bytesInOutput: 10 },
        },
      },
    },
  };
  const { violations } = analyzeMetafile({ metafile, budgetBytes: null, denyList: [/^orphan$/] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /orphan matches the admin deny list/);
});

// A module esbuild PARSES (so it appears in the top-level `metafile.inputs`,
// because something somewhere has a static `import` statement reaching it)
// but whose exports are entirely unused, so its code never lands in the
// bundle (`bytesInOutput: 0` in every output — the real shape esbuild
// produces for a barrel module like lucide-react's `lucide-react.js`, which
// unconditionally does `import * as index from "./icons/index.js"` at its
// top even when nothing imports the `icons` binding it feeds). This must
// NOT be treated as a violation: `bytesInOutput` is the only signal for
// "did this module's code actually ship", and `metafile.inputs` alone
// can't distinguish a parsed-but-tree-shaken module from one that is
// genuinely bundled.
test("a deny-listed input esbuild parsed but tree-shook to zero bytes produces no violation", () => {
  const metafile = {
    inputs: {
      entry: { bytes: 10, imports: [{ path: "untouched" }] },
      untouched: { bytes: 500, imports: [] },
    },
    outputs: {
      "out.js": {
        bytes: 10,
        entryPoint: "entry",
        inputs: {
          entry: { bytesInOutput: 10 },
          untouched: { bytesInOutput: 0 },
        },
      },
    },
  };
  const { violations } = analyzeMetafile({ metafile, budgetBytes: null, denyList: [/^untouched$/] });
  assert.deepEqual(violations, []);
});

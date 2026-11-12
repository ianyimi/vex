import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildReleasePrCreateArgs, parseReleasePrArgs } from "./open-release-pr.mjs";

describe("parseReleasePrArgs", () => {
  it("reads the title, body file and draft flag", () => {
    assert.deepEqual(
      parseReleasePrArgs({ argv: ["--title", "feat: ship it", "--body-file", "notes.md", "--draft"] }),
      { draft: true, title: "feat: ship it", bodyFile: "notes.md" },
    );
  });

  it("requires a title", () => {
    assert.equal(parseReleasePrArgs({ argv: [] }).error, "--title is required");
  });

  it("rejects a flag missing its value", () => {
    assert.equal(parseReleasePrArgs({ argv: ["--title", "--draft"] }).error, "--title needs a value");
  });

  it("rejects unknown arguments", () => {
    assert.equal(parseReleasePrArgs({ argv: ["--title", "x", "--base"] }).error, 'unknown argument "--base"');
  });
});

describe("buildReleasePrCreateArgs", () => {
  it("always passes an explicit body so the contributor template is not applied", () => {
    const args = buildReleasePrCreateArgs({ title: "feat: ship it", body: "", draft: false });
    assert.deepEqual(args, [
      "pr",
      "create",
      "--base",
      "master",
      "--head",
      "dev",
      "--title",
      "feat: ship it",
      "--body",
      "",
    ]);
  });

  it("adds --draft when asked", () => {
    const args = buildReleasePrCreateArgs({ title: "t", body: "b", draft: true });
    assert.equal(args.at(-1), "--draft");
  });
});

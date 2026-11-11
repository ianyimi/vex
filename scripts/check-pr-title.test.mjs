import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { checkPrTitle } from "./check-pr-title.mjs";

const scriptPath = fileURLToPath(new URL("./check-pr-title.mjs", import.meta.url));

test("accepts the repo's real title shapes: scoped, multi-scope, breaking, unscoped, Dependabot", () => {
  for (const title of [
    "fix(react): show a toast when a media upload fails",
    "feat(core,react,next,better-auth,create-vexcms,www,test): disableCreate, draft mode preview, static admin icons",
    "fix(deps)!: upgrade auth stack and pre-launch deps, add Dependabot",
    "chore: version packages (alpha)",
    "ci(deps): bump the github-actions group with 2 updates",
  ]) {
    assert.deepEqual(checkPrTitle({ title }), { valid: true }, title);
  }
});

test("rejects a missing or unknown type, a bad scope, an empty description, and a trailing period", () => {
  for (const title of [
    "Show a toast when media upload fails",
    "Fix: crash on upload",
    "feature(core): add an email field",
    "fix(React): crash on upload",
    "fix(core, react): crash on upload",
    "fix: ",
    "fix(core): crash on upload.",
  ]) {
    assert.equal(checkPrTitle({ title }).valid, false, title);
  }
});

test("CLI exits 0 for a valid title, 1 with an ::error annotation for an invalid one, 2 for none", () => {
  const { PR_TITLE: _unset, ...baseEnv } = process.env;
  const run = (env) =>
    spawnSync(process.execPath, [scriptPath], { encoding: "utf-8", env: { ...baseEnv, ...env } });

  assert.equal(run({ PR_TITLE: "docs: fix a broken link" }).status, 0);

  const invalid = run({ PR_TITLE: "Show a toast when media upload fails" });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stdout, /^::error title=Pull request title::"Show a toast when media upload fails" is not/);

  assert.equal(run({}).status, 2);
});

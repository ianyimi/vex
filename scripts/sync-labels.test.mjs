import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./sync-labels.mjs", import.meta.url));

/**
 * Runs `sync-labels.mjs --check` with a fixed `PATH`, returning the result.
 *
 * @param {string} pathEnv - `PATH` value given to the child process.
 * @param {Record<string, string>} [extraEnv] - additional env vars to set.
 * @returns {import("node:child_process").SpawnSyncReturns<string>}
 */
function run(pathEnv, extraEnv = {}) {
  return spawnSync(process.execPath, [scriptPath, "--check"], {
    encoding: "utf-8",
    env: { ...process.env, ...extraEnv, PATH: pathEnv },
  });
}

test("exits 2 with an install hint when gh is missing from PATH", () => {
  const result = run("/usr/bin:/bin");
  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /sync-labels: gh is not installed — https:\/\/cli\.github\.com/,
  );
});

test("exits 2 with an auth hint when a gh call fails", () => {
  const fakeGhDir = mkdtempSync(join(tmpdir(), "fake-gh-"));
  const fakeGhPath = join(fakeGhDir, "gh");
  writeFileSync(
    fakeGhPath,
    "#!/bin/sh\necho 'HTTP 401: Bad credentials' >&2\nexit 1\n",
  );
  chmodSync(fakeGhPath, 0o755);
  try {
    const result = run(`${fakeGhDir}:/usr/bin:/bin`, {
      GITHUB_REPOSITORY: "",
    });
    assert.equal(result.status, 2);
    assert.match(
      result.stderr,
      /sync-labels: gh failed \(gh repo view\): run `gh auth login` and check access to this repo/,
    );
  } finally {
    rmSync(fakeGhDir, { recursive: true, force: true });
  }
});

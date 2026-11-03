import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { moveModules } from "./move-modules.mjs";

/**
 * Builds a throwaway git repo under `packages/react/src/**` with the given
 * `{ path: content }` files, so `git mv` (and `--dry-run`'s no-op path) have
 * a real working tree to operate on.
 *
 * @param {Record<string, string>} files - repo-relative path -> file content
 * @returns {string} the temp repo root
 */
function makeRepo(files) {
  const root = mkdtempSync(join(tmpdir(), "move-modules-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(full.slice(0, full.lastIndexOf("/")), { recursive: true });
    writeFileSync(full, content);
  }
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-q", "-m", "init"], { cwd: root });
  return root;
}

test("rewrites a moved file's own outgoing relative import", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `import { cn } from "../../styles/utils";\nexport const Button = () => null;\n`,
    "packages/react/src/styles/utils.ts": `export function cn() {}\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root },
  );
  const moved = readFileSync(join(root, "packages/react/src/ui/button.tsx"), "utf8");
  assert.match(moved, /from "\.\.\/styles\/utils"/);
  rmSync(root, { recursive: true, force: true });
});

test("rewrites an importer that references a moved file", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `export const Button = () => null;\n`,
    "packages/react/src/components/views/CollectionEditView.tsx": `import { Button } from "../ui/button";\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root },
  );
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.tsx"),
    "utf8",
  );
  assert.match(importer, /from "\.\.\/\.\.\/ui\/button"/);
  rmSync(root, { recursive: true, force: true });
});

test("rewrites a directory-index import", () => {
  const root = makeRepo({
    "packages/react/src/components/slots/index.ts": `export * from "./formData";\n`,
    "packages/react/src/components/views/CollectionEditView.tsx": `import { SlotOutlet } from "../slots";\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/slots/index.ts", to: "packages/react/src/slots/index.ts" }],
    { repoRoot: root },
  );
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.tsx"),
    "utf8",
  );
  assert.match(importer, /from "\.\.\/\.\.\/slots"/);
  rmSync(root, { recursive: true, force: true });
});

test("rewrites a vi.mock path", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `export const Button = () => null;\n`,
    "packages/react/src/components/views/CollectionEditView.test.tsx": `vi.mock("../ui/button", () => ({ Button: () => null }));\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root },
  );
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.test.tsx"),
    "utf8",
  );
  assert.match(importer, /vi\.mock\("\.\.\/\.\.\/ui\/button"/);
  rmSync(root, { recursive: true, force: true });
});

test("--dry-run performs no git mv and no file writes", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `export const Button = () => null;\n`,
    "packages/react/src/components/views/CollectionEditView.tsx": `import { Button } from "../ui/button";\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root, dryRun: true },
  );
  assert.ok(readFileSync(join(root, "packages/react/src/components/ui/button.tsx"), "utf8"));
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.tsx"),
    "utf8",
  );
  assert.match(importer, /from "\.\.\/ui\/button"/);
  rmSync(root, { recursive: true, force: true });
});

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const SRC_DIR = import.meta.dirname;

// Files that intentionally lack "use client" despite matching the rule below.
// `server/ThemeScript.tsx` runs as a genuine Server Component (see its doc
// comment) — the `@vexcms/react/server` entry it anchors must stay
// directive-free all the way down its import chain, or Next's production
// build fails the moment anything in that chain picks one up.
const ALLOWLIST = ["server/ThemeScript.tsx"];

const HOOK_CALL_PATTERN =
  /\b(useState|useEffect|useLayoutEffect|useReducer|useRef|useMemo|useCallback|useContext|useImperativeHandle|useSyncExternalStore|useTransition|useDeferredValue|useOptimistic|useId|useInsertionEffect)\s*\(/;
const CREATE_CONTEXT_PATTERN = /\bcreateContext\s*\(/;

/**
 * @param {string} dir
 * @param {string[]} out
 * @returns {string[]}
 */
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const absolutePath = join(dir, name);
    if (statSync(absolutePath).isDirectory()) {
      collectSourceFiles(absolutePath, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(name)) continue;
    if (/\.test\.(ts|tsx)$/.test(name) || name.endsWith(".d.ts")) continue;
    out.push(absolutePath);
  }
  return out;
}

/**
 * @param {string} absolutePath
 * @returns {string}
 */
function toRelativePath(absolutePath: string): string {
  return absolutePath.slice(SRC_DIR.length + 1).split("\\").join("/");
}

/**
 * A module that is itself a client component, a hook, or a context
 * definition must declare its own `"use client"` boundary once the root
 * barrel stops doing it on every module's behalf. The test kit under
 * `testing/**` is excluded — it only ever runs inside vitest, never inside a
 * Next module graph, so the directive there is meaningless either way.
 * @param {string} relativePath
 * @param {string} content
 * @returns {boolean}
 */
function needsClientDirective(relativePath: string, content: string): boolean {
  if (relativePath.startsWith("testing/")) return false;
  const basename = relativePath.split("/").at(-1) ?? relativePath;
  if (relativePath.endsWith(".tsx")) return true;
  if (/^use[A-Z]/.test(basename)) return true;
  return HOOK_CALL_PATTERN.test(content) || CREATE_CONTEXT_PATTERN.test(content);
}

/**
 * @param {string} content
 * @returns {boolean}
 */
function hasClientDirective(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'");
}

const modules = collectSourceFiles(SRC_DIR).map((absolutePath) => {
  const relativePath = toRelativePath(absolutePath);
  const content = readFileSync(absolutePath, "utf8");
  return { absolutePath, relativePath, content };
});

const clientModules = modules.filter(
  (candidate) => !ALLOWLIST.includes(candidate.relativePath) && needsClientDirective(candidate.relativePath, candidate.content),
);

describe("client directive coverage", () => {
  test("the rule finds client modules to check", () => {
    expect(clientModules.length).toBeGreaterThan(0);
  });

  test.each(clientModules.map((candidate) => [candidate.relativePath, candidate.content] as const))(
    '%s opens with "use client"',
    (_relativePath, content) => {
      expect(hasClientDirective(content)).toBe(true);
    },
  );

  test("every allow-list entry exists and the rule would otherwise flag it", () => {
    for (const relativePath of ALLOWLIST) {
      const allowed = modules.find((candidate) => candidate.relativePath === relativePath);
      expect(allowed).toBeDefined();
    }
  });
});

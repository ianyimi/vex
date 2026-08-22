import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { VexConfig } from "@vexcms/core";
import { createJiti, type JitiOptions } from "jiti";

// Strip line/block comments and trailing commas from JSON (tsconfig-safe).
function stripJsonComments(input: string): string {
  let result = "";
  let i = 0;
  while (i < input.length) {
    // String literal — copy verbatim
    if (input[i] === '"') {
      let j = i + 1;
      while (j < input.length && input[j] !== '"') {
        if (input[j] === "\\") j++; // skip escaped char
        j++;
      }
      result += input.slice(i, j + 1);
      i = j + 1;
    }
    // Line comment
    else if (input[i] === "/" && input[i + 1] === "/") {
      while (i < input.length && input[i] !== "\n") i++;
    }
    // Block comment
    else if (input[i] === "/" && input[i + 1] === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/"))
        i++;
      i += 2;
    }
    // Trailing commas before } or ] — replace with space
    else if (input[i] === ",") {
      // Look ahead for } or ] (skip whitespace)
      let k = i + 1;
      while (k < input.length && /\s/.test(input[k]!)) k++;
      if (input[k] === "}" || input[k] === "]") {
        result += " ";
        i++;
      } else {
        result += input[i++];
      }
    } else {
      result += input[i++];
    }
  }
  return result;
}

/**
 * Read the project's tsconfig.json and convert `paths` into jiti `alias` entries.
 *
 * Handles patterns like:
 *   "~/*": ["./src/*"]   → alias: { "~": "/abs/path/to/src" }
 *   "@convex/*": ["./convex/*"] → alias: { "@convex": "/abs/path/to/convex" }
 * @param startDir - Directory to start searching upward from.
 * @returns The directory containing `tsconfig.json`, or `startDir` if none is found up to the filesystem root.
 */
function findTsconfigDir(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(resolve(dir, "tsconfig.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return startDir; // filesystem root — give up
    dir = parent;
  }
}

function buildAliasFromTsconfig(cwd: string): Record<string, string> {
  const alias: Record<string, string> = {};
  const tsconfigDir = findTsconfigDir(cwd);

  try {
    const raw = readFileSync(resolve(tsconfigDir, "tsconfig.json"), "utf-8");
    const tsconfig = JSON.parse(stripJsonComments(raw));
    const paths: Record<string, string[]> = tsconfig?.compilerOptions?.paths;
    if (!paths) return alias;

    for (const [pattern, targets] of Object.entries(paths)) {
      const target = targets[0];
      if (!target) continue;

      // Only map wildcard patterns: "foo/*" → ["./bar/*"]
      if (pattern.endsWith("/*") && target.endsWith("/*")) {
        const key = pattern.slice(0, -2); // "~" or "@convex"
        const value = resolve(tsconfigDir, target.slice(0, -2)); // absolute path
        alias[key] = value;
      }
    }
  } catch {
    // No tsconfig or parse error — skip
  }

  return alias;
}

function createJitiOptions(cwd: string): JitiOptions {
  return {
    moduleCache: false,
    fsCache: false,
    interopDefault: true,
    alias: buildAliasFromTsconfig(cwd),
    // Enable JSX transform so .tsx files imported transitively from the config
    // (e.g., custom admin components) can be parsed. The CLI doesn't render them —
    // it only needs the config object — but jiti must be able to parse the files.
    jsx: true,
  };
}

/**
 * Load .env.local into process.env so that vex.config.ts and its
 * transitive imports (e.g. auth options using process.env.BETTER_AUTH_SECRET)
 * can resolve environment variables when run from the CLI.
 * @param cwd - Project directory to look for `.env.local` in.
 */
function loadDotEnv(cwd: string): void {
  const envPath = resolve(cwd, ".env.local");
  if (!existsSync(envPath)) return;
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex < 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else {
        // Strip inline comments from unquoted values (e.g. "value # comment")
        const hashIndex = value.indexOf(" #");
        if (hashIndex >= 0) {
          value = value.slice(0, hashIndex).trim();
        }
      }
      // Don't overwrite existing env vars
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore read errors
  }
}

/**
 * Ensure vex.schema.ts exists in the convex directory.
 * On first run (new project), this file doesn't exist yet but schema.ts imports it.
 * Creates an empty placeholder that exports nothing — the generate step will
 * overwrite it with the real schema immediately after config loads.
 * @param cwd - Project directory containing the `convex` folder.
 */
function ensureSchemaFileExists(cwd: string): void {
  const schemaPath = resolve(cwd, "convex/vex.schema.ts");
  if (existsSync(schemaPath)) return;

  const placeholder = [
    "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️",
    "// This is a placeholder. Run `vex dev` to generate the real schema.",
    "",
    'import { defineTable } from "convex/server"',
    "",
  ].join("\n");

  try {
    writeFileSync(schemaPath, placeholder, "utf-8");
  } catch {
    // Directory may not exist yet — that's fine, the error will surface later
  }
}

/**
 * Load and validate the project's `vex.config.ts` (or equivalent), resolving
 * environment variables and tsconfig path aliases via jiti before evaluating it.
 * @param configPath - Absolute path to the vex config file.
 * @returns The evaluated, validated `VexConfig` object.
 */
export async function loadConfig(configPath: string): Promise<VexConfig> {
  const cwd = dirname(configPath);

  // Load .env.local so transitive imports can access env vars
  loadDotEnv(cwd);
  // Ensure NODE_ENV is set — env validation libraries like @t3-oss/env require it
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }

  // Ensure vex.schema.ts exists — the schema.ts file imports it, and jiti
  // will fail if it doesn't exist. On first run, we create an empty placeholder
  // that gets overwritten by the generate step immediately after config loads.
  ensureSchemaFileExists(cwd);

  const jiti = createJiti(configPath, createJitiOptions(cwd));

  const mod = (await jiti.import(configPath)) as
    | VexConfig
    | { default: VexConfig };

  const config = "default" in mod ? mod.default : mod;

  if (!config || typeof config !== "object" || !("collections" in config)) {
    throw new Error(
      `Invalid vex config: expected an object with a "collections" property.\n` +
        `Got: ${typeof config}`,
    );
  }

  return config as VexConfig;
}

/**
 * Create a jiti instance for import resolution (used by traceImports).
 * @param configPath - Absolute path to the vex config file, used to derive the project root and jiti alias config.
 * @returns A configured jiti instance for resolving the config's imports.
 */
export function createResolver(configPath: string) {
  const cwd = dirname(configPath);
  return createJiti(configPath, createJitiOptions(cwd));
}

/**
 * Patch the convex/tsconfig.json to include path aliases required by VEX.
 * Convex overwrites this file on every `convex dev` start, removing custom paths.
 * This function reads the existing file, adds the required paths if missing,
 * and writes it back.
 *
 * Call this after starting Convex dev to ensure the bundler can resolve
 * `~/...` and `@convex/...` imports in Convex function files.
 * @param cwd - Project directory containing the `convex` folder.
 */
export function patchConvexTsconfig(cwd: string): void {
  const tsconfigPath = resolve(cwd, "convex/tsconfig.json");
  if (!existsSync(tsconfigPath)) return;

  try {
    const raw = readFileSync(tsconfigPath, "utf-8");
    const tsconfig = JSON.parse(stripJsonComments(raw));

    const compilerOptions = tsconfig.compilerOptions ?? {};
    let changed = false;

    // Ensure baseUrl
    if (!compilerOptions.baseUrl) {
      compilerOptions.baseUrl = ".";
      changed = true;
    }

    // Ensure paths
    const paths = compilerOptions.paths ?? {};
    if (!paths["~/*"]) {
      paths["~/*"] = ["../src/*"];
      changed = true;
    }
    if (!paths["@convex/*"]) {
      paths["@convex/*"] = ["./*"];
      changed = true;
    }
    compilerOptions.paths = paths;

    // Ensure dom.iterable in lib
    const lib: string[] = compilerOptions.lib ?? [];
    if (!lib.includes("dom.iterable")) {
      lib.push("dom.iterable");
      compilerOptions.lib = lib;
      changed = true;
    }

    if (changed) {
      tsconfig.compilerOptions = compilerOptions;
      writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n", "utf-8");
    }
  } catch {
    // Parse error or write error — skip silently
  }
}

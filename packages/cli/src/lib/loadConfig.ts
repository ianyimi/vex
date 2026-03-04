import { readFileSync } from "node:fs";
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
 */
function buildAliasFromTsconfig(cwd: string): Record<string, string> {
  const alias: Record<string, string> = {};

  try {
    const raw = readFileSync(resolve(cwd, "tsconfig.json"), "utf-8");
    const tsconfig = JSON.parse(stripJsonComments(raw));
    const paths: Record<string, string[]> = tsconfig?.compilerOptions?.paths;
    if (!paths) return alias;

    for (const [pattern, targets] of Object.entries(paths)) {
      const target = targets[0];
      if (!target) continue;

      // Only map wildcard patterns: "foo/*" → ["./bar/*"]
      if (pattern.endsWith("/*") && target.endsWith("/*")) {
        const key = pattern.slice(0, -2); // "~" or "@convex"
        const value = resolve(cwd, target.slice(0, -2)); // absolute path
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
  };
}

export async function loadConfig(configPath: string): Promise<VexConfig> {
  const cwd = dirname(configPath);
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

/** Create a jiti instance for import resolution (used by traceImports). */
export function createResolver(configPath: string) {
  const cwd = dirname(configPath);
  return createJiti(configPath, createJitiOptions(cwd));
}

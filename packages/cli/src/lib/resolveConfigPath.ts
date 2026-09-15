import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SERVER_CONFIG_NAMES = [
  "vex.config.server.ts",
  "vex.config.server.mts",
  "vex.config.server.js",
  "vex.config.server.mjs",
];

const CLIENT_CONFIG_NAMES = [
  "vex.config.ts",
  "vex.config.mts",
  "vex.config.js",
  "vex.config.mjs",
];

const SEARCH_DIRS = [".", "src"];

/**
 * Locate the project's vex config file, preferring a server config
 * (`vex.config.server.{ts,mts,js,mjs}`) over the client-only fallback
 * (`vex.config.{ts,mts,js,mjs}`) — each family checked in the current
 * directory and then `src/` before the next family is tried.
 * @param cwd - Project directory to search from.
 * @returns Absolute path to the first matching config file found.
 * @throws {Error} When no config file from either family is found in any of the searched locations.
 */
export function resolveConfigPath(cwd: string): string {
  const tried: string[] = [];
  for (const names of [SERVER_CONFIG_NAMES, CLIENT_CONFIG_NAMES]) {
    for (const dir of SEARCH_DIRS) {
      for (const name of names) {
        const fullPath = resolve(cwd, dir, name);
        tried.push(fullPath);
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
    }
  }

  throw new Error(
    `Could not find a vex.config.server.* or vex.config.* file. Looked for:\n${tried.map((p) => `  - ${p}`).join("\n")}`,
  );
}

/**
 * Whether `configPath` resolved to a server config (`vex.config.server.*`)
 * rather than the client-only fallback. `vex dev`/`vex generate`/`vex deploy`
 * need server-only fields (`auth`, `storage.adapters`) and use this to fail
 * with a clear message instead of a confusing property access error deep
 * inside codegen.
 * @param configPath - Absolute path returned by `resolveConfigPath`.
 * @returns `true` for a `vex.config.server.*` path.
 */
export function isServerConfigPath(configPath: string): boolean {
  return SERVER_CONFIG_NAMES.some((name) => configPath.endsWith(`/${name}`));
}

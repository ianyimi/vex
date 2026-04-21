import { existsSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_NAMES = [
  "vex.config.ts",
  "vex.config.mts",
  "vex.config.js",
  "vex.config.mjs",
];

const SEARCH_DIRS = [".", "src"];

export function resolveConfigPath(cwd: string): string {
  const tried: string[] = [];
  for (const dir of SEARCH_DIRS) {
    for (const name of CONFIG_NAMES) {
      const fullPath = resolve(cwd, dir, name);
      tried.push(fullPath);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  throw new Error(
    `Could not find vex config. Looked for:\n${tried.map((p) => `  - ${p}`).join("\n")}`,
  );
}

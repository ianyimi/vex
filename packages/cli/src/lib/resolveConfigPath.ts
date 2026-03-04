import { existsSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_NAMES = [
  "vex.config.ts",
  "vex.config.mts",
  "vex.config.js",
  "vex.config.mjs",
];

export function resolveConfigPath(cwd: string): string {
  for (const name of CONFIG_NAMES) {
    const fullPath = resolve(cwd, name);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  throw new Error(
    `Could not find vex config. Looked for:\n${CONFIG_NAMES.map((n) => `  - ${n}`).join("\n")}`,
  );
}

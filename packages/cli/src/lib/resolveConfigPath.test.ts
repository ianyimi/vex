import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveConfigPath } from "./resolveConfigPath";

describe("resolveConfigPath", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vex-cli-config-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds vex.config.ts in the project root", () => {
    writeFileSync(join(tmpDir, "vex.config.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.ts"));
  });

  it("falls back to src/ when the root has no config", () => {
    mkdirSync(join(tmpDir, "src"));
    writeFileSync(join(tmpDir, "src", "vex.config.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "src", "vex.config.ts"));
  });

  it("prefers any root config over src/ — search dirs are the outer loop", () => {
    mkdirSync(join(tmpDir, "src"));
    writeFileSync(join(tmpDir, "src", "vex.config.ts"), "export default {}");
    writeFileSync(join(tmpDir, "vex.config.mjs"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.mjs"));
  });

  it("throws a message listing every tried path when nothing matches", () => {
    let message = "";
    try {
      resolveConfigPath(tmpDir);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("Could not find vex config");
    expect(message).toContain(resolve(tmpDir, "vex.config.ts"));
    expect(message).toContain(resolve(tmpDir, "src", "vex.config.mjs"));
  });
});

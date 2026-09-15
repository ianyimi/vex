import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isServerConfigPath, resolveConfigPath } from "./resolveConfigPath";

describe("resolveConfigPath", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vex-cli-config-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds vex.config.server.ts when only the server config exists", () => {
    writeFileSync(join(tmpDir, "vex.config.server.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.server.ts"));
  });

  it("falls back to vex.config.ts when only the client config exists", () => {
    writeFileSync(join(tmpDir, "vex.config.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.ts"));
  });

  it("prefers vex.config.server.ts when both exist", () => {
    writeFileSync(join(tmpDir, "vex.config.ts"), "export default {}");
    writeFileSync(join(tmpDir, "vex.config.server.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.server.ts"));
  });

  it("prefers a src/ server config over a root client config — family is the outer loop", () => {
    mkdirSync(join(tmpDir, "src"));
    writeFileSync(join(tmpDir, "vex.config.ts"), "export default {}");
    writeFileSync(join(tmpDir, "src", "vex.config.server.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "src", "vex.config.server.ts"));
  });

  it("throws an error naming both config families when neither exists", () => {
    let message = "";
    try {
      resolveConfigPath(tmpDir);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("vex.config.server.*");
    expect(message).toContain("vex.config.*");
    expect(message).toContain(resolve(tmpDir, "vex.config.server.ts"));
    expect(message).toContain(resolve(tmpDir, "src", "vex.config.mjs"));
  });
});

describe("isServerConfigPath", () => {
  it("distinguishes the server family from the client fallback", () => {
    expect(isServerConfigPath("/app/src/vex.config.server.ts")).toBe(true);
    expect(isServerConfigPath("/app/vex.config.server.mjs")).toBe(true);
    expect(isServerConfigPath("/app/src/vex.config.ts")).toBe(false);
  });
});

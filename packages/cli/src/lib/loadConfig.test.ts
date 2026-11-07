import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "./loadConfig";

describe("loadConfig", () => {
  let projectDir: string;
  let originalEnvValue: string | undefined;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "vex-cli-loadconfig-"));
    originalEnvValue = process.env.VEX_TEST_DOTENV;
    delete process.env.VEX_TEST_DOTENV;
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    if (originalEnvValue === undefined) {
      delete process.env.VEX_TEST_DOTENV;
    } else {
      process.env.VEX_TEST_DOTENV = originalEnvValue;
    }
  });

  it("loads .env.local from the project root even when the config lives in src/", async () => {
    writeFileSync(join(projectDir, ".env.local"), "VEX_TEST_DOTENV=from-root\n");
    mkdirSync(join(projectDir, "src"));
    const configPath = join(projectDir, "src", "vex.config.server.ts");
    writeFileSync(configPath, "export default { collections: [] };\n");

    await loadConfig({ configPath, projectDir });

    expect(process.env.VEX_TEST_DOTENV).toBe("from-root");
  });

  it("does not overwrite an already-set env var with .env.local's value", async () => {
    process.env.VEX_TEST_DOTENV = "pre-existing";
    writeFileSync(join(projectDir, ".env.local"), "VEX_TEST_DOTENV=from-root\n");
    mkdirSync(join(projectDir, "src"));
    const configPath = join(projectDir, "src", "vex.config.server.ts");
    writeFileSync(configPath, "export default { collections: [] };\n");

    await loadConfig({ configPath, projectDir });

    expect(process.env.VEX_TEST_DOTENV).toBe("pre-existing");
  });
});

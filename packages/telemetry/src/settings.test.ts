import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readTelemetrySettings, resolveSettingsPath, writeTelemetrySettings } from "./settings";
import type { TelemetrySettings } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SALT_PATTERN = /^[0-9a-f]{64}$/;

describe("resolveSettingsPath", () => {
  it("uses XDG_CONFIG_HOME when set", () => {
    expect(resolveSettingsPath({ env: { XDG_CONFIG_HOME: "/xdg" } })).toBe(
      join("/xdg", "vexcms", "telemetry.json"),
    );
  });

  it("falls back to ~/.config when XDG_CONFIG_HOME is unset", () => {
    expect(resolveSettingsPath({ env: {} })).toBe(join(homedir(), ".config", "vexcms", "telemetry.json"));
  });
});

describe("readTelemetrySettings / writeTelemetrySettings", () => {
  let tmpDir: string;
  let env: { XDG_CONFIG_HOME: string };

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vex-telemetry-settings-"));
    env = { XDG_CONFIG_HOME: tmpDir };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generates and persists a new machineId and salt when no file exists", () => {
    const settings = readTelemetrySettings({ env });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(settings.salt).toMatch(SALT_PATTERN);
    const path = resolveSettingsPath({ env });
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(settings);
  });

  it("returns stored settings unchanged when the file is valid", () => {
    const stored: TelemetrySettings = {
      machineId: "11111111-1111-1111-1111-111111111111",
      salt: "a".repeat(64),
      enabled: false,
      noticeShownAt: "2026-01-01T00:00:00.000Z",
    };
    mkdirSync(join(tmpDir, "vexcms"), { recursive: true });
    writeFileSync(resolveSettingsPath({ env }), JSON.stringify(stored));
    expect(readTelemetrySettings({ env })).toEqual(stored);
  });

  it("recovers from a corrupt settings file by generating a new one", () => {
    const path = resolveSettingsPath({ env });
    mkdirSync(join(tmpDir, "vexcms"), { recursive: true });
    writeFileSync(path, "{ not json");
    const settings = readTelemetrySettings({ env });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(settings.salt).toMatch(SALT_PATTERN);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(settings);
  });

  it("recovers from a settings file missing machineId/salt", () => {
    const path = resolveSettingsPath({ env });
    mkdirSync(join(tmpDir, "vexcms"), { recursive: true });
    writeFileSync(path, JSON.stringify({ enabled: true }));
    const settings = readTelemetrySettings({ env });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(settings.salt).toMatch(SALT_PATTERN);
  });

  it("readTelemetrySettings does not throw when the settings directory cannot be created", () => {
    const blockerPath = join(tmpDir, "blocker");
    writeFileSync(blockerPath, "not a directory");
    const blockedEnv = { XDG_CONFIG_HOME: blockerPath };
    expect(() => readTelemetrySettings({ env: blockedEnv })).not.toThrow();
    const settings = readTelemetrySettings({ env: blockedEnv });
    expect(settings.machineId).toMatch(UUID_PATTERN);
    expect(existsSync(resolveSettingsPath({ env: blockedEnv }))).toBe(false);
  });

  it("writeTelemetrySettings does not throw when the directory cannot be created", () => {
    const blockerPath = join(tmpDir, "blocker2");
    writeFileSync(blockerPath, "not a directory");
    const blockedEnv = { XDG_CONFIG_HOME: blockerPath };
    expect(() =>
      writeTelemetrySettings({ env: blockedEnv, settings: { machineId: "x", salt: "y" } }),
    ).not.toThrow();
  });
});

import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { TELEMETRY_ENV } from "./constants";
import type { TelemetryEnv, TelemetrySettings } from "./types";

/**
 * Resolve the per-machine telemetry settings file path, honoring
 * `XDG_CONFIG_HOME` before falling back to the user's home directory.
 * @param props.env - Environment to read `XDG_CONFIG_HOME` from.
 * @returns Absolute path to `telemetry.json`.
 */
export function resolveSettingsPath(props: { env: TelemetryEnv }): string {
  const xdgConfigHome = props.env[TELEMETRY_ENV.xdgConfigHome];
  const configHome =
    xdgConfigHome && xdgConfigHome.length > 0 ? xdgConfigHome : join(homedir(), ".config");
  return join(configHome, "vexcms", "telemetry.json");
}

function isTelemetrySettings(value: unknown): value is TelemetrySettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "machineId" in value &&
    typeof value.machineId === "string" &&
    "salt" in value &&
    typeof value.salt === "string"
  );
}

function readExistingSettings(props: { path: string }): TelemetrySettings | undefined {
  if (!existsSync(props.path)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(props.path, "utf8"));
    return isTelemetrySettings(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read the per-machine telemetry settings, generating and persisting a new
 * `machineId`/`salt` pair when the file is missing, corrupt, or unreadable.
 * @param props.env - Environment used to resolve the settings path.
 * @returns The stored settings, or newly generated ones.
 */
export function readTelemetrySettings(props: { env: TelemetryEnv }): TelemetrySettings {
  const path = resolveSettingsPath({ env: props.env });
  const existing = readExistingSettings({ path });
  if (existing) {
    return existing;
  }
  const settings: TelemetrySettings = {
    machineId: randomUUID(),
    salt: randomBytes(32).toString("hex"),
  };
  writeTelemetrySettings({ env: props.env, settings });
  return settings;
}

/**
 * Persist telemetry settings to the resolved settings path. Never throws —
 * an unwritable directory or file silently leaves this process's state
 * unpersisted.
 * @param props.env - Environment used to resolve the settings path.
 * @param props.settings - Settings to write.
 */
export function writeTelemetrySettings(props: { env: TelemetryEnv; settings: TelemetrySettings }): void {
  const path = resolveSettingsPath({ env: props.env });
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(props.settings, null, 2));
  } catch {
    return;
  }
}

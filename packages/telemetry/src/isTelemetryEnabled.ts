import { TELEMETRY_ENV } from "./constants";
import { isCi } from "./isCi";
import type { TelemetryEnv, TelemetrySettings } from "./types";

/** Every reason `isTelemetryEnabled` can give for its enabled/disabled decision. */
export const TELEMETRY_STATUS_REASONS = [
  "doNotTrack",
  "envDisabled",
  "ci",
  "userDisabled",
  "userEnabled",
  "default",
] as const;

/** Derived from {@link TELEMETRY_STATUS_REASONS}. */
export type TelemetryStatusReason = (typeof TELEMETRY_STATUS_REASONS)[number];

function isEnvFlagSet(props: { env: TelemetryEnv; key: string }): boolean {
  const value = props.env[props.key];
  return value !== undefined && value !== "" && value !== "0" && value.toLowerCase() !== "false";
}

/**
 * Resolve whether telemetry should fire, and which rule decided it.
 * @param props.env - Environment to read the override variables from.
 * @param props.settings - Stored per-machine telemetry settings.
 * @returns `enabled` and the deciding `reason`.
 */
export function isTelemetryEnabled(props: {
  env: TelemetryEnv;
  settings: TelemetrySettings;
}): { enabled: boolean; reason: TelemetryStatusReason } {
  if (isEnvFlagSet({ env: props.env, key: TELEMETRY_ENV.doNotTrack })) {
    return { enabled: false, reason: "doNotTrack" };
  }
  if (isEnvFlagSet({ env: props.env, key: TELEMETRY_ENV.disabled })) {
    return { enabled: false, reason: "envDisabled" };
  }
  if (isCi({ env: props.env })) {
    return { enabled: false, reason: "ci" };
  }
  if (props.settings.enabled === false) {
    return { enabled: false, reason: "userDisabled" };
  }
  if (props.settings.enabled === true) {
    return { enabled: true, reason: "userEnabled" };
  }
  return { enabled: true, reason: "default" };
}

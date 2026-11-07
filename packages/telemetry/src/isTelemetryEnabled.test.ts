import { describe, expect, it } from "vitest";

import { isTelemetryEnabled } from "./isTelemetryEnabled";
import type { TelemetrySettings } from "./types";

const baseSettings: TelemetrySettings = { machineId: "machine-1", salt: "salt-1" };

describe("isTelemetryEnabled", () => {
  it("disables for DO_NOT_TRACK=1 even when settings and CI would otherwise allow it", () => {
    expect(
      isTelemetryEnabled({
        env: { DO_NOT_TRACK: "1", CI: "true" },
        settings: { ...baseSettings, enabled: true },
      }),
    ).toEqual({ enabled: false, reason: "doNotTrack" });
  });

  it("treats DO_NOT_TRACK=0 as unset", () => {
    expect(isTelemetryEnabled({ env: { DO_NOT_TRACK: "0" }, settings: baseSettings })).toEqual({
      enabled: true,
      reason: "default",
    });
  });

  it("treats DO_NOT_TRACK=false as unset", () => {
    expect(isTelemetryEnabled({ env: { DO_NOT_TRACK: "false" }, settings: baseSettings })).toEqual({
      enabled: true,
      reason: "default",
    });
  });

  it("disables for VEX_TELEMETRY_DISABLED=1", () => {
    expect(
      isTelemetryEnabled({
        env: { VEX_TELEMETRY_DISABLED: "1" },
        settings: { ...baseSettings, enabled: true },
      }),
    ).toEqual({ enabled: false, reason: "envDisabled" });
  });

  it("does not let VEX_TELEMETRY_DISABLED=0 override a stored false", () => {
    expect(
      isTelemetryEnabled({
        env: { VEX_TELEMETRY_DISABLED: "0" },
        settings: { ...baseSettings, enabled: false },
      }),
    ).toEqual({ enabled: false, reason: "userDisabled" });
  });

  it("disables in CI", () => {
    expect(
      isTelemetryEnabled({ env: { CI: "true" }, settings: { ...baseSettings, enabled: true } }),
    ).toEqual({ enabled: false, reason: "ci" });
  });

  it("disables for a stored enabled: false", () => {
    expect(isTelemetryEnabled({ env: {}, settings: { ...baseSettings, enabled: false } })).toEqual({
      enabled: false,
      reason: "userDisabled",
    });
  });

  it("enables for a stored enabled: true", () => {
    expect(isTelemetryEnabled({ env: {}, settings: { ...baseSettings, enabled: true } })).toEqual({
      enabled: true,
      reason: "userEnabled",
    });
  });

  it("defaults to enabled when nothing overrides it", () => {
    expect(isTelemetryEnabled({ env: {}, settings: baseSettings })).toEqual({
      enabled: true,
      reason: "default",
    });
  });
});

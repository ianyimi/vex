import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TELEMETRY_DOCS_URL } from "./constants";
import { showTelemetryNotice } from "./showTelemetryNotice";
import type { TelemetryEnv, TelemetrySettings } from "./types";

describe("showTelemetryNotice", () => {
  let configHome: string;
  let env: TelemetryEnv;
  let settings: TelemetrySettings;

  beforeEach(() => {
    configHome = mkdtempSync(join(tmpdir(), "vex-telemetry-notice-"));
    env = { XDG_CONFIG_HOME: configHome };
    settings = { machineId: randomUUID(), salt: randomBytes(32).toString("hex") };
  });

  afterEach(() => {
    rmSync(configHome, { recursive: true, force: true });
  });

  it("prints the complete notice text once and stamps noticeShownAt", () => {
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const stamped = showTelemetryNotice({ env, settings });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const printed = writeSpy.mock.calls[0]?.[0] as string;
    expect(printed).toContain("anonymous build-time telemetry");
    expect(printed).toContain(TELEMETRY_DOCS_URL);
    expect(printed).toContain("vex telemetry disable");
    expect(printed).toContain("DO_NOT_TRACK");
    expect(stamped.noticeShownAt).toBeDefined();

    writeSpy.mockRestore();
  });

  it("is silent on a second call once noticeShownAt is set", () => {
    const first = showTelemetryNotice({ env, settings });
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const second = showTelemetryNotice({ env, settings: first });

    expect(writeSpy).not.toHaveBeenCalled();
    expect(second).toEqual(first);

    writeSpy.mockRestore();
  });
});

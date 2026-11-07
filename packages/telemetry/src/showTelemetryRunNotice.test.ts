import { describe, expect, it, vi } from "vitest";
import { TELEMETRY_DOCS_URL } from "./constants";
import { showTelemetryRunNotice } from "./showTelemetryRunNotice";

describe("showTelemetryRunNotice", () => {
  it("prints the two-line per-run reminder to stderr", () => {
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    showTelemetryRunNotice();

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const printed = writeSpy.mock.calls[0]?.[0] as string;
    expect(printed).toContain("VexCMS collects anonymous telemetry");
    expect(printed).toContain("vex telemetry disable");
    expect(printed).toContain("DO_NOT_TRACK");
    expect(printed).toContain(TELEMETRY_DOCS_URL);

    writeSpy.mockRestore();
  });
});

import { TELEMETRY_DOCS_URL, TELEMETRY_ENV } from "./constants";

/**
 * Prints the two-line per-run telemetry reminder to stderr. `recordTelemetryEvent`
 * shows this after every attempted send (success or failure) — but never on
 * the very first run on a machine, when the first-run notice already covers
 * it, and never in debug mode, when nothing was actually sent.
 */
export function showTelemetryRunNotice(): void {
  process.stderr.write(
    `[vex] VexCMS collects anonymous telemetry to help improve the project.\n[vex] Disable with "vex telemetry disable" or ${TELEMETRY_ENV.doNotTrack}=1: ${TELEMETRY_DOCS_URL}\n`,
  );
}

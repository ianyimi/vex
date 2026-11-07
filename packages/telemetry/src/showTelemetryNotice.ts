import { TELEMETRY_DOCS_URL, TELEMETRY_ENV } from "./constants";
import { writeTelemetrySettings } from "./settings";
import type { TelemetryEnv, TelemetrySettings } from "./types";

function buildNoticeText(): string {
  return [
    "vex collects anonymous build-time telemetry: config shape (field types and",
    "enabled features, never collection/field/block names), environment (OS, Node,",
    "package manager, @vexcms/* versions) and a random per-machine, per-project id.",
    "No personal data, file contents, or project names are ever sent.",
    `Docs: ${TELEMETRY_DOCS_URL}`,
    `Disable with "vex telemetry disable" or by setting ${TELEMETRY_ENV.doNotTrack}=1.`,
  ].join("\n");
}

/**
 * Prints the first-run telemetry notice exactly once per machine and
 * persists the stamp that suppresses it afterward.
 *
 * @param props.env Environment used to resolve the settings file path.
 * @param props.settings The settings loaded for this run.
 * @returns The settings, stamped with `noticeShownAt` when the notice was
 *   just shown; unchanged otherwise.
 */
export function showTelemetryNotice(props: { env: TelemetryEnv; settings: TelemetrySettings }): TelemetrySettings {
  if (props.settings.noticeShownAt) {
    return props.settings;
  }

  process.stderr.write(`${buildNoticeText()}\n`);

  const stamped: TelemetrySettings = { ...props.settings, noticeShownAt: new Date().toISOString() };
  writeTelemetrySettings({ env: props.env, settings: stamped });
  return stamped;
}

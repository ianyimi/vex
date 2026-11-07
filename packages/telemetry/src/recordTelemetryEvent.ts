import { collectEnvironment } from "./collectEnvironment";
import { createProjectId } from "./projectId";
import { readTelemetrySettings } from "./settings";
import { isDebugEnabled, sendTelemetryEvent } from "./sendTelemetryEvent";
import { showTelemetryNotice } from "./showTelemetryNotice";
import { showTelemetryRunNotice } from "./showTelemetryRunNotice";
import { isTelemetryEnabled } from "./isTelemetryEnabled";
import { TELEMETRY_SCHEMA_VERSION } from "./constants";
import type {
  AnonymizedConfig,
  TelemetryCreateOptions,
  TelemetryEnv,
  TelemetryEvent,
  TelemetryEventName,
  TelemetryOutcome,
  TelemetrySettings,
  TelemetryTimings,
} from "./types";

/**
 * Assembles the full telemetry payload for one event, deterministic given
 * its inputs so the CLI can also use it for `vex telemetry status --json`.
 *
 * @param props.event The event name.
 * @param props.projectDir Absolute path to the project directory.
 * @param props.settings The machine's telemetry settings.
 * @param props.outcome Whether the run succeeded, or failed with a stage and error code.
 * @param props.config Optional already-anonymized project config.
 * @param props.timings Optional build/dev timing data.
 * @param props.create Optional `create-vexcms` scaffold options.
 * @returns The complete {@link TelemetryEvent}.
 */
export function buildTelemetryEvent(props: {
  event: TelemetryEventName;
  projectDir: string;
  settings: TelemetrySettings;
  outcome: TelemetryOutcome;
  config?: AnonymizedConfig;
  timings?: TelemetryTimings;
  create?: TelemetryCreateOptions;
}): TelemetryEvent {
  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    event: props.event,
    machineId: props.settings.machineId,
    projectId: createProjectId({ salt: props.settings.salt, projectDir: props.projectDir }),
    sentAt: new Date().toISOString(),
    environment: collectEnvironment({ projectDir: props.projectDir }),
    outcome: props.outcome,
    ...(props.config ? { config: props.config } : {}),
    ...(props.timings ? { timings: props.timings } : {}),
    ...(props.create ? { create: props.create } : {}),
  };
}

/**
 * Records one telemetry event: resolves enablement, shows the first-run
 * notice when needed, builds the payload and sends it, then — unless this
 * was the first-run notice run, `hideRunNotice` is set, or debug mode made
 * the send a no-op print — shows the one-line per-run reminder. Never
 * rejects and never throws — a telemetry failure never affects the calling
 * command.
 *
 * @param props.event The event name.
 * @param props.projectDir Absolute path to the project directory.
 * @param props.outcome Whether the run succeeded, or failed with a stage and error code.
 * @param props.env Environment to resolve settings/enablement against;
 *   defaults to `process.env`.
 * @param props.config Optional factory producing the already-anonymized
 *   project config. Called only after the enablement check — so a disabled
 *   run never pays for anonymizing a config nobody sends — and only inside
 *   a try/catch: a throw sends the event without `config` (the outcome is
 *   unaffected; it only covers vex-owned stages) rather than failing the
 *   caller's otherwise-successful command.
 * @param props.timings Optional build/dev timing data.
 * @param props.create Optional `create-vexcms` scaffold options.
 * @param props.timeoutMs Milliseconds to wait before aborting the send;
 *   defaults to `sendTelemetryEvent`'s own default.
 * @param props.hideRunNotice Suppresses the per-run reminder for this call;
 *   defaults to `false`. Set from the project's `telemetry.hideLogs` config.
 */
export async function recordTelemetryEvent(props: {
  event: TelemetryEventName;
  projectDir: string;
  outcome: TelemetryOutcome;
  env?: TelemetryEnv;
  config?: () => AnonymizedConfig;
  timings?: TelemetryTimings;
  create?: TelemetryCreateOptions;
  timeoutMs?: number;
  hideRunNotice?: boolean;
}): Promise<void> {
  const env = props.env ?? process.env;
  const settings = readTelemetrySettings({ env });
  const { enabled } = isTelemetryEnabled({ env, settings });
  if (!enabled) {
    return;
  }

  let config: AnonymizedConfig | undefined;
  if (props.config) {
    try {
      config = props.config();
    } catch {
      config = undefined;
    }
  }

  const isFirstRun = !settings.noticeShownAt;
  const noticedSettings = showTelemetryNotice({ env, settings });
  const event = buildTelemetryEvent({
    event: props.event,
    projectDir: props.projectDir,
    settings: noticedSettings,
    outcome: props.outcome,
    config,
    timings: props.timings,
    create: props.create,
  });
  await sendTelemetryEvent({ event, env, timeoutMs: props.timeoutMs });

  if (!props.hideRunNotice && !isFirstRun && !isDebugEnabled(env)) {
    showTelemetryRunNotice();
  }
}

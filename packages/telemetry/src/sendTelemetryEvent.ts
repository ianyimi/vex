import { DEFAULT_TELEMETRY_ENDPOINT, TELEMETRY_ENV, TELEMETRY_TIMEOUT_MS } from "./constants";
import { fitTelemetryEvent } from "./fitTelemetryEvent";
import type { TelemetryEnv, TelemetryEvent } from "./types";

/**
 * Whether `VEX_TELEMETRY_DEBUG` is set to a truthy value — shared by
 * `sendTelemetryEvent` (print instead of send) and `recordTelemetryEvent`
 * (skip the per-run notice, since nothing was actually sent).
 * @param env - Environment to read `VEX_TELEMETRY_DEBUG` from.
 * @returns `true` when debug mode is on.
 */
export function isDebugEnabled(env: TelemetryEnv): boolean {
  const value = env[TELEMETRY_ENV.debug];
  return value !== undefined && value !== "0" && value !== "false" && value !== "";
}

/**
 * Sends one telemetry event over HTTP, never throwing and never delaying the
 * caller beyond `props.timeoutMs` (default {@link TELEMETRY_TIMEOUT_MS}). In
 * debug mode the event is printed to stderr instead of being sent. Oversize
 * events are shrunk or dropped by {@link fitTelemetryEvent} before either
 * path runs, so debug mode always shows exactly what would be sent.
 *
 * @param props.event The event to send.
 * @param props.env Environment used to resolve `VEX_TELEMETRY_ENDPOINT` and
 *   `VEX_TELEMETRY_DEBUG`.
 * @param props.timeoutMs Milliseconds to wait before aborting the request;
 *   defaults to {@link TELEMETRY_TIMEOUT_MS}.
 */
export async function sendTelemetryEvent(props: { event: TelemetryEvent; env: TelemetryEnv; timeoutMs?: number }): Promise<void> {
  const fittedEvent = fitTelemetryEvent({ event: props.event });
  if (!fittedEvent) {
    return;
  }

  if (isDebugEnabled(props.env)) {
    process.stderr.write(`[vex telemetry] ${JSON.stringify(fittedEvent, null, 2)}\n`);
    return;
  }

  const endpoint = props.env[TELEMETRY_ENV.endpoint] ?? DEFAULT_TELEMETRY_ENDPOINT;
  const body = JSON.stringify(fittedEvent);

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(props.timeoutMs ?? TELEMETRY_TIMEOUT_MS),
    });
  } catch {
    return;
  }
}

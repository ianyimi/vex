import { TELEMETRY_MAX_BODY_BYTES } from "./constants";
import type { TelemetryEvent } from "./types";

/**
 * Shrinks a telemetry event's `config` to fit {@link TELEMETRY_MAX_BODY_BYTES}:
 * first tries the event unchanged, then with `config`'s `resources`,
 * `blocks`, and `fields` arrays dropped (every count and `features` field
 * kept, `truncated: true` set), then gives up and returns `undefined` if
 * it's still oversize.
 *
 * @param props.event The event to fit.
 * @returns The event (possibly with a truncated `config`), or `undefined`
 *   when even a truncated `config` doesn't fit the cap.
 */
export function fitTelemetryEvent(props: { event: TelemetryEvent }): TelemetryEvent | undefined {
  const { event } = props;
  if (Buffer.byteLength(JSON.stringify(event), "utf8") <= TELEMETRY_MAX_BODY_BYTES) {
    return event;
  }
  if (!event.config) {
    return undefined;
  }

  const truncatedEvent: TelemetryEvent = {
    ...event,
    config: { ...event.config, resources: [], blocks: [], fields: [], truncated: true },
  };
  if (Buffer.byteLength(JSON.stringify(truncatedEvent), "utf8") <= TELEMETRY_MAX_BODY_BYTES) {
    return truncatedEvent;
  }
  return undefined;
}

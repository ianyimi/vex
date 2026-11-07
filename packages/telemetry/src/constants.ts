/** Current shape version stamped on every outgoing `TelemetryEvent`. */
export const TELEMETRY_SCHEMA_VERSION = 1;

/** Public docs page explaining what telemetry collects and how to disable it. */
export const TELEMETRY_DOCS_URL = "https://docs.vexcms.dev/guides/telemetry/";

/** HTTP endpoint telemetry events are POSTed to unless overridden by `VEX_TELEMETRY_ENDPOINT`. */
export const DEFAULT_TELEMETRY_ENDPOINT = "https://telemetry.vexcms.dev/events";

/** Maximum time, in milliseconds, a telemetry send is allowed to block the caller. */
export const TELEMETRY_TIMEOUT_MS = 1500;

/** `vex dev` records its `ok` event only after the first Convex push resolves — in `--once` the send is awaited, but purely as bookkeeping before the process exits, never a wait the user notices; in watch mode it's fire-and-forget. Either way dev never blocks ON the push waiting for telemetry, so a longer window than {@link TELEMETRY_TIMEOUT_MS} costs nothing and tolerates a receiver sharing the same deployment the push just finished pushing to. */
export const TELEMETRY_DEV_TIMEOUT_MS = 10_000;

/** Maximum serialized event body size, in bytes, before `fitTelemetryEvent` truncates or drops the payload. */
export const TELEMETRY_MAX_BODY_BYTES = 524_288;

/** Environment variable names telemetry reads, keyed by their purpose. */
export const TELEMETRY_ENV = {
  doNotTrack: "DO_NOT_TRACK",
  disabled: "VEX_TELEMETRY_DISABLED",
  debug: "VEX_TELEMETRY_DEBUG",
  endpoint: "VEX_TELEMETRY_ENDPOINT",
  xdgConfigHome: "XDG_CONFIG_HOME",
} as const;

/** CLI commands that each emit at most one telemetry event per invocation. */
export const TELEMETRY_EVENTS = ["dev", "deploy", "create"] as const;

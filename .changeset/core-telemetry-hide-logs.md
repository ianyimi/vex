---
"@vexcms/core": patch
---

New `server.telemetry.hideLogs` option on `defineServerConfig` (default `false`). It hides the
two-line telemetry reminder the `vex` CLI prints after each run that sends an event. It does
not disable telemetry: opt out with `vex telemetry disable`, `DO_NOT_TRACK=1` or
`VEX_TELEMETRY_DISABLED=1`. The resolved `VexConfig.telemetry` is always present.

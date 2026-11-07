---
"@vexcms/cli": patch
---

**Anonymous build-time telemetry.** `vex dev` (once per process, after the first Convex push)
and `vex deploy` send one anonymous event describing the config's shape: types, counts and
flags, never names or values. Off in CI and with `DO_NOT_TRACK=1` or
`VEX_TELEMETRY_DISABLED=1`. The first run prints a notice, and later runs print a two-line
reminder (hide it with `server.telemetry.hideLogs`). A telemetry failure never fails a
command. See https://docs.vexcms.dev/guides/telemetry/.

**New `vex telemetry enable | disable | status [--json]`.** Stores the per-machine choice;
`status --json` prints the exact payload without sending it.

**Fix: `.env.local` now loads for configs in `src/`.** The CLI looked for `.env.local` (and
created its placeholder `convex/vex.schema.ts`) next to the config file instead of in the
project root, so projects with `src/vex.config.server.ts` ran without their env vars.

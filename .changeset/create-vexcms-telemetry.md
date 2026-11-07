---
"create-vexcms": patch
---

Sends one anonymous `create` event per scaffold: framework, template, `--bare`/`--monorepo`,
auth choices as booleans plus a provider count, and the git/install flags, never the project
name or path. Off in CI and with `DO_NOT_TRACK=1`, `VEX_TELEMETRY_DISABLED=1` or
`vex telemetry disable`. Prints the first-run notice, then a two-line reminder with
the opt-out instructions. See https://docs.vexcms.dev/guides/telemetry/.

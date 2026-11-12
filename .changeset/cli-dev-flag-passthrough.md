---
"@vexcms/cli": patch
---

`vex dev` forwards every flag it doesn't own to `convex dev`, the way `vex deploy` already forwards to `convex deploy`. Before, `vex dev --tail-logs always`, `--run`, `--configure`, `--env-file`, `--start` and every other `convex dev` flag were dropped without a warning. They now reach both the long-running `convex dev` and the one-shot `vex dev --once` push. The one-shot push keeps `--typecheck disable --codegen disable` unless you pass your own `--typecheck` or `--codegen`. Interim auto-migration pushes skip `--run`, `--run-component` and `--start`, so those run once, on the final push. `vex dev --start 'next dev'` runs your app server from the same terminal.

`--once` is now a vex flag only on `dev`, and `--json` only on `telemetry`; on the other commands that wrap Convex they're forwarded like any other flag.

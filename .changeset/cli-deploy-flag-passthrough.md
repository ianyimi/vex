---
"@vexcms/cli": patch
---

`vex deploy [--cwd <dir>] [convex deploy flags…]` now forwards every flag it doesn't own
straight through to the final `convex deploy` call — `--cmd`, `--preview-create`, and the
rest. `--cwd` stays vex's own (it now actually runs from `<dir>` instead of always using
`process.cwd()`). The auto-migration interim pushes strip `--cmd`/`--cmd-url-env-var-name` so
a custom build command runs once, on the final deploy, not on every interim schema push.
`convex deploy` runs with no timeout (previously 120s) — every other `convex` command vex runs
keeps its 120s timeout.

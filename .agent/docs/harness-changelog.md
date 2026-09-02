# Harness Changelog

- 2026-08-12 preferences.md: added P-004 (client evaluates `hasPermission` directly; `access` via client-bundle import to `VexAccessProvider`, `user`/`organization` via context; server guards enforce, client is advisory) and P-005 (RSC-serialization vs. bundler-import are different boundaries; only serialization strips) — trigger: RBAC spec Decisions 24 & 12 clarification, client-side permission architecture settled during spec 2026-08-12-rbac-access-control.
- 2026-08-08 `.agent/docs/specs/`, `.agent/docs/design/`: migrated specs 35 & 36 from `.pi/agent-docs/specs/` to `.agent/docs/specs/`, design assets from `.pi/design/` to `.agent/docs/design/`, updated all live references in `.agent/` — trigger: "remove the .pi folder completely and only have .omp and .agent"
- 2026-01-23 dev-processes.md: Reinforced existing rule P-005 (line 51) — agents never open browser windows. All manual browser testing delegated to developer.

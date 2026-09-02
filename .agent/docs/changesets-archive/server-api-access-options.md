---
"@vexcms/core": minor
"@vexcms/cli": minor
---

Per-call `access: { action?, bypass? }` options on every server API function and
`vexServerApi` wrapper, resolved through a single `resolveAccessCall` seam. Custom
actions gain their first runtime consumer; `readDrafts` rides the same seam for the
upcoming versioning feature. `vex generate` emits `CustomActionsBySlug`, and
`QueryCallActionFor`/`MutationCallActionFor` type `access.action` per collection slug.

BREAKING: `defaultPermissionMode` is removed from `VexAccessConfigInput` — the
undeclared-permission posture is always deny; write a role-level `"*": true` for
allow-style roles. `skipAccess` on `vexServerApi` is replaced by `access: { bypass: true }`.

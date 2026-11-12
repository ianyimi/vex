---
"@vexcms/better-auth": patch
---

`betterAuthAdapter()` now keeps `roles` — the `additionalFields` alias AP-027/the auth guide
mandate for the admin plugin's role field — writable in the admin UI. `EDITABLE_FIELDS` only
listed the singular `role` (Better Auth's own built-in field name), so every project following
the documented `roles` convention got `admin.readOnly: true` and `meta.locked: true` stamped
onto it, disabling the field in the edit view for every caller, including an admin, with no way
to un-lock it from project config.

`input: false` (required on `roles` since the AP-027 hotfix) only blocks Better Auth's own
`/sign-up/email` and `/update-user` endpoints from writing the field; it never governed whether
the admin panel's access-checked `vex:update` mutation could write it, and still doesn't — an
admin changing a user's role through the admin panel continues to go through normal RBAC, not
the Better Auth client surface.

No migration: this only removes an incorrect `admin.readOnly`/`meta.locked` stamp from one field.

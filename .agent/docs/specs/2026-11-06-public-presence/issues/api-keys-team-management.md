title: API keys and team management
labels: planned, type: feature, area: auth

## Context

Better Auth's `apiKey` plugin schema already exists in the generated auth tables, but nothing in
VexCMS issues or scopes keys, and there's no way to invite a teammate or assign them a role from the
admin panel.

## Scope

Admin UI to invite a user, assign one of the project's configured roles, and issue a scoped API key
(read-only or read/write, optionally limited to specific collections) for reading or writing content
from outside the admin panel.

## Acceptance criteria

- [ ] An admin can invite a user by email and assign a role, without touching the Convex dashboard
- [ ] An admin can issue an API key scoped to specific collections and permissions, and revoke it
- [ ] A request authenticated with an API key is subject to the same access-control rules as a signed-in
      user with the key's assigned role

## Out of scope

Identity-provider integrations.

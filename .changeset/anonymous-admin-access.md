---
"create-vexcms": patch
---

The scaffolded `admin/[[...path]]/page.tsx` no longer hard-redirects to sign-in before
checking `canAccessAdminPanel` — it awaits `getUserOrg()` (already safe with no session)
and checks authorization first, only redirecting to sign-in when a caller is BOTH
unauthenticated and denied. The marketing-site template's `proxy.ts` middleware gate gets
the matching fix: it checks `canAccessAdminPanel({ access, user: null })` before its own
session-verification round trip, skipping it entirely when the result is `true`.

This makes anonymous, read-only admin access a pure `access.ts` config decision — set
`anonRole` to a role that grants `adminPanel.access` plus field-scoped reads, and
anonymous visitors reach `/admin` directly with no sign-in detour, seeing only what that
role can read (enforced server-side on every query/mutation, identically to any other
role). An app that hasn't configured this gets byte-identical behavior to before on both
the route and the middleware gate — this is additive, not a breaking change.

The `base-nextjs` (private-app) template's own whole-app middleware gate is intentionally
unchanged — a private app has no public surface to carve an exception into, so its
`page.tsx` gains the same route-level fix for consistency but the app itself stays fully
gated end to end.

See the "Read-only public admin via `anonRole`" section of the Access Control guide for
the full pattern, including the middleware-layer check most Next.js apps also need.

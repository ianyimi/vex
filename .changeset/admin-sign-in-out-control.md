---
"@vexcms/react": patch
"@vexcms/next": patch
"create-vexcms": patch
---

New sign-in/out control in the admin top bar, enabled by anonymous admin access via
`anonRole`: a visitor browsing the admin panel anonymously now has a visible way to sign
in, and a signed-in user a visible way to sign out, right from `AdminTopNav`.

`@vexcms/react`'s `FrameworkComponents` (`useFrameworkComponents`) gains an optional
`auth` field — a `{ signInHref, signOut }` adapter. Omitted (the default), the control
renders nothing, same as before this release. The signed-in/out determination itself
comes from the existing `useVexAuth()` (`{ user, organization }`, server-resolved, no
client-only flash) — `user === null` or `user.isAnonymous === true` (Better Auth's
`anonymous()` plugin convention) both render "Sign in"; anything else renders "Sign out".

Placement: the opposite edge of the bar from the sidebar-trigger/breadcrumbs/"View site"
cluster, derived from the SAME `config.admin.sidebar.side` the cluster itself reads — a
`"right"` sidebar puts the control at the far left, a `"left"`/default sidebar at the far
right.

`@vexcms/next` provides the Next.js adapter: `VexAdminAuthAdapterProvider`/
`useVexAdminAuthAdapter` from the new `@vexcms/next/auth` subpath. A context, not a prop
threaded through `NextAdminLayout`/your admin `layout.tsx`, because both of those are
server components and the sign-in href builder/`signOut` function are app-specific client
values that cannot cross that boundary as props — mount the provider anywhere above
`NextAdminLayout` in your own client tree (e.g. alongside your Better Auth client
provider) instead. See `VexAdminAuthAdapterContext`'s own doc comment for a full example.

`apps/test`, `apps/www`, and the `create-vexcms` `base-nextjs` template (inherited
unchanged by the `marketing-site` overlay) now wire this up in their own
`BetterAuthClientProvider`, so every scaffolded project gets the control by default with
no per-app configuration beyond the generated auth client itself.

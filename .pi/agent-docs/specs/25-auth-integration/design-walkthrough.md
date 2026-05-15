# Design Walkthrough — Auth Integration (Spec 25)

End-to-end walkthrough showing what the developer writes, what Vex generates, and how the pieces connect.

---

## 1 — The developer's `vex.config.ts`

```ts
// apps/www/src/vex.config.ts
import { defineConfig } from "@vexcms/core"
import { betterAuthAdapter } from "@vexcms/better-auth"
import { posts } from "~/vexcms/collections"
import { auth } from "~/auth/server"   // the betterAuth() instance

export default defineConfig({
  admin: { sidebar: { side: "right" } },
  collections: [posts],
  auth: betterAuthAdapter(auth.options),
})
```

**What happens:**
1. `betterAuthAdapter(auth.options)` calls `getAuthTables(auth.options)` internally.
2. Each Better Auth table (user, session, account, verification) becomes a `CollectionConfig`.
3. `defineConfig` merges `auth.collections` before `collections`, so user-defined overrides win.
4. The CLI's schema generator sees 5 collections (4 auth + 1 user) and emits them all into `convex/vex.schema.ts`.

---

## 2 — Auth collections in the admin panel

After `vex generate`, the admin sidebar shows:

```
Posts          ← user-defined
Users          ← from better-auth (editable name, email, role)
Sessions       ← from better-auth (all fields read-only)
Accounts       ← from better-auth (all fields read-only)
Verifications  ← from better-auth (all fields read-only)
```

The **Users** collection is editable for admins: `name`, `email`, `image`, `role`, `banned`. System fields (`emailVerified`, `createdAt`, `updatedAt`) are greyed out.

The **Sessions** collection is fully read-only: it shows who is logged in, from which IP, when the session expires. Admins can view and delete sessions (delete is a standard collection action) but cannot edit session fields.

---

## 3 — Gating the admin routes

The developer's `page.tsx` is the gatekeeper:

```ts
// apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx
import { NextAdminPage } from "@vexcms/next/server"
import { getSession } from "~/auth/serverUtils"
import { redirect } from "next/navigation"
import config from "~/vex.config"

export const dynamic = "force-dynamic"

export default async function AdminPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  const session = await getSession()
  if (!session) {
    redirect("/auth/sign-in?callbackUrl=/admin")
  }
  return <NextAdminPage config={config} params={params} />
}
```

**Why not Next.js middleware?** Middleware runs on the Edge runtime. Better Auth's session validation requires the Convex client (`fetchQuery`), which is Node.js-only. The server component in `page.tsx` is the natural place for this check — it has full access to `cookies()`, `fetchQuery`, and `redirect()`.

---

## 4 — User info in the admin shell

The layout passes the resolved user into the admin shell:

```ts
// apps/www/src/app/(vexcms)/admin/layout.tsx
import { NextAdminLayout } from "@vexcms/next/client"
import { getCurrentUser } from "~/auth/serverUtils"
import config from "~/vex.config"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  return (
    <NextAdminLayout config={config} user={user ?? undefined}>
      {children}
    </NextAdminLayout>
  )
}
```

The sidebar's user dropdown shows the avatar, name, and email. A "Sign out" link calls `authClient.signOut()` (provided by the host app via a client component wrapper).

---

## 5 — Layering diagram

```
┌─────────────────────────────────────────────────────────────┐
│  apps/www                                                   │
│  ├─ page.tsx          → "Open Admin Panel" or sign-in link │
│  ├─ admin/page.tsx    → getSession() → redirect if missing  │
│  ├─ admin/layout.tsx  → getCurrentUser() → NextAdminLayout │
│  └─ auth/server.ts    → betterAuth({ database: convex… })   │
├─────────────────────────────────────────────────────────────┤
│  @vexcms/next                                               │
│  ├─ NextAdminPage     → (no auth changes — gating is user)  │
│  └─ NextAdminLayout   → forwards user → AdminLayout           │
├─────────────────────────────────────────────────────────────┤
│  @vexcms/react                                              │
│  ├─ AdminLayout       → receives user, renders sidebar       │
│  └─ AppSidebar        → nav-user shows avatar + sign-out     │
├─────────────────────────────────────────────────────────────┤
│  @vexcms/core                                               │
│  ├─ defineConfig      → merges auth.collections              │
│  └─ VexAuthAdapter    → { name, collections }               │
├─────────────────────────────────────────────────────────────┤
│  @vexcms/better-auth                                        │
│  └─ betterAuthAdapter → getAuthTables() → CollectionConfig[] │
├─────────────────────────────────────────────────────────────┤
│  better-auth / better-auth/db                               │
│  └─ getAuthTables()   → introspects plugin schema            │
└─────────────────────────────────────────────────────────────┘
```

---

## 6 — Overriding an auth collection

If the developer wants to add a `bio` field to the user collection:

```ts
// apps/www/src/vexcms/collections/users.ts
import { defineCollection, text } from "@vexcms/next"

export const users = defineCollection({
  slug: "users",
  fields: {
    bio: text(),
  },
})
```

```ts
// apps/www/src/vex.config.ts
export default defineConfig({
  auth: betterAuthAdapter(auth.options),
  collections: [posts, users],   // ← users overrides the auth user collection
})
```

**What happens:**
1. `betterAuthAdapter` emits a `users` collection with Better Auth fields.
2. The developer's `users` collection also has slug `"users"`.
3. `defineConfig` places auth collections first, then user collections.
4. Both share the same Convex table slug (`"users"`), so the schema generator emits a single table.
5. The **developer's** `users` collection config wins for admin UI purposes — the `bio` field appears in the edit form.
6. The **auth adapter's** fields are still present in the schema — `email`, `name`, `role` etc. are in the database.

**Limitation:** If the developer's override omits a field the adapter included (e.g. `emailVerified`), that field still exists in the DB but won't appear in the admin form. This is intentional — the developer controls the admin-visible shape.

---

## 7 — Type narrowing example

```ts
// After `vex generate`, CollectionSlug is "posts" | "users" | "sessions" | "accounts" | "verifications"

// Valid — "users" is a known collection
const userDoc = await vex.get({ collection: "users" as CollectionSlug, id: userId })

// Invalid — typo in slug
const bad = await vex.get({ collection: "user" as CollectionSlug, id })   // Type error
```

Auth collection slugs participate in the same module-augmented `CollectionSlug` union as user-defined collections. No special handling needed.

---

## Decisions Reference

### D1 — Collection factory instead of schema-table extractor

The old approach (Specs 12/13) returned raw `AuthTableDefinition` objects with validator strings (`"v.string()"`). The schema generator had special logic to merge these alongside regular collections. This created a parallel type system: auth tables used validator strings, user collections used field builders.

The collection factory approach unifies both under `CollectionConfig`. Auth tables and user tables both use `text()`, `relationship()`, etc. The schema generator processes them identically. The only difference is provenance: auth collections are generated from Better Auth's schema, user collections are hand-written.

**Trade-off:** We lose the ability to auto-generate Convex indexes from Better Auth's `unique`/`index` field attributes (those become `index?: string` on Vex fields, which the schema generator already handles). This is acceptable — auth indexes are a future enhancement.

### D2 — Read-only by default on system fields

Better Auth tables contain internal state (`createdAt`, `token`, `accessToken`, `ipAddress`). Letting admins edit these directly would corrupt auth state. Marking them `readOnly` by default prevents accidental edits while still exposing the data for viewing and auditing.

User-editable fields (`name`, `email`, `role`) are the exception. These are the fields an admin would reasonably want to update.

### D3 — Config-time merge

Merging at `defineConfig()` time (rather than during schema generation) means:
- The admin panel's `config.collections` already includes auth collections — no special lookup needed.
- User overrides are resolved early — the final `VexConfig` is the single source of truth.
- Schema generation, type generation, and API generation all see the same merged list.

### D4 — Server-component redirect over middleware

Next.js middleware runs on the Edge runtime. `better-auth`'s session validation requires `fetchQuery` from `convex/nextjs`, which is Node.js-only. Moving the gate into the server component lets us use the existing `getSession()` helper without Edge runtime constraints.

The trade-off is that unauthenticated requests still reach the Next.js server (they're redirected there, not at the CDN edge). This is fine for a CMS admin panel — it doesn't need edge-level DDoS protection.

### D5 — User-provided session check

`NextAdminPage` does not import `getSession` directly. It accepts an already-resolved session (or the user's `page.tsx` handles the check). This keeps `@vexcms/next` agnostic of the auth provider. The same `NextAdminPage` works with Better Auth, Clerk, or a custom JWT setup — the user's `page.tsx` is the only auth-specific file.

### D6 — No RBAC in this spec

Any authenticated user can access admin. This is a deliberate simplification:
- The project already has `defineAccess` / `hasPermission` (Spec 16/18) but the developer deferred wiring them into auth.
- Adding RBAC now would require updating `getSession` to return roles, modifying the gate to check roles, and handling the "first user becomes admin" flow. That's a second spec.
- The current gate is "signed in = admin access". This is sufficient for single-user or small-team setups.

### D7 — Delegated sign-in UI

`@daveyplate/better-auth-ui` already provides sign-in/sign-up forms, social provider buttons, and email verification UI. Re-implementing these inside `@vexcms/react` would duplicate effort and create a worse UX (the dedicated auth UI package is polished). The admin shell only needs a "sign out" link, which is a thin wrapper around `authClient.signOut()`.

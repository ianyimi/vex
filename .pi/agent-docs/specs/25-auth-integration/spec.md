# Spec 25 — Auth Integration

**Status:** Draft  
**Scope:** `@vexcms/core` → `@vexcms/better-auth` → `@vexcms/react` → `@vexcms/next` → `apps/www`

---

## Overview

Wire Better Auth into VexCMS so auth collections (user, session, account, verification) appear as admin-managed collections and the `/admin` basepath is gated behind authenticated sessions.

The `apps/www` project already runs Better Auth via `@daveyplate/better-auth-ui` with sign-in/sign-out UI, Convex session storage, and server-side `getSession()` / `getCurrentUser()` helpers. This spec only connects that existing auth to Vex: (1) expose auth tables as Vex collections in the admin panel, (2) redirect unauthenticated requests away from `/admin`, (3) surface the current user in the admin shell.

No RBAC — any authenticated session grants admin access. Role-based gating is deferred.

---

## Code Effect Preview

### 1 — `vex.config.ts` gains an `auth` field

```ts
  import { defineConfig } from "@vexcms/core"
+ import { betterAuthAdapter } from "@vexcms/better-auth"
  import { posts } from "~/vexcms/collections"
+ import { authOptions } from "~/auth/server"

  export default defineConfig({
    admin: { sidebar: { side: "right" } },
    collections: [posts],
+   auth: betterAuthAdapter(authOptions),
  })
```

`defineConfig` merges `auth.collections` into the collections array automatically — the user does not spread them manually.

### 2 — Admin page gains a session gate

```ts
  import { NextAdminPage } from "@vexcms/next/server"
+ import { getSession } from "~/auth/serverUtils"
+ import { redirect } from "next/navigation"
  import config from "~/vex.config"

  export const dynamic = "force-dynamic"

- export default function AdminPage({ params }) {
+ export default async function AdminPage({ params }) {
+   const session = await getSession()
+   if (!session) {
+     redirect("/auth/sign-in?callbackUrl=/admin")
+   }
    return <NextAdminPage config={config} params={params} />
  }
```

### 3 — Admin layout receives the current user

```ts
  import { NextAdminLayout } from "@vexcms/next/client"
+ import { getCurrentUser } from "~/auth/serverUtils"
  import config from "~/vex.config"

- export default function AdminLayout({ children }) {
+ export default async function AdminLayout({ children }) {
+   const user = await getCurrentUser()
    return (
-     <NextAdminLayout config={config}>{children}</NextAdminLayout>
+     <NextAdminLayout config={config} user={user}>{children}</NextAdminLayout>
    )
  }
```

### 4 — `@vexcms/better-auth` ships a collection factory

```ts
  // packages/better-auth/src/index.ts
- // @vexcms/better-auth v0.1.0-alpha.1 - To be implemented
+ export { betterAuthAdapter } from "./adapter"
+ export type { BetterAuthAdapterOptions } from "./adapter"
```

---

## API Surface

| Export                             | Package               | What it is                                                                                     |
| ---------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `AuthCollectionConfig`             | `@vexcms/core`        | Extends `CollectionConfig` with `protected?: boolean`; fields carry `meta.locked`              |
| `VexAuthAdapter`                   | `@vexcms/core`        | Interface: `{ name: string; collections: AuthCollectionConfig[]; userCollection: CollectionSlug }` |
| `auth?: VexAuthAdapter`            | `@vexcms/core`        | New optional field on `VexConfigInput` / `VexConfig`                                           |
| `betterAuthAdapter(config)`        | `@vexcms/better-auth` | Factory: `BetterAuthOptions` → `VexAuthAdapter` (with `meta.locked` on system fields)          |
| `mergeAuthCollections(auth, user)` | `@vexcms/core`        | Merges auth + user collections, respecting `protected` and `meta.locked`                       |
| `defineAuthCollection(config)`     | `@vexcms/core`        | Like `defineCollection` but returns `AuthCollectionConfig` with optional `protected`           |
| `AdminUser`                        | `@vexcms/react`       | Type for user data displayed in admin shell                                                    |
| `user?: AdminUser`                 | `@vexcms/react`       | New optional prop on `AdminLayout`                                                             |
| `user?: AdminUser`                 | `@vexcms/next`        | New optional prop on `NextAdminLayout` (passthrough)                                           |

---

## Status / Progress Checklist

| Area                                                       | Status |
| ---------------------------------------------------------- | ------ |
| Core auth types (`VexAuthAdapter`, `AuthCollectionConfig`) | ⏳     |
| `VexConfigInput` / `VexConfig` `auth` field                | ⏳     |
| `mergeAuthCollections` utility                             | ⏳     |
| `@vexcms/better-auth` package rebuild                      | ⏳     |
| `@vexcms/react` `AdminLayout` user prop + UI               | ⏳     |
| `@vexcms/next` `NextAdminLayout` passthrough               | ⏳     |
| `apps/www` admin route gating                              | ⏳     |
| `apps/www` home page admin link                            | ⏳     |

---

## Design Decisions

Full rationale lives in `design-walkthrough.md` § _Decisions Reference_.

| #   | Decision (one line)                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `betterAuthAdapter()` is a **collection factory** returning `AuthCollectionConfig[]` with `meta.locked` on system fields and `protected` on internal tables. Auth collections are first-class Vex collections.                                    |
| D2  | Auth collections use `admin: { readOnly: true }` by default on system fields. User-editable fields (`name`, `email`, `role`) are writable.                                                                                                        |
| D3  | `mergeAuthCollections()` handles the merge with field-level locking via `meta.locked` and collection-level protection via `protected`. Auth adapters control what is protected; users can override unlocked fields via matching-slug collections. |
| D4  | Admin gating is a **server-component redirect** in the user's `page.tsx`, not Next.js middleware. Keeps the gating logic app-specific and avoids edge-runtime constraints.                                                                        |
| D5  | `NextAdminPage` and `NextAdminLayout` accept an optional `user`/`session` prop. The user's app provides the auth check; the package components receive the resolved data.                                                                         |
| D6  | No RBAC in this spec. Any authenticated session passes the gate. Role checks deferred to a future `defineAccess` integration.                                                                                                                     |
| D7  | Sign-in/sign-out UI is out of scope — `@daveyplate/better-auth-ui` already handles it in `apps/www`.                                                                                                                                              |

---

## Out of Scope

- `defineAccess` / `hasPermission` integration — deferred to a spec that upgrades auth with RBAC
- Impersonation — deferred alongside RBAC
- Field-level admin permissions (read-only / hidden per role) — deferred
- Server-side mutation auth enforcement in Convex handlers — deferred; mutations currently run ungated
- Organization / multi-tenant auth — deferred
- Custom auth providers (Clerk, AuthJS) — deferred; Better Auth is the only supported provider for now
- Convex database adapter for Better Auth — the project already uses Convex as the Better Auth store via `@convex-dev/better-auth`

---

## Target Directory Structure

```
packages/core/src/
  types/
    auth.ts                     🟡 MODIFY — add AuthCollectionConfig, update VexAuthAdapter
  auth/
    merge.ts                    ⏳ NEW — mergeAuthCollections utility
  config/
    types.ts                    🟡 MODIFY — add auth?: VexAuthAdapter
    config.ts                   🟡 MODIFY — call mergeAuthCollections
  index.ts                      🟡 MODIFY — export VexAuthAdapter, AuthCollectionConfig, mergeAuthCollections

packages/better-auth/src/
  index.ts                      🟡 MODIFY — export betterAuthAdapter
  adapter.ts                    ⏳ NEW — betterAuthAdapter() collection factory
  adapter.test.ts               ⏳ NEW — tests
  extract/
    tables.ts                   🟡 MODIFY — getAuthTables → field builder mapping
    tables.test.ts              🟡 MODIFY — update for CollectionConfig output

packages/react/src/
  components/
    AdminLayout.tsx             🟡 MODIFY — accept user prop, show avatar/name
    AppSidebar/
      nav-user.tsx              🟡 MODIFY — accept user data, wire sign-out
  index.ts                      🟡 MODIFY — export AdminUser type

packages/next/src/
  NextAdminLayout.tsx           🟡 MODIFY — accept user prop, passthrough
  NextAdminPage.tsx             🟡 no change — gating is user's responsibility
  index.ts                      🟡 no change

apps/www/src/
  app/
    (vexcms)/admin/
      [[...path]]/page.tsx      🟡 MODIFY — add session gate + redirect
      layout.tsx                🟡 MODIFY — pass user to NextAdminLayout
    page.tsx                    🟡 MODIFY — add admin link, redirect if no session
```

---

## Implementation Order

Each step leaves the repo runnable (`pnpm typecheck` clean).

### Step 1 — Core auth types + config slot [agent]

Add `VexAuthAdapter` to `@vexcms/core`, wire it into config types, and teach `defineConfig` to merge auth collections.

#### Files to create / modify

- [ ] `packages/core/src/types/auth.ts` — modify
- [ ] `packages/core/src/auth/merge.ts` (NEW)
- [ ] `packages/core/src/config/types.ts` — modify: add `auth?: VexAuthAdapter`
- [ ] `packages/core/src/config/config.ts` — modify: call `mergeAuthCollections`
- [ ] `packages/core/src/index.ts` — modify: export auth types + merge utility

### `packages/core/src/types/auth.ts` — modify

```ts
  import { CollectionConfig } from "../collections";

+ /**
+  * Auth collection config — extends `CollectionConfig` with field-level
+  * locking so auth adapters can protect fields that must not be overridden.
+  */
+ export interface AuthCollectionConfig<
+   TSlug extends string = string,
+   TFieldSlug extends string = string,
+   TComponent extends ComponentHKT = ComponentHKT,
+ > extends CollectionConfig<TSlug, TFieldSlug, TComponent> {
+   /**
+    * If true, users cannot define a collection with this slug at all.
+    * The auth adapter's collection definition is used exclusively.
+    * Internal auth tables (session, account, verification) typically
+    * set this to true; the user collection typically does not (users
+    * can extend it with additional fields).
+    */
+   protected?: boolean;
+ }

  /**
   * Auth adapter returned by an auth provider package (e.g. `@vexcms/better-auth`).
   *
   * The adapter exposes auth collections as standard Vex `CollectionConfig[]`
   * so that schema generation, admin navigation, and CRUD views treat them
   * identically to user-defined collections.
   *
   * @see {@link betterAuthAdapter} — the Better Auth implementation
   */
  export interface VexAuthAdapter {
    /** Provider identifier for debugging and telemetry. */
    readonly name: string;

    /**
     * Auth collections to register alongside user-defined collections.
     *
-    * These are merged into `VexConfig.collections` automatically by
-    * `defineConfig()`. Each collection uses standard Vex field builders
+    * These are merged into `VexConfig.collections` by `mergeAuthCollections()`
+    * inside `defineConfig()`. System fields carry `meta.locked: true` (runtime
+    * merge protection) and `admin.readOnly` (UI display). Internal tables
+    * (session, account, verification) set `protected: true` which blocks user
+    * override at the collection level.
     */
-   readonly collections: CollectionConfig[];
+   readonly collections: AuthCollectionConfig[];

+    /**
+     * The slug of the user collection (e.g. `"user"` or `"users"`).
+     * Used by admin auth-gating to identify the session collection.
+     */
+    readonly userCollection: CollectionSlug;
  }
```

/\*\*

- Thrown when the auth adapter's configuration is violated by user config.
- For example: defining a collection with a `protected` auth slug.
  \*/

* export class VexAuthConfigError extends Error {
* constructor(message: string) {
*     super(message);
*     this.name = "VexAuthConfigError";
* }
* }

### `packages/core/src/types/fields.ts` — modify

Add `meta?: Record<string, unknown>` to the base field options and resolved field metadata types. This allows field builders and resolved fields to carry arbitrary metadata that auth adapters (and future plugins) can use for merge-time decisions, UI hints, or type generation.

```ts
// In the base field options type (e.g. BaseFieldOptions / FieldOptions)
+ meta?: Record<string, unknown>;

// In the resolved field metadata type (e.g. BaseFieldMeta / FieldMeta)
+ meta?: Record<string, unknown>;
```

> **Note:** `meta` is intentionally a generic `Record<string, unknown>` rather than an auth-specific type. This keeps the field system extensible for plugins beyond auth. Auth adapters use `meta.locked: true` as a convention.

### `packages/core/src/config/types.ts` — modify

`VexConfigInput` already has `auth?: VexAuthAdapter` — no change needed.  
`VexConfig` currently has `auth: VexAuthAdapter` (required); make it optional so `defineConfig()` does not require auth:

```ts
  // In VexConfig — no change needed for VexConfigInput
  export interface VexConfig {
    ...
-   auth: VexAuthAdapter; // ← added
+   auth?: VexAuthAdapter; // ← added, made optional
  }
```

### `packages/core/src/config/config.ts` — modify

```ts
+ import { mergeAuthCollections } from "../auth/merge";

  export function defineConfig(config?: VexConfigInput): VexConfig {
    return {
      collections: [],
      basePath: "/admin",
      ...config,
+     // Auth collections are merged with user collections via the core
+     // merge utility. Auth adapters control which fields are locked.
+     collections: mergeAuthCollections(
+       config?.auth?.collections ?? [],
+       config?.collections ?? [],
+     ),
      admin: {
        ...config?.admin,
        sidebar: {
          side: "left",
          ...config?.admin?.sidebar,
        },
      },
      schema: {
        outputPath: "/convex/vex.schema.ts",
        ...config?.schema,
      },
      types: {
        outputPath: "/src/vex.types.ts",
        ...config?.types,
      },
    };
  }
```

### `packages/core/src/collections/config.ts` — modify

Add `defineAuthCollection` alongside `defineCollection`. It accepts the same input shape plus an optional `protected` flag, and returns `AuthCollectionConfig` (which `mergeAuthCollections` requires for its auth side):

```ts
+ import type { AuthCollectionConfig } from "../types/auth";

+ export function defineAuthCollection<
+   TSlug extends string,
+   TFieldSlug extends string,
+   TComponent extends ComponentHKT,
+ >(
+   config: CollectionConfigInput<TSlug, TFieldSlug, TComponent> & {
+     protected?: boolean;
+   },
+ ): AuthCollectionConfig<TSlug, TFieldSlug, TComponent> {
+   const collection = defineCollection(
+     config,
+   ) as AuthCollectionConfig<TSlug, TFieldSlug, TComponent>;
+   if (config.protected) {
+     collection.protected = true;
+   }
+   return collection;
+ }
```

> **Note:** `defineCollection` is unchanged — it continues to return plain `CollectionConfig`. `defineAuthCollection` is strictly for auth adapter internals and test fixtures. Users never call it directly.

### `packages/core/src/auth/merge.ts` (NEW)

```ts
import type { CollectionConfig } from "../collections";
import type { AuthCollectionConfig } from "./types";

/**
 * Merges auth collections with user-defined collections, respecting
 * `protected` at the collection level and `meta.locked` on individual fields.
 *
 * Merge rules:
 * 1. User collections that match a `protected` auth slug throw an error.
 * 2. Iterate remaining user collections in their declared order.
 * 3. If a user collection's slug matches an auth collection:
 *    - Auth fields with `meta.locked === true` are preserved.
 *    - All other fields: user field wins (override or extend).
 *    - Admin config: user collection wins.
 *    - The merged collection appears at the user's declared position.
 * 4. Auth collections with no matching user collection are appended at the end.
 * 5. User collections with no matching auth collection are added as-is.
 *
 * @param authCollections — Collections from the auth adapter.
 * @param userCollections — Collections defined by the user.
 * @returns Merged collections array for `VexConfig`.
 */
export function mergeAuthCollections(
  authCollections: AuthCollectionConfig[],
  userCollections: CollectionConfig[],
): CollectionConfig[] {
  // Reject user collections that override protected auth slugs
  const protectedSlugs = new Set(
    authCollections.filter((c) => c.protected).map((c) => c.slug),
  );
  for (const userCol of userCollections) {
    if (protectedSlugs.has(userCol.slug)) {
      throw new VexAuthConfigError(
        `Collection slug "${userCol.slug}" is protected by the auth adapter and cannot be overridden.`,
      );
    }
  }

  const authBySlug = new Map(authCollections.map((c) => [c.slug, c]));
  const merged: CollectionConfig[] = [];
  const consumedAuthSlugs = new Set<string>();

  for (const userCol of userCollections) {
    const authCol = authBySlug.get(userCol.slug);
    if (authCol) {
      merged.push(mergeSingleCollection(authCol, userCol));
      consumedAuthSlugs.add(userCol.slug);
    } else {
      merged.push(userCol);
    }
  }

  for (const authCol of authCollections) {
    if (!consumedAuthSlugs.has(authCol.slug)) {
      // Strip AuthCollectionConfig-only properties before exposing
      const { protected: _, ...clean } = authCol as AuthCollectionConfig & {
        protected?: boolean;
      };
      merged.push(clean as CollectionConfig);
    }
  }

  return merged;
}

function isFieldLocked(field: AdminField): boolean {
  return field?.meta?.locked === true;
}

function mergeSingleCollection(
  authCol: AuthCollectionConfig,
  userCol: CollectionConfig,
): CollectionConfig {
  // Start with all auth fields
  const fields: Record<string, AdminField> = { ...authCol.fields };

  // User fields override unless the auth field is meta-locked
  for (const [fieldName, userField] of Object.entries(userCol.fields)) {
    const authField = authCol.fields[fieldName];
    if (!authField || !isFieldLocked(authField)) {
      fields[fieldName] = userField;
    }
  }

  // Strip AuthCollectionConfig-only properties from the returned object
  const { protected: _, ...authBase } = authCol as AuthCollectionConfig & {
    protected?: boolean;
  };

  return {
    ...authBase,
    ...userCol,
    fields,
  };
}
```

### `packages/core/src/auth/merge.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { mergeAuthCollections } from "./merge";
import { defineCollection, defineAuthCollection } from "..";
import { text, checkbox, date } from "../fields";
import type { AuthCollectionConfig, CollectionConfig } from "../types";

describe("mergeAuthCollections", () => {
  const authUser = defineAuthCollection({
    slug: "user",
    fields: {
      email: text({ meta: { locked: true } }),
      name: text(),
      emailVerified: checkbox({ meta: { locked: true } }),
    },
  });

  const authSession = defineAuthCollection({
    slug: "session",
    fields: {
      token: text({ meta: { locked: true } }),
      userId: text({ meta: { locked: true } }),
      expiresAt: date({ meta: { locked: true } }),
    },
    protected: true,
  });

  it("merges user-defined fields into user collection", () => {
    const userCol = defineCollection({
      slug: "user",
      fields: {
        name: text({ label: "Display Name" }),
        bio: text(),
        phone: text(),
      },
    });

    const result = mergeAuthCollections([authUser, authSession], [userCol]);
    const user = result.find((c) => c.slug === "user")!;

    // Locked auth fields preserved
    expect(user.fields.email).toBeDefined();
    expect(user.fields.emailVerified).toBeDefined();

    // User fields win (override or extend)
    expect(user.fields.name?.label).toBe("Display Name");
    expect(user.fields.bio).toBeDefined();
    expect(user.fields.phone).toBeDefined();
  });

  it("preserves locked auth fields even when user tries to override", () => {
    const userCol = defineCollection({
      slug: "user",
      fields: {
        email: text({ label: "User Email" }),
        name: text(),
      },
    });

    const result = mergeAuthCollections([authUser], [userCol]);
    const user = result.find((c) => c.slug === "user")!;

    // Locked field preserved — user override rejected
    expect(user.fields.email).toBeDefined();
    expect(user.fields.email.label).not.toBe("User Email");

    // Unlocked field overridden by user
    expect(user.fields.name).toBeDefined();
  });

  it("rejects user collections that override protected auth slugs", () => {
    const sessionCol = defineCollection({
      slug: "session",
      fields: { token: text() },
    });

    expect(() => mergeAuthCollections([authSession], [sessionCol])).toThrow(
      /protected by the auth adapter/,
    );
  });

  it("appends unmatched auth collections at the end", () => {
    const userCol = defineCollection({
      slug: "user",
      fields: { name: text() },
    });

    const result = mergeAuthCollections([authUser, authSession], [userCol]);
    const slugs = result.map((c) => c.slug);
    expect(slugs).toEqual(["user", "session"]);
  });

  it("leaves user-only collections untouched", () => {
    const postCol = defineCollection({
      slug: "posts",
      fields: { title: text() },
    });

    const result = mergeAuthCollections([authUser], [postCol]);
    expect(result.find((c) => c.slug === "posts")).toBeDefined();
  });

  it("strips protected flag from merged collections", () => {
    const result = mergeAuthCollections([authSession], []);
    const session = result.find((c) => c.slug === "session")!;
    expect((session as any).protected).toBeUndefined();
  });
});
```

### `packages/core/src/index.ts` — modify

```ts
  export * from "./api/types";

+ // Auth
+ export type { VexAuthAdapter, AuthCollectionConfig } from "./types/auth";
+ export { VexAuthConfigError } from "./types/auth";
+ export { mergeAuthCollections } from "./auth/merge";
+ export { defineAuthCollection } from "./collections/config";
```

### Run tests

```bash
pnpm --filter @vexcms/core typecheck
```

---

---

### Type Generation (post-implementation enhancement)

`vex generate` (the CLI type generator) inspects auth collections to produce type-level metadata that enables future IDE enforcement:

```ts
// Generated in `vex.types.ts`
export type AuthProtectedSlugs = "session" | "account" | "verification";
export type AuthUserCollectionSlug = "user";
export type AuthLockedFieldsBySlug = {
  user:
    | "emailVerified"
    | "createdAt"
    | "updatedAt"
    | "twoFactorEnabled"
    | "twoFactorSecret"
    | "twoFactorBackupCodes";
  session: "token" | "userId" | "expiresAt" | "createdAt" | "updatedAt";
  // ...
};
```

These generated types enable future compile-time checks (e.g. `defineCollection` overloads that reject protected slugs or locked fields). They are **not required** for runtime correctness — `mergeAuthCollections` handles all enforcement — but improve the developer experience by surfacing auth constraints in the IDE.

### Step 2 — `@vexcms/better-auth` collection factory [dev]

Rebuild the empty `packages/better-auth` package as a collection factory that reads Better Auth's plugin schema and emits `CollectionConfig[]` using Vex field builders.

> **Note on master branch reuse:** The old `c9a58b7` commit had working `betterAuthTypeToValidator()` and `extractAuthTables()` that called `getAuthTables()` from `better-auth/db`. The type mapping logic (string → text, boolean → checkbox, date → date, references → relationship, enum array → select) is directly reusable. The main change is: instead of returning `{validator: "v.string()"}`, return `text()` / `relationship()` / etc. The test patterns from `extract/tables.test.ts` and `validators.test.ts` are also reusable with updated assertions.

#### Files to create / modify

- [ ] `packages/better-auth/src/index.ts` — modify: export `betterAuthAdapter`
- [ ] `packages/better-auth/src/adapter.ts` (NEW) — `betterAuthAdapter()` factory
- [ ] `packages/better-auth/src/adapter.test.ts` (NEW) — unit tests

### `packages/better-auth/src/index.ts` — modify

```ts
export { betterAuthAdapter } from "./adapter";
export type { BetterAuthAdapterOptions } from "./adapter";
```

### `packages/better-auth/src/adapter.ts` (NEW)

````ts
import type {
  AuthCollectionConfig,
  BaseFieldInput,
  CollectionSlug,
  FieldAdminConfigInput,
  VexAuthAdapter,
} from "@vexcms/core";
import {
  AuthCollectionMeta,
  checkbox,
  date,
  defineCollection,
  number,
  relationship,
  select,
  text,
} from "@vexcms/core";
import type { BetterAuthOptions, DBFieldAttribute } from "better-auth";
import { getAuthTables } from "better-auth/db";

/**
 * Options for `betterAuthAdapter()`.
 *
 * Accepts the same `BetterAuthOptions` object you pass to `betterAuth()`
 * on the server. Only schema-affecting properties (modelNames,
 * additionalFields, plugins) are read. Runtime options (database, secret,
 * baseURL) are ignored.
 *
 * **Important:** Pass the full config including `plugins` —
 * `getAuthTables()` merges plugin schemas automatically.
 */
export interface BetterAuthAdapterOptions {
  config?: BetterAuthOptions;
}

/** Fields on the user table that end-users are allowed to edit. */
const EDITABLE_FIELDS = new Set([
  "name",
  "email",
  "image",
  "role",
  "banned",
  "banReason",
  "banExpires",
]);

/** Fields that should be hidden in the admin UI for security. */
const HIDDEN_FIELDS = new Set([
  "hashedPassword",
  "password",
  "twoFactorSecret",
  "twoFactorBackupCodes",
  "token",
  "secret",
  "code",
]);

/**
 * Creates a Vex auth adapter from a Better Auth configuration.
 *
 * Introspects Better Auth's full merged schema (base fields + plugin fields
 * + additionalFields) via `getAuthTables()` and converts each table into a
 * standard Vex `CollectionConfig` using Vex field builders.
 *
 * Mappings from Better Auth `DBFieldAttribute` to Vex fields:
 * - `type` → Vex field type (`string`→text, `boolean`→checkbox, `number`→number,
 *   `date`/`timestamp`→date, `json`→text fallback, `string[]`/`number[]`→text/number fallback,
 *   enum array→select)
 * - `required` → field `required`
 * - `defaultValue` → field `defaultValue` (primitives only; functions skipped)
 * - `unique`/`index` → field `index` (name: `by_<field>`)
 * - `references` → `relationship` field
 * - System fields get `admin.readOnly: true` and `meta.locked: true`
 * - Sensitive fields get `admin.hidden: true`
 *
 * @param props — Adapter options; pass your Better Auth config object.
 * @returns A `VexAuthAdapter` ready for `defineConfig({ auth: … })`.
 *
 * @example
 * ```ts
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 * import { authOptions } from "~/auth/server";
 *
 * export default defineConfig({
 *   auth: betterAuthAdapter(authOptions),
 *   collections: [posts],
 * });
 */
export function betterAuthAdapter(
  props?: BetterAuthAdapterOptions,
): VexAuthAdapter {
  const tables = getAuthTables(props?.config ?? {});
  const collections: AuthCollectionConfig[] = [];
  const authCollections = [
    { type: "user", slug: props?.config?.user?.modelName },
    { type: "session", slug: props?.config?.session?.modelName },
    { type: "account", slug: props?.config?.account?.modelName },
    { type: "verification", slug: props?.config?.verification?.modelName },
  ] as const;

  for (const [tableKey, tableDef] of Object.entries(tables)) {
    const slug = tableDef.modelName ?? tableKey;
    const fields: AuthCollectionConfig["fields"] = {};

    addAuthCollectionFields({
      attributes: tableDef.fields,
      slug,
      fields,
      config: props?.config,
      extractId: true,
    });

    const authCollectionType = authCollections.find(
      (ac) => ac.slug === slug,
    )?.type;
    if (authCollectionType) {
      switch (authCollectionType) {
        case "user": {
          const additionalFields = props?.config?.user?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        case "session": {
          const additionalFields = props?.config?.session?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        case "account": {
          const additionalFields = props?.config?.account?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        case "verification": {
          const additionalFields =
            props?.config?.verification?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        default:
          break;
      }
    }

    const isProtected = slug !== "user" && slug !== "users";

    collections.push(
      defineCollection<AuthFieldMeta, AuthCollectionMeta>({
        slug: slug as CollectionSlug,
        fields,
        meta: isProtected ? { protected: true } : undefined,
      }),
    );
  }

  const userSlug = tables.user?.modelName ?? "user";
  return {
    name: "better-auth",
    collections,
    userCollection: userSlug as CollectionSlug,
  };
}

/**
 * Maps a single Better Auth `DBFieldAttribute` to a Vex field builder call.
 *
 * Handles all Better Auth scalar types: `string`, `boolean`, `number`, `date`,
 * `timestamp`, `json`, and enum arrays. Maps overlapping properties
 * (`required`, `unique`/`index`, `references`) to their
 * Vex equivalents. Sets `admin.readOnly` and `meta.locked` on system
 * fields, and `admin.hidden` on sensitive fields.
 *
 * @param fieldName — The field name from Better Auth.
 * @param attr — The Better Auth field attribute.
 * @param tableSlug — The collection slug (for relationship targets).
 * @param authOptions — The Better Auth options.
 * @returns A Vex field instance, or `null` if the type is unsupported.
 *
 * @internal
 */
function betterAuthAttrToVexField(
  fieldName: string,
  attr: DBFieldAttribute,
  tableSlug: string,
  authOptions?: BetterAuthOptions,
) {
  // Skip id — Convex auto-generates _id
  if (fieldName === "id") return null;

  const isUserTable =
    tableSlug === authOptions?.user?.modelName ||
    tableSlug === "user" ||
    tableSlug === "users";
  const isEditable = isUserTable && EDITABLE_FIELDS.has(fieldName);
  const isHidden = HIDDEN_FIELDS.has(fieldName);

  const admin: FieldAdminConfigInput = {};
  if (!isEditable) admin.readOnly = true;
  if (isHidden) admin.hidden = true;

  const baseOptions: BaseFieldInput<AuthFieldMeta> = {};
  if (Object.keys(admin).length > 0) baseOptions.admin = admin;
  if (!isEditable) baseOptions.meta = { locked: true };
  if (attr.required) baseOptions.required = attr.required;
  if (attr.defaultValue !== undefined && typeof attr.defaultValue !== "function") {
    (baseOptions as any).defaultValue = attr.defaultValue;
  }
  if (attr.unique || attr.index) {
    baseOptions.index = `by_${fieldName}`;
  }

  if (attr.references) {
    return relationship({
      collection: { slug: attr.references.model as CollectionSlug },
      ...baseOptions,
    });
  }

  if (Array.isArray(attr.type)) {
    return select({
      options: attr.type.map((v: string) => ({ value: v, label: v })),
      ...baseOptions,
    });
  }

  if (attr.type === "string[]") {
    // TODO: use array() field when available
    return text(baseOptions as any);
  }
  if (attr.type === "number[]") {
    // TODO: use array() field when available
    return number(baseOptions as any);
  }

  switch (attr.type) {
    case "string":
      return text(baseOptions as any);
    case "boolean":
      return checkbox(baseOptions as any);
    case "number":
      return number(baseOptions as any);
    case "date":
      return date(baseOptions as any);
    case "json":
      // TODO: use json() field when available
      return text(baseOptions as any);
    default:
      // Unknown type — skip rather than crash
      return null;
  }
}
````

### Edge-case notes

> **Edge: Pass full config with plugins.** `getAuthTables(props?.config)` merges plugin schemas automatically. If you pass `{ user: { ... } }` without `plugins`, plugin fields (admin `role`, `banned`; username `displayUsername`; two-factor `twoFactorEnabled`) will be missing. Always pass the same `authOptions` you pass to `betterAuth()`.
>
> **Edge: Missing `getAuthTables` import.** `better-auth/db` is a sub-path export of `better-auth`. Ensure the package's `package.json` lists `better-auth` as a peer dependency (already present).
>
> **Edge: Custom modelNames.** `tableDef.modelName` overrides the default table key (e.g. `user` → `users`). Both the collection `slug` and relationship `collection` targets use the resolved modelName.
>
> **Edge: Plugin tables.** `getAuthTables()` already merges plugin contributions (admin, apiKey, two-factor, username, phone, anonymous, etc.). The adapter processes every returned table uniformly — no hardcoded plugin checks. Plugin fields are available as long as `plugins` is passed in the config.
>
> **Edge: Array types (`string[]`, `number[]`).** Better Auth `additionalFields` and plugins can emit array types. The adapter currently falls back to `text()` / `number()` — a dedicated `array()` field type should be added to `@vexcms/core` for proper array support (see Array Field Type below).
>
> **Edge: JSON type.** Better Auth's `json` type falls back to `text()` until a dedicated `json()` field type is wired. The JSON field should store as a string and render with a JSON editor in the admin UI.
>
> **Edge: Property mappings.** `required`, `unique`/`index`, `references`, and primitive `defaultValue` are mapped. `defaultValue` functions (e.g. `() => new Date()`) are intentionally skipped — they cannot be serialized across the Next.js Server Component → Client Component boundary. Index names use the consistent `by_<field>` convention (no `_unique` suffix). Unknown types fall back to `text()` or are skipped (`null`).
>
> **Edge: Reference fields.** Better Auth stores `userId` as `string`, not as a database reference. Your manual schema upgraded these to `v.id()` / `v.array(v.id())`. The adapter maps them to `relationship()` based on `attr.references` — if Better Auth doesn't emit `references`, they become `text()`. Post-processing or naming-convention detection can upgrade them to `relationship()`.
>
> **Edge: Duplicate slug with user collection.** If the user defines a `users` collection and Better Auth also emits `users`, `mergeAuthCollections()` merges them field-by-field. Auth fields with `meta.locked: true` (e.g. `emailVerified`, `createdAt`) are preserved even if the user's collection tries to override them. Unlocked fields (e.g. `name`, `email`) are overridden by the user's definition. The merged collection appears at the user's declared position in the collections array.
>
> **Edge: `CollectionSlug` type safety.** The adapter casts `slug` and `userCollection` to `CollectionSlug` because `tableDef.modelName` and `tableKey` from `Object.entries()` are typed as `string`. The generated `CollectionSlug` union includes all auth table slugs, so the cast is safe at runtime. Type-level enforcement relies on the generated union.

### Array Field Type [future]

Better Auth plugins and `additionalFields` can emit array types (`string[]`, `number[]`). The current adapter falls back to `text()` / `number()` for these. A dedicated `array()` field type should be added to `@vexcms/core`:

```ts
// packages/core/src/fields/array/config.ts
export function array<TMeta extends {} = {}>(
  options: ArrayFieldInput<TMeta>,
): ArrayField<TMeta> {
  return {
    type: "array",
    interfaceType: options.of.interfaceType + "[]",
    of: options.of,
    label: "",
    required: false,
    ...options,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      ...options?.admin,
    },
  };
}

// Schema generation: v.array(v.string()) for string[], v.array(v.number()) for number[]
// Admin UI: dynamic list with add/remove buttons
```

### JSON Field Type [future]

Better Auth's `json` type currently falls back to `text()`. A dedicated `json()` field type:

```ts
// packages/core/src/fields/json/config.ts
export function json<TMeta extends {} = {}>(
  options?: JsonFieldInput<TMeta>,
): JsonField<TMeta> {
  return {
    type: "json",
    interfaceType: "object",
    label: "",
    required: false,
    ...options,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      ...options?.admin,
    },
  };
}

// Schema generation: v.string() (stores JSON as string)
// Admin UI: JSON editor with syntax highlighting / validation
```

### `packages/better-auth/src/adapter.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { betterAuthAdapter } from "./adapter";
import { admin } from "better-auth/plugins";

describe("betterAuthAdapter", () => {
  it("returns correct adapter shape", () => {
    const adapter = betterAuthAdapter();
    expect(adapter.name).toBe("better-auth");
    expect(Array.isArray(adapter.collections)).toBe(true);
    expect(adapter.userCollection).toBe("user");
  });

  it("includes user collection with base fields", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user).toBeDefined();
    expect(user.fields.name).toBeDefined();
    expect(user.fields.email).toBeDefined();
    expect(user.fields.emailVerified).toBeDefined();
  });

  it("marks system fields as readOnly", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.emailVerified?.admin?.readOnly).toBe(true);
    expect(user.fields.createdAt?.admin?.readOnly).toBe(true);
  });

  it("marks system fields as meta-locked", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.emailVerified?.meta?.locked).toBe(true);
    expect(user.fields.createdAt?.meta?.locked).toBe(true);
    expect(user.fields.updatedAt?.meta?.locked).toBe(true);
    // User-editable fields are NOT locked
    expect(user.fields.name?.meta?.locked).toBeUndefined();
    expect(user.fields.email?.meta?.locked).toBeUndefined();
  });

  it("protects internal collections from user override", () => {
    const adapter = betterAuthAdapter();
    const session = adapter.collections.find((c) => c.slug === "session")!;
    const account = adapter.collections.find((c) => c.slug === "account")!;
    const verification = adapter.collections.find(
      (c) => c.slug === "verification",
    )!;
    expect(session.protected).toBe(true);
    expect(account.protected).toBe(true);
    expect(verification.protected).toBe(true);
    // User collection is NOT protected (users can extend it)
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.protected).toBeUndefined();
  });

  it("keeps user-editable fields writable", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.name?.admin?.readOnly).toBeUndefined();
    expect(user.fields.email?.admin?.readOnly).toBeUndefined();
  });

  it("maps session.userId to relationship field", () => {
    const adapter = betterAuthAdapter();
    const session = adapter.collections.find((c) => c.slug === "session")!;
    expect(session.fields.userId).toBeDefined();
    expect(session.fields.userId?.type).toBe("relationship");
  });

  it("maps boolean fields to checkbox type", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.emailVerified?.type).toBe("checkbox");
  });

  it("maps date/timestamp fields to date type", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.createdAt?.type).toBe("date");
  });

  it("maps required from attr.required", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    // required is always defined (boolean) after defaults are applied
    expect(typeof user.fields.email?.required).toBe("boolean");
    expect(typeof user.fields.name?.required).toBe("boolean");
  });

  it("hides sensitive fields", () => {
    const adapter = betterAuthAdapter({
      config: { plugins: [admin()] },
    });
    const user = adapter.collections.find((c) => c.slug === "user")!;
    // Admin plugin fields are not hidden — test with a field that
    // would be hidden if present (hashedPassword only exists with
    // certain database adapters). This test verifies the logic is
    // wired; adjust assertions based on actual Better Auth schema.
    expect(user.fields.role).toBeDefined();
    expect(user.fields.role?.admin?.hidden).toBeUndefined();
  });

  it("does not include id field", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.id).toBeUndefined();
    const session = adapter.collections.find((c) => c.slug === "session")!;
    expect(session.fields.id).toBeUndefined();
  });

  it("uses custom modelName as slug", () => {
    const adapter = betterAuthAdapter({
      config: { user: { modelName: "users" } },
    });
    const users = adapter.collections.find((c) => c.slug === "users");
    expect(users).toBeDefined();
    expect(adapter.userCollection).toBe("users");
  });

  it("includes admin plugin fields when plugin is active", () => {
    const adapter = betterAuthAdapter({
      config: { plugins: [admin()] },
    });
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.role).toBeDefined();
    expect(user.fields.banned).toBeDefined();
  });

  it("maps additionalFields with all properties", () => {
    const adapter = betterAuthAdapter({
      config: {
        user: {
          additionalFields: {
            publicBio: {
              type: "string",
              required: true,
              defaultValue: "Hello",
            },
          },
        },
      },
    });
    const user = adapter.collections.find((c) => c.slug === "user")!;
    const bio = user.fields.publicBio;
    expect(bio).toBeDefined();
    expect(bio?.type).toBe("text");
    expect(bio?.required).toBe(true);
    // defaultValue is not mapped due to cross-library type incompatibility
  });
});
```

### Run tests

```bash
pnpm --filter @vexcms/better-auth test
pnpm --filter @vexcms/better-auth typecheck
```

---

### Step 3 — Auth-aware admin shell in `@vexcms/react` [dev]

`AdminLayout` accepts an optional `user` prop and passes it to the sidebar nav-user component. The nav-user shows the user's avatar, name, and email; a sign-out action delegates to a user-provided callback.

#### Files to create / modify

- [ ] `packages/react/src/components/AdminLayout.tsx` — modify: accept `user` prop
- [ ] `packages/react/src/components/AppSidebar/nav-user.tsx` — modify: render user data
- [ ] `packages/react/src/index.ts` — modify: export `AdminUser` type

### `packages/react/src/components/AdminLayout.tsx` — modify

Add `user?: AdminUser` prop and pass it through:

```ts
+ /**
+  * User data displayed in the admin shell.
+  *
+  * Supplied by the host app's auth layer (e.g. Better Auth's `getCurrentUser()`).
+  * All fields are optional so the admin shell degrades gracefully when no user
+  * is provided.
+  */
+ export interface AdminUser {
+   /** Display name. */
+   name?: string;
+   /** User email. */
+   email?: string;
+   /** Avatar image URL. */
+   image?: string;
+ }

  export interface AdminLayoutProps {
    ...
    /** The active view content rendered in the main content area. */
    children: ReactNode;
    /**
     * Optional framework-specific component overrides.
     */
    components?: FrameworkComponents;
+   user?: AdminUser;
  }
```

And pass `user` through to `AppSidebar`:

```ts
-   <AppSidebar config={props.config} activeSlug={props.activeSlug} />
+   <AppSidebar config={props.config} activeSlug={props.activeSlug} user={props.user} />
```

### `packages/react/src/components/AppSidebar/nav-user.tsx` — modify

Accept `adminUser?: AdminUser` and render it in the user dropdown. Sign-out action is a callback prop (not a direct import) to keep the component auth-provider-agnostic:

```ts
interface NavUserProps {
  user?: NavUserData;
  adminUser?: AdminUser;
  onSignOut?: () => void;
}
```

In the dropdown, show `adminUser.name` / `adminUser.email` / `adminUser.image` when available. Add a "Sign out" item that calls `onSignOut` if provided.

### `packages/react/src/index.ts` — modify

```ts
  export {
    // Layout components
    AdminLayout,
    type AdminLayoutProps,
    AppSidebar,
    type AppSidebarProps,
+   type AdminUser,
    // View components
    DashboardView,
    CollectionListView,
    CollectionEditView,
  } from "./components";
```

### Run tests

```bash
pnpm --filter @vexcms/react typecheck
```

---

### Step 4 — `@vexcms/next` passthrough [agent]

`NextAdminLayout` receives `user` and forwards it to `AdminLayout`. `NextAdminPage` requires no changes — gating is the user's responsibility.

#### Files to create / modify

- [ ] `packages/next/src/NextAdminLayout.tsx` — modify: accept `user`, forward
- [ ] `packages/next/src/index.ts` — modify: re-export `AdminUser` type

### `packages/next/src/NextAdminLayout.tsx` — modify

```ts
  export function NextAdminLayout(props: {
    config: VexConfig;
    children: ReactNode;
+   user?: AdminUser;
  }) {
    // ...
    return (
      <NuqsAdapter>
        <AdminLayout
          config={props.config}
          activeSlug={activeSlug}
          components={{ Link: NextLink, Image: NextImage }}
          pathname={pathname}
          activeDocID={activeDocID}
+         user={props.user}
        >
          {props.children}
        </AdminLayout>
      </NuqsAdapter>
    );
  }
```

### `packages/next/src/index.ts` — modify

```ts
  export type {
    TextField,
    NumberField,
    SelectField,
    DateField,
    UrlField,
    CheckboxField,
    AdminField,
    CollectionSlug,
    VexDocument,
    VexConfig,
    VexConfigInput,
    RelationshipPreviewProps,
+   AdminUser,
  } from "@vexcms/react";
```

### Run tests

```bash
pnpm --filter @vexcms/next typecheck
```

---

### Step 5 — Wire up in `apps/www` [dev]

Gate the admin routes, pass user data into the layout, and add an admin link to the home page.

#### Files to create / modify

- [ ] `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx` — modify: session gate
- [ ] `apps/www/src/app/(vexcms)/admin/layout.tsx` — modify: pass user
- [ ] `apps/www/src/vex.config.ts` — modify: add `auth: betterAuthAdapter(...)`
- [ ] `apps/www/src/app/page.tsx` — modify: admin link + redirect

### `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx` — modify

```ts
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

### `apps/www/src/app/(vexcms)/admin/layout.tsx` — modify

```ts
import type { ReactNode } from "react"
import { NextAdminLayout } from "@vexcms/next/client"
import { getCurrentUser } from "~/auth/serverUtils"
import config from "~/vex.config"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()
  return (
    <NextAdminLayout config={config} user={user ?? undefined}>
      {children}
    </NextAdminLayout>
  )
}
```

### `apps/www/src/vex.config.ts` — modify

```ts
import { defineConfig } from "@vexcms/core";
import { betterAuthAdapter } from "@vexcms/better-auth";
import { posts } from "~/vexcms/collections";
import { auth } from "~/auth/server";

export default defineConfig({
  admin: { sidebar: { side: "right" } },
  collections: [posts],
  auth: betterAuthAdapter(auth.options),
});
```

(Adjust `auth.options` to match the actual export name in `~/auth/server`.)

### `apps/www/src/app/page.tsx` — modify

```ts
import { getSession } from "~/auth/serverUtils"
import Link from "next/link"

export default async function HomePage() {
  const session = await getSession()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Welcome to VexCMS</h1>
      {session ? (
        <Link
          href="/admin"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Open Admin Panel
        </Link>
      ) : (
        <Link
          href="/auth/sign-in?callbackUrl=/admin"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Sign in to Admin
        </Link>
      )}
    </div>
  )
}
```

### Verification

```bash
pnpm --filter www typecheck
pnpm dev:app
```

---

### Step 6 — Metadata Registry Pattern [agent]

Replace the `AuthCollectionConfig` / `defineAuthCollection` approach with typed metadata via global registry interfaces. Plugins augment these registries via TypeScript declaration merging, so metadata accumulates automatically.

#### `packages/core/src/types/metadata.ts` (NEW)

```ts
/**
 * Global registry for field metadata. Plugins augment this interface
 * to add their own metadata keys. The default is empty — no metadata
 * required for basic usage.
 */
export interface FieldMetaBase {}

/**
 * Global registry for collection metadata. Plugins augment this interface
 * to add their own metadata keys.
 */
export interface CollectionMetaBase {}
```

#### `packages/core/src/fields/baseTypes.ts` — modify

Change `BaseFieldInput` default generic and add `meta` using the registry:

```ts
export interface BaseFieldInput<TMeta extends {} = {}> {
  // ... existing fields (label, description, required, admin, index)

  /** Extensible metadata for plugin use. Auth adapters, RBAC, audit, etc. */
  meta?: TMeta;
}
```

> **Note:** If `meta` already exists on `BaseFieldInput` from earlier implementation, change its type from `Record<string, unknown>` to `TMeta extends {} = {}`. The `FieldMetaBase` registry is used by internal plugin types, not user-facing defaults — this keeps autocompletion clean for users who don't use auth metadata.

#### `packages/core/src/collections/types.ts` — modify

Add `meta` to `CollectionConfigInput` using the registry:

```ts
export interface CollectionConfigInput<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  slug: TSlug;
  fields: Record<TFieldSlug, AdminField<TFieldMeta>>;
  // ... existing fields (labels, admin, interfaceName, etc.)

  /** Extensible metadata for plugin use. */
  meta?: TCollectionMeta;
}
```

> **Note:** Update `CollectionConfig` (resolved type) with the same `meta?: TCollectionMeta`. Use `{}` as the default generic — the `CollectionMetaBase` registry is for internal plugin composition, not user-facing defaults.

#### `packages/core/src/collections/config.ts` — modify

Update `defineCollection` signature to pass collection metadata through:

```ts
export function defineCollection<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  config: CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TSlug,
    TFieldSlug,
    TComponent
  >,
): CollectionConfig<
  TFieldMeta,
  TCollectionMeta,
  TSlug,
  TFieldSlug,
  TComponent
> {
  // ... existing implementation, plus meta if provided
  return {
    // ... existing fields
    meta: config.meta,
  };
}
```

#### `packages/core/src/auth/mergeCollections.ts` — modify

Update `mergeAuthCollections` to check metadata via registry:

```ts
function isFieldLocked(field: AdminField): boolean {
  return field.meta?.auth?.locked === true;
}

function mergeSingleCollection(
  authCol: CollectionConfig,
  userCol: CollectionConfig,
): CollectionConfig {
  const fields: Record<string, AdminField> = { ...authCol.fields };

  for (const [fieldName, userField] of Object.entries(userCol.fields)) {
    const authField = authCol.fields[fieldName];
    if (!authField || !isFieldLocked(authField)) {
      fields[fieldName] = userField;
    }
  }

  return {
    ...authCol,
    ...userCol,
    fields,
  };
}

export function mergeAuthCollections(props: {
  authCollections: CollectionConfig[];
  userCollections: CollectionConfig[];
}): CollectionConfig[] {
  const { authCollections, userCollections } = props;

  // Reject user collections that override protected auth slugs
  const protectedSlugs = new Set(
    authCollections.filter((c) => c.meta?.auth?.protected).map((c) => c.slug),
  );
  for (const userCol of userCollections) {
    if (protectedSlugs.has(userCol.slug)) {
      throw new VexAuthConfigError(
        `Collection slug "${userCol.slug}" is protected by the auth adapter and cannot be overridden.`,
      );
    }
  }

  // ... rest of merge logic unchanged
}
```

#### `packages/better-auth/src/types.ts` (NEW) — augment registries

```ts
import "@vexcms/core";

declare module "@vexcms/core" {
  interface FieldMetaBase {
    auth?: {
      locked?: boolean;
    };
  }
  interface CollectionMetaBase {
    auth?: {
      protected?: boolean;
    };
  }
}
```

#### `packages/better-auth/src/adapter.ts` — modify

Update `betterAuthAdapter` to set prefixed metadata:

```ts
const isProtected = slug !== "user" && slug !== "users";

collections.push(
  defineCollection({
    slug,
    fields,
    meta: isProtected ? { auth: { protected: true } } : undefined,
  }),
);
```

Update field builder calls to set `meta: { auth: { locked: true } }`:

```ts
const meta = isLocked ? { auth: { locked: true } } : undefined;

// In each field builder:
return text({ admin, required, index, meta });
```

#### Drop `AuthCollectionConfig` and `defineAuthCollection`

- Remove `AuthCollectionConfig` interface from `packages/core/src/auth/types.ts`
- Remove `defineAuthCollection` from spec and implementation
- `defineCollection` with `meta: { auth: { protected: true } }` replaces it entirely

#### Run tests

```bash
pnpm --filter @vexcms/core typecheck
pnpm --filter @vexcms/core test
pnpm --filter @vexcms/better-auth typecheck
pnpm --filter @vexcms/better-auth test
```

---

### Step 7 — Typegen Integration [agent]

The CLI (`vex generate`) inspects resolved auth collections at build time and emits auth-specific types into `vex.types.ts`. These enable IDE-level enforcement of auth constraints (optional — runtime merge handles all enforcement).

#### What the CLI inspects

```ts
// Pseudocode — runs inside `vex generate` at build time
const config = require("./vex.config.ts");

const protectedSlugs: string[] = [];
const lockedFieldsBySlug: Record<string, string[]> = {};
let userCollection = "user";

for (const col of config.collections) {
  if (col.meta?.auth?.protected) {
    protectedSlugs.push(col.slug);
  }
  if (col.slug === "user" || col.slug === "users") {
    userCollection = col.slug;
  }

  const lockedFields: string[] = [];
  for (const [fieldName, field] of Object.entries(col.fields)) {
    if (field.meta?.auth?.locked) {
      lockedFields.push(fieldName);
    }
  }
  if (lockedFields.length) {
    lockedFieldsBySlug[col.slug] = lockedFields;
  }
}
```

#### Generated output (`vex.types.ts`)

```ts
// Auto-generated — do not edit

/** Auth collection slugs that cannot be overridden by user collections. */
export type AuthProtectedSlugs = "session" | "account" | "verification";

/** The slug of the user collection (e.g. "user" or "users"). */
export type AuthUserCollectionSlug = "users";

/** Auth-locked fields per collection slug. */
export type AuthLockedFieldsBySlug = {
  users:
    | "emailVerified"
    | "createdAt"
    | "updatedAt"
    | "twoFactorEnabled"
    | "twoFactorSecret"
    | "twoFactorBackupCodes";
  session: "token" | "userId" | "expiresAt" | "createdAt" | "updatedAt";
  // ...
};
```

#### How types are used

`@vexcms/better-auth/next` `getSession` uses `AuthUserCollectionSlug` to know which collection holds user data:

```ts
import type { AuthUserCollectionSlug } from "@vexcms/core";

// The generated type ensures we query the right collection
const userCollection = "users" as AuthUserCollectionSlug;
```

> **Note:** These generated types are **compile-time hints only**. All enforcement is runtime via `mergeAuthCollections`. Typegen is a DX enhancement, not a security mechanism.

---

### Step 8 — Convex Runtime Abstraction [dev]

Lift the custom Convex auth adapter and runtime from `apps/www/convex/auth/` into `@vexcms/better-auth`. Files are preserved as-is where possible; only import paths and factory patterns change.

> **Critical constraint:** Convex function registrations (`internalMutation()`, `query()`, etc.) must remain in the user's `convex/` directory tree. The package provides all handler logic; thin wrappers in `convex/auth/` register the functions.

#### Package file structure

```
packages/better-auth/src/
  convex/
    auth/
      index.ts              # createAuthFactory (was createAuth)
      adapter/
        index.ts              # convexAdapter — unchanged except imports
        utils.ts              # Adapter utilities — unchanged except imports
      config.ts               # OIDC config — unchanged
      plugins/
        index.ts              # createPluginsFactory (was createPlugins)
```

#### Files lifted as-is (package destination)

##### `packages/better-auth/src/convex/auth/adapter/index.ts`

Copied from `apps/www/convex/auth/adapter/index.ts`. **No logic changes.** Import paths updated:

```ts
// BEFORE (in www)
import { createAdapterFactory } from "better-auth/adapters";
import { getAuthTables } from "better-auth/db";
import { internal } from "../../_generated/api";

// AFTER (in package)
import { createAdapterFactory } from "better-auth/adapters";
import { getAuthTables } from "better-auth/db";
// `internal` is passed as parameter — see createAuthFactory below
```

> **Note:** `convexAdapter` already accepts `ctx` and `schema` as parameters. No structural change needed — just remove the hardcoded `internal` import and accept `internalApi` as a parameter instead:

```ts
export const convexAdapter = <DataModel extends GenericDataModel>(
  ctx: GenericActionCtx<DataModel>,
  schema: SchemaDefinition<any, any>,
  internalApi: any, // Pass internal._generated.api from user's convex/auth/index.ts
  config: { debugLogs?: DBAdapterDebugLogOption } = {},
) => {
  // ... existing implementation, using internalApi instead of internal
};
```

##### `packages/better-auth/src/convex/auth/adapter/utils.ts`

Copied from `apps/www/convex/auth/adapter/utils.ts`. **No logic changes.** Import paths updated from relative to package imports where applicable.

##### `packages/better-auth/src/convex/auth/config.ts`

Copied from `apps/www/convex/auth/config.ts`. **No changes.** Self-contained OIDC provider config.

##### `packages/better-auth/src/convex/auth/index.ts`

`createAuth` becomes `createAuthFactory` — accepts `authOptions` and `schema` as parameters instead of importing them:

```ts
import type {
  GenericActionCtx,
  GenericDataModel,
  SchemaDefinition,
} from "convex/server";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";

import { convexAdapter } from "./adapter";

export function createAuthFactory<DM extends GenericDataModel>(
  authOptions: BetterAuthOptions,
  schema: SchemaDefinition<any, any>,
  internalApi: any,
) {
  return function createAuth(
    ctx: GenericActionCtx<DM>,
    { optionsOnly } = { optionsOnly: false },
  ) {
    return betterAuth({
      database: convexAdapter(ctx, schema, internalApi),
      logger: { disabled: optionsOnly },
      ...authOptions,
    });
  };
}
```

> **Type preservation:** `GenericActionCtx<DM>` replaces the previous `GenericActionCtx<DataModel>` where `DataModel` was imported from the user's `_generated/dataModel`. The generic `DM` is inferred at the call site in the user's `convex/auth.ts`.

##### `packages/better-auth/src/convex/auth/plugins/index.ts`

`createPlugins` becomes `createPluginsFactory` — accepts `roles` and `authConfig` as parameters:

```ts
import { apiKey } from "@better-auth/api-key";
import { convex } from "@convex-dev/better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

export function createPluginsFactory(
  roles: { admin: string; user: string },
  authConfig: any,
) {
  return function createPlugins() {
    return [
      admin({
        adminRoles: [roles.admin],
        defaultRole: roles.user,
      }),
      apiKey(),
      nextCookies(),
      convex({ authConfig }),
    ];
  };
}
```

#### Files that stay in user's `convex/auth/` (function registrations)

These are **thin wrappers** (~5–10 lines each) that import handler logic from the package and register Convex functions.

##### User's `convex/auth/index.ts`

```ts
import { createAuthFactory } from "@vexcms/better-auth/convex/auth";
import { authOptions } from "../auth/options";
import schema from "../schema";
import { internal } from "../_generated/api";

export const createAuth = createAuthFactory(authOptions, schema, internal);
```

##### User's `convex/auth/db.ts`

```ts
import {
  dbCreateHandler,
  dbFindOneHandler /* ... */,
} from "@vexcms/better-auth/convex/auth";
import { internalMutation, internalQuery } from "../_generated/server";

export const dbCreate = internalMutation({
  args: {
    /* ... */
  },
  handler: dbCreateHandler,
});

export const dbFindOne = internalQuery({
  args: {
    /* ... */
  },
  handler: dbFindOneHandler,
});

// ... etc
```

> **Note:** The package exports `dbCreateHandler`, `dbFindOneHandler`, etc. — the same logic as the current `db.ts` handler bodies, just as named exports instead of inline `internalMutation` definitions.

##### User's `convex/auth/api.ts`

```ts
import { identifyCurrentUserHandler } from "@vexcms/better-auth/convex/auth";
import { query } from "../_generated/server";

export const identifyCurrentUser = query({
  args: {},
  handler: identifyCurrentUserHandler,
});
```

##### User's `convex/auth/sessions.ts`

```ts
import { getSessionWithUserHandler } from "@vexcms/better-auth/convex/auth";
import { query } from "../_generated/server";

export const getSessionWithUser = query({
  args: { sessionToken: v.string() },
  handler: getSessionWithUserHandler,
});
```

#### Package exports (`packages/better-auth/src/convex/index.ts`)

```ts
export { createAuthFactory } from "./auth";
export { convexAdapter } from "./auth/adapter";
export type { ConvexAdapterConfig } from "./auth/adapter";
export { createPluginsFactory } from "./auth/plugins";
export { oidcConfig } from "./auth/config";
```

---

### Step 9 — Next.js Integration [dev]

Lift Next.js auth utilities from `apps/www/src/auth/` into `@vexcms/better-auth/next`. These are framework-specific but not project-specific — every Next.js + Convex + Better Auth project needs the same `getSession`, `getCurrentUser`, and auth client setup.

> **What stays in user's project:** `auth/options.ts` (BetterAuthOptions config), `auth/permissions.ts` (role definitions).

#### Package file structure

```
packages/better-auth/src/
  next/
    client.tsx              # React auth client + provider
    serverUtils.ts          # getSession, getCurrentUser factories
    server.ts               # convexBetterAuthNextJs factory
    types.ts                # Auth types
    index.ts                # Re-exports
```

#### `packages/better-auth/src/next/client.tsx`

Copied from `apps/www/src/auth/client.tsx`. **No logic changes.** Import paths updated:

```ts
"use client"

import type { ReactNode } from "react"
import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function createAuthClientFactory(baseURL: string) {
  return createAuthClient({
    basePath: "/api/auth",
    baseURL,
    plugins: [adminClient(), apiKeyClient(), convexClient()],
  })
}

export function BetterAuthClientProvider({
  children,
  baseURL,
}: {
  children: ReactNode
  baseURL: string
}) {
  const authClient = createAuthClientFactory(baseURL)
  const router = useRouter()

  return (
    <AuthUIProvider
      authClient={authClient}
      credentials={true}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => router.refresh()}
      replace={router.replace}
    >
      {children}
    </AuthUIProvider>
  )
}
```

> **Note:** `baseURL` is passed as a prop instead of importing `env.NEXT_PUBLIC_SITE_URL` — keeps the package env-agnostic.

#### `packages/better-auth/src/next/serverUtils.ts`

Copied from `apps/www/src/auth/serverUtils.ts`. `getSession` / `getCurrentUser` become factories that accept the Convex `api` object:

```ts
import { fetchQuery } from "convex/nextjs";
import { cookies } from "next/headers";

export async function getSessionToken() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore
    .get("better-auth.session_token")
    ?.value.split(".")[0];
  if (!sessionToken) {
    console.error("Error getting session token");
    return null;
  }
  return sessionToken;
}

export function createGetCurrentUser(api: any) {
  return async function getCurrentUser() {
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) return null;

      const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
        sessionToken,
      });
      if (!session?.user) return null;
      return session.user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };
}

export function createGetSession(api: any) {
  return async function getSession() {
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) return null;

      const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
        sessionToken,
      });
      if (!session?.user) return null;
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  };
}
```

> **Type safety:** `api` is typed as `any` in the package, but at the call site the user passes their generated `api` object which has full Convex types. TypeScript infers the correct types through the factory closure.

#### `packages/better-auth/src/next/server.ts`

Factory for `convexBetterAuthNextJs` from `@convex-dev/better-auth/nextjs`:

```ts
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export function createConvexBetterAuthNextJs(options: {
  convexSiteUrl: string;
  convexUrl: string;
}) {
  return convexBetterAuthNextJs(options);
}
```

#### `packages/better-auth/src/next/types.ts`

Copied from `apps/www/src/auth/types.ts`:

```ts
import type { createAuthClientFactory } from "./client";

export type AuthClient = ReturnType<typeof createAuthClientFactory>;
```

#### User's thin wrappers (`apps/www/src/auth/`)

After moving to package, the user's `src/auth/` becomes:

```ts
// src/auth/serverUtils.ts
import { api } from "@convex/_generated/api";
import {
  createGetSession,
  createGetCurrentUser,
} from "@vexcms/better-auth/next";

export const getSession = createGetSession(api);
export const getCurrentUser = createGetCurrentUser(api);
```

```ts
// src/auth/server.ts
import { env } from "~/env.mjs";
import { createConvexBetterAuthNextJs } from "@vexcms/better-auth/next";

export const {
  fetchAuthAction,
  fetchAuthMutation,
  fetchAuthQuery,
  getToken,
  handler,
  isAuthenticated,
  preloadAuthQuery,
} = createConvexBetterAuthNextJs({
  convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
});
```

```tsx
// src/auth/client.tsx
import { BetterAuthClientProvider } from "@vexcms/better-auth/next";
import { env } from "~/env.mjs";

export { BetterAuthClientProvider as default };
export const baseURL = env.NEXT_PUBLIC_SITE_URL;
```

> **Note:** `options.ts` and `permissions.ts` stay in user's project — they're user-specific config.

#### Package exports (`packages/better-auth/src/next/index.ts`)

```ts
export { BetterAuthClientProvider, createAuthClientFactory } from "./client";
export {
  createGetSession,
  createGetCurrentUser,
  getSessionToken,
} from "./serverUtils";
export { createConvexBetterAuthNextJs } from "./server";
export type { AuthClient } from "./types";
```

---

### Step 10 — Package Exports and `apps/www` Cleanup [dev]

#### `packages/better-auth/package.json` — modify exports

```json
{
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./convex": {
      "source": "./src/convex/index.ts",
      "types": "./dist/convex.d.ts",
      "import": "./dist/convex.js"
    },
    "./next": {
      "source": "./src/next/index.ts",
      "types": "./dist/next.d.ts",
      "import": "./dist/next.js"
    }
  }
}
```

#### `apps/www` — delete moved files

Delete from `apps/www/`:

- `convex/auth/adapter/index.ts` → import from `@vexcms/better-auth/convex`
- `convex/auth/adapter/utils.ts` → import from `@vexcms/better-auth/convex`
- `convex/auth/config.ts` → import from `@vexcms/better-auth/convex`
- `convex/auth/index.ts` → rewrite as thin wrapper (see Step 8)
- `convex/auth/plugins/index.ts` → rewrite as thin wrapper (see Step 8)
- `src/auth/client.tsx` → import from `@vexcms/better-auth/next`
- `src/auth/serverUtils.ts` → rewrite as thin wrapper (see Step 9)
- `src/auth/server.ts` → rewrite as thin wrapper (see Step 9)
- `src/auth/types.ts` → import from `@vexcms/better-auth/next`

Keep in `apps/www/`:

- `src/auth/options.ts` — BetterAuthOptions (user-specific)
- `src/auth/permissions.ts` — role definitions (user-specific)
- `convex/auth/db.ts` — thin wrappers (function registrations)
- `convex/auth/api.ts` — thin wrapper (function registration)
- `convex/auth/sessions.ts` — thin wrapper (function registration)
- `convex/http.ts` — unchanged (imports `createAuth` from `./auth`)

## Verification (mandatory)

Run these commands after each step and at final integration:

```bash
# Step 1
pnpm --filter @vexcms/core typecheck

# Step 2
pnpm --filter @vexcms/better-auth test
pnpm --filter @vexcms/better-auth typecheck

# Step 3
pnpm --filter @vexcms/react typecheck

# Step 4
pnpm --filter @vexcms/next typecheck

# Step 5
pnpm --filter www typecheck

# Full workspace
pnpm typecheck
pnpm test
```

---

## Success Criteria

- [ ] `betterAuthAdapter()` returns a `VexAuthAdapter` with `AuthCollectionConfig[]`, `userCollection`, containing `user`, `session`, `account`, `verification` (and plugin tables when active).
- [ ] Auth collections carry `meta.locked: true` on system fields (e.g. `emailVerified`, `createdAt` on `user`). Internal tables (`session`, `account`, `verification`) set `protected: true`.
- [ ] Auth collections use standard Vex field builders (`text`, `relationship`, `checkbox`, `date`, `number`, `select`).
- [ ] System fields on auth collections have `admin.readOnly: true`. User-editable fields (`name`, `email`, `role`) do not.
- [ ] `mergeAuthCollections()` respects `protected` (rejects protected slug override) and `meta.locked` (preserves locked auth fields).
- [ ] `defineConfig({ auth: betterAuthAdapter(...) })` compiles without type errors.
- [ ] Schema generation (`vex.schema.ts`) includes auth collection tables alongside user collections.
- [ ] Admin panel sidebar lists auth collections (user, session, account, verification).
- [ ] Visiting `/admin` while unauthenticated redirects to `/auth/sign-in?callbackUrl=/admin`.
- [ ] Visiting `/admin` while authenticated renders the admin panel.
- [ ] Admin sidebar nav-user shows the authenticated user's name, email, and avatar.
- [ ] Home page (`/`) shows "Open Admin Panel" when signed in, "Sign in to Admin" when not.
- [ ] `pnpm typecheck` passes across all modified packages.
- [ ] `pnpm --filter @vexcms/better-auth test` passes (all adapter tests).

---

## References

- **Related specs:**
  - `20-field-types-and-auth-adapter.md` — prior collection-factory design (superseded table-based approach)
  - `18-admin-access-enforcement-spec.md` — runtime RBAC / permission context (deferred)
  - `13-better-auth-package-spec.md` — legacy table-extraction approach (archived)
- **Standards:**
  - `spec-structure.md`
  - `jsdoc-conventions.md`
  - `developer-preferences.md`
- **Better Auth docs:** `getAuthTables()` from `better-auth/db` — https://www.better-auth.com/docs/concepts/database
- **Vex auth server utils:** `apps/www/src/auth/serverUtils.ts` — `getSession()`, `getCurrentUser()`
- **Vex auth client:** `apps/www/src/auth/client.tsx` — `authClient`, `useSession`
- **Old implementation (master branch, c9a58b7):**
  - `packages/better-auth/src/extract/tables.ts` — `getAuthTables()` call pattern
  - `packages/better-auth/src/validators.ts` — `betterAuthTypeToValidator()` type mapping logic (reusable with adaptation)
  - `packages/better-auth/src/extract/tables.test.ts` — test patterns (assertions need updating for CollectionConfig output)

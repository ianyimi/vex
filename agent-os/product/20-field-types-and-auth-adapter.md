# Spec 20: New Field Types & @vexcms/better-auth Adapter

**Status:** Not started  
**Depends on:** Current `text` field implementation (reference implementation)  
**Supersedes (auth):** `04-auth-adapter-spec.md` — the auth adapter is now a collection factory, not a session/middleware interface

---

## Overview

Two sequential workstreams:

1. **New field types** — implement `boolean`, `number`, `select`, `date`, `imageUrl`, `password`, `json`, and `relationship` following the pattern in `adding-a-field-type.md`.
2. **`@vexcms/better-auth`** — implement the empty `packages/better-auth` package as a collection factory that builds VexCMS `CollectionConfig[]` from a better-auth instance.

---

## Part 1 — New Field Types

### Design decisions

- `email` and `url` are **not** separate field types. Use `text()` for those.
- `boolean()` (not `checkbox()`) — function name matches the type string.
- `relationship()` (not `reference()`) — points to documents in another VexCMS collection.
- `imageUrl()` is its own type distinct from `text` because it has image preview validation behavior that cannot be derived from a text field option.

### New UI primitives required first

Before building React field components, add these to `packages/react/src/components/ui/`:

| File | Base UI primitive | Used by |
|---|---|---|
| `checkbox.tsx` | `@base-ui/react/checkbox` | `boolean` input |
| `select.tsx` | `@base-ui/react/select` | `select` and `relationship` inputs |
| `textarea.tsx` | `@base-ui/react` or native `<textarea>` | `json` input |

Export from `packages/react/src/components/ui/index.ts`.

### Field definitions

Follow `adding-a-field-type.md` for every field. Specific requirements per field:

---

#### `boolean`

- **Convex validator:** `v.boolean()`
- **Form value type:** `boolean`
- **Default value:** `false`
- **Admin config default:** `width: "half"` (overrides the `"full"` base default — checkboxes look odd full-width)
- **Input:** `<Checkbox>` with label. Label sits to the right of the checkbox.
- **Cell:** Checkmark icon for `true`, dash for `false`.
- **Zod schema:** `z.boolean()`

---

#### `number`

- **Convex validator:** `v.number()`
- **Form value type:** `number`
- **Default value:** `0`
- **Admin config default:** `cellAlignment: "right"`
- **Config options:** `min?: { value: number; error?: string }` and `max?: { value: number; error?: string }` mirroring the text field's `min`/`max` pattern
- **Input:** `<Input type="number" />`
- **Cell:** Right-aligned number string
- **Zod schema:** `z.number()`, with `.min()` / `.max()` applied when configured

---

#### `select`

- **Convex validator:** `v.string()`
- **Form value type:** `string`
- **Default value:** `""`
- **Config options:**
  - `options: (string | { value: string; label: string })[]` — required
  - Config function normalizes all entries to `{ value: string; label: string }[]` in the resolved `SelectField`
- **Input:** `<Select>` populated with the field's options
- **Cell:** The matching option's `label` (not raw value). Falls back to raw value if no match.
- **Zod schema:** `z.string().refine(val => field.options.some(o => o.value === val), "Invalid option")`

---

#### `date`

- **Convex validator:** `v.number()` (Unix millisecond timestamp)
- **Form value type:** `number`
- **Default value:** `0`
- **Input:** `<Input type="datetime-local" />`. Convert between Unix ms timestamp and the ISO local string format on read/write:
  - display: `new Date(timestamp).toISOString().slice(0, 16)`
  - save: `new Date(inputValue).getTime()`
- **Cell:** Formatted date string using `date-fns` (already a dependency). Use `format(new Date(value), "PPp")` or similar.
- **Zod schema:** `z.number()`

---

#### `imageUrl`

- **Convex validator:** `v.string()`
- **Form value type:** `string`
- **Default value:** `""`
- **Input:**
  - `<Input type="url" />` for the URL string
  - On blur: attempt to load the URL as an `<img>`. If the image fails to load (via `onError`), set a field-level error: `"Image failed to load. Check the URL."` and do not allow saving.
  - Show a live `<img>` preview below the input when the URL is valid and the image loads.
- **Cell:** Small `<img>` thumbnail (`w-8 h-8 object-cover rounded`) or `—` if empty
- **Zod schema:** `z.string().url()` for required, `z.string().url().or(z.literal(""))` for optional

---

#### `password`

- **Convex validator:** `v.string()`
- **Form value type:** `string`
- **Default value:** `""`
- **Admin config defaults:** `readOnly: true` (overrides the `false` base default). Passwords are set via auth library flows, not via the admin panel.
- **Input:** Read-only masked display. Shows `"••••••••"` if value is non-empty, `"Not set"` if empty. Not an editable `<input type="password">` — just a `<p>` or disabled input.
- **Cell:** `"Set"` if value is non-empty, `"—"` if empty.
- **Zod schema:** `z.string()` (no constraints — field is read-only in admin)

---

#### `json`

- **Convex validator:** `v.any()`
- **Form value type:** `unknown` (the parsed JSON value)
- **Default value:** `null`
- **Input:**
  - `<Textarea>` displaying `JSON.stringify(field.state.value, null, 2)` or `""` if null/undefined
  - On change: attempt `JSON.parse(newText)`. If valid, call `field.handleChange(parsed)`. If invalid JSON, show an inline error `"Invalid JSON"` without updating form state.
  - Error is shown inline next to the textarea, not via the standard `FormError` component (since the error comes from parsing, not field meta).
- **Cell:** `JSON.stringify(value)` truncated to 60 chars, or `"—"` if null/undefined
- **Zod schema:** `z.unknown()`

---

#### `relationship`

- **Convex validator:** `v.string()` (stores the document `_id` as a string; future: emit `v.id("tableName")` during schema generation)
- **Form value type:** `string`
- **Default value:** `""`
- **Config options:** `collection: string` — required. The slug of the target VexCMS collection.
- **Input:**
  - `<Select>` populated by a live Convex query:
    ```tsx
    const { data } = useQuery(
      convexQuery(vexConvexApi.list, { collection: fieldDef.collection })
    )
    ```
  - Display label per document: check for `name`, `title`, `label` keys in that order; fall back to `_id`.
  - Shows a loading state while `data` is undefined.
- **Cell:** Render the raw `_id` value truncated (a secondary query to resolve the label is deferred to a future enhancement)
- **Zod schema:** `z.string()`

---

### Implementation order

Build fields in this order (simpler ones first to establish patterns before tackling complex ones):

1. `boolean` — simplest, introduces checkbox UI primitive
2. `number` — straightforward numeric input
3. `select` — introduces Select UI primitive (needed by `relationship`)
4. `date` — timestamp conversion logic
5. `password` — read-only display, non-standard admin defaults
6. `imageUrl` — image preview and load validation
7. `json` — textarea with inline JSON parse validation
8. `relationship` — most complex: live Convex query inside a field input

---

## Part 2 — `@vexcms/better-auth` Collection Factory

### Core concept

The auth adapter is a **collection factory**, not an auth middleware. It takes a better-auth instance, reads which plugins are active from `auth.options.plugins`, and returns `{ collections: CollectionConfig[] }` — standard VexCMS collections built with VexCMS field functions.

No `VexUser` interface. No `getSession`. No middleware. The admin panel renders auth documents exactly like any other collection.

### `VexAuthAdapter` interface

Add to `packages/core/src/auth/types.ts` (new file):

```ts
import type { CollectionConfig } from "../collections/types";

export interface VexAuthAdapter {
  collections: CollectionConfig[];
}
```

### `VexConfigInput` update

Add `auth?: VexAuthAdapter` to `VexConfigInput` in `packages/core/src/config/types.ts`.

Inside `defineConfig()`, automatically merge `auth.collections` into the full collections array so users do not need to spread them manually.

### `@vexcms/better-auth` package

Location: `packages/better-auth/src/`

```
packages/better-auth/src/
  index.ts            — exports betterAuthAdapter()
  collections/
    user.ts           — buildUserCollection(plugins: BetterAuthPlugin[])
    session.ts        — buildSessionCollection(plugins: BetterAuthPlugin[])
    account.ts        — buildAccountCollection()
    verification.ts   — buildVerificationCollection()
    apiKey.ts         — buildApiKeyCollection()   (only if apiKey plugin detected)
```

### Factory function

```ts
import type { VexAuthAdapter } from "@vexcms/core";

export function betterAuthAdapter(auth: { options: { plugins?: { id: string }[] } }): VexAuthAdapter
```

Plugin detection: check `auth.options.plugins?.some(p => p.id === "admin")` etc.

### Collection/field mapping

All read-only system fields use `admin: { readOnly: true }`.

**user** (always)

| field | type |
|---|---|
| `name` | `text()` |
| `email` | `text({ required: true })` |
| `emailVerified` | `boolean({ admin: { readOnly: true } })` |
| `image` | `imageUrl()` |
| `createdAt` | `date({ admin: { readOnly: true } })` |
| `updatedAt` | `date({ admin: { readOnly: true } })` |
| `role` (admin plugin) | `select({ options: ["admin", "user"] })` |
| `banned` (admin plugin) | `boolean()` |
| `banReason` (admin plugin) | `text()` |
| `banExpires` (admin plugin) | `date()` |
| `twoFactorEnabled` (two-factor plugin) | `boolean({ admin: { readOnly: true } })` |
| `username` (username plugin) | `text()` |
| `phoneNumber` (phone-number plugin) | `text()` |
| `phoneNumberVerified` (phone-number plugin) | `boolean({ admin: { readOnly: true } })` |
| `isAnonymous` (anonymous plugin) | `boolean({ admin: { readOnly: true } })` |

**session** (always)

| field | type |
|---|---|
| `expiresAt` | `date({ admin: { readOnly: true } })` |
| `token` | `text({ admin: { readOnly: true } })` |
| `createdAt` | `date({ admin: { readOnly: true } })` |
| `updatedAt` | `date({ admin: { readOnly: true } })` |
| `ipAddress` | `text({ admin: { readOnly: true } })` |
| `userAgent` | `text({ admin: { readOnly: true } })` |
| `userId` | `relationship({ collection: "user", admin: { readOnly: true } })` |
| `impersonatedBy` (admin plugin) | `text({ admin: { readOnly: true } })` |

**account** (always)

| field | type |
|---|---|
| `accountId` | `text({ admin: { readOnly: true } })` |
| `providerId` | `text({ admin: { readOnly: true } })` |
| `userId` | `relationship({ collection: "user", admin: { readOnly: true } })` |
| `accessToken` | `text({ admin: { readOnly: true } })` |
| `refreshToken` | `text({ admin: { readOnly: true } })` |
| `idToken` | `text({ admin: { readOnly: true } })` |
| `accessTokenExpiresAt` | `date({ admin: { readOnly: true } })` |
| `refreshTokenExpiresAt` | `date({ admin: { readOnly: true } })` |
| `scope` | `text({ admin: { readOnly: true } })` |
| `password` | `password()` |
| `createdAt` | `date({ admin: { readOnly: true } })` |
| `updatedAt` | `date({ admin: { readOnly: true } })` |

**verification** (always)

| field | type |
|---|---|
| `identifier` | `text({ admin: { readOnly: true } })` |
| `value` | `text({ admin: { readOnly: true } })` |
| `expiresAt` | `date({ admin: { readOnly: true } })` |
| `createdAt` | `date({ admin: { readOnly: true } })` |
| `updatedAt` | `date({ admin: { readOnly: true } })` |

**apiKey** (only when apiKey plugin active)

| field | type |
|---|---|
| `name` | `text()` |
| `prefix` | `text({ admin: { readOnly: true } })` |
| `start` | `text({ admin: { readOnly: true } })` |
| `key` | `password()` |
| `userId` | `relationship({ collection: "user" })` |
| `enabled` | `boolean()` |
| `rateLimitEnabled` | `boolean()` |
| `rateLimitTimeWindow` | `number({ admin: { readOnly: true } })` |
| `rateLimitMax` | `number()` |
| `requestCount` | `number({ admin: { readOnly: true } })` |
| `remaining` | `number({ admin: { readOnly: true } })` |
| `refillInterval` | `number()` |
| `refillAmount` | `number()` |
| `lastRefillAt` | `date({ admin: { readOnly: true } })` |
| `lastRequest` | `date({ admin: { readOnly: true } })` |
| `expiresAt` | `date()` |
| `permissions` | `text({ admin: { readOnly: true } })` |
| `metadata` | `json()` |
| `createdAt` | `date({ admin: { readOnly: true } })` |
| `updatedAt` | `date({ admin: { readOnly: true } })` |

### Usage in `vex.config.ts`

```ts
import { defineConfig } from "@vexcms/core"
import { betterAuthAdapter } from "@vexcms/better-auth"
import { auth } from "~/convex/auth"  // better-auth instance
import { posts } from "~/vexcms/collections/posts"

export default defineConfig({
  auth: betterAuthAdapter(auth),
  collections: [posts],
})
```

`defineConfig` merges `auth.collections` automatically — user does not spread them.

---

## Full implementation order

1. New UI primitives: `checkbox.tsx`, `select.tsx`, `textarea.tsx`
2. All 8 core field types (see order above)
3. `packages/core/src/auth/types.ts` — `VexAuthAdapter` interface
4. Update `VexConfigInput` and `defineConfig()` to accept and merge `auth.collections`
5. `packages/better-auth/src/` — `betterAuthAdapter()` collection factory
6. Wire up in `apps/www/src/vex.config.ts` — replace stubs, pass real auth instance

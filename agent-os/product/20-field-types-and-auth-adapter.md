# Spec 20: New Field Types & @vexcms/better-auth Adapter

**Status:** In progress — Part 1 partially complete (`checkbox`, `number`, `date` implemented; `select`, `imageUrl`, `password`, `json`, `relationship` remaining). Part 2 not started.  
**Depends on:** Current `text` field implementation (reference implementation)  
**Supersedes (auth):** `04-auth-adapter-spec.md` — the auth adapter is now a collection factory, not a session/middleware interface

---

## Overview

Two sequential workstreams:

1. **New field types** — implement `checkbox`, `number`, `select`, `date`, `imageUrl`, `password`, `json`, and `relationship` following the pattern in `adding-a-field-type.md`.
2. **`@vexcms/better-auth`** — implement the empty `packages/better-auth` package as a collection factory that builds VexCMS `CollectionConfig[]` from a better-auth instance.

---

## Part 1 — New Field Types

### Design decisions

- `email` and `url` are **not** separate field types. Use `text()` for those.
- `checkbox()` (not `boolean()`) — name describes the UI widget, not the data type. The Convex validator is `v.boolean()`, the TypeScript value type is `boolean`, but the field function and type string are both `"checkbox"`.
- `relationship()` (not `reference()`) — points to documents in another VexCMS collection.
- `imageUrl()` is its own type distinct from `text` because it has image preview validation behavior that cannot be derived from a text field option.

### New UI primitives required first

Before building React field components, add these to `packages/react/src/components/ui/`:

| File | Base UI primitive | Used by |
|---|---|---|
| `checkbox.tsx` | `@base-ui/react/checkbox` | `checkbox` input |
| `select.tsx` | `@base-ui/react/select` | `select` and `relationship` inputs |
| `textarea.tsx` | `@base-ui/react` or native `<textarea>` | `json` input |

Export from `packages/react/src/components/ui/index.ts`.

### Field definitions

Follow `adding-a-field-type.md` for every field. Specific requirements per field:

---

#### `checkbox`

- **Convex validator:** `v.boolean()`
- **Form value type:** `boolean`
- **Default value:** `false`
- **Input:** `<Checkbox>` with label. Label sits to the right of the checkbox.
- **Cell:** `"Yes"` for `true`, `"No"` for `false`. Falls back to `—` when undefined.
- **Zod schema:** `z.boolean()`

---

#### `number`

- **Convex validator:** `v.number()`
- **Form value type:** `number`
- **Default value:** `0`
- **Config options:** `min?: { value: number; error?: string }` and `max?: { value: number; error?: string }` mirroring the text field's `min`/`max` pattern
- **Input:** `<Input type="number" />`
- **Cell:** Number string (inherits default `cellAlignment: "left"`)
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
- **Default value:** `undefined`
- **Config options:**
  - `time?: { hidden?: boolean; use12HourFormat?: boolean; timePicker?: { hour: boolean; minute: boolean; second: boolean } }` — time picker configuration. Defaults to `{ hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } }`. Each key is individually overridable.
  - `min?: number` — optional minimum Unix ms timestamp
  - `max?: number` — optional maximum Unix ms timestamp
- **Input:** Custom `<DateTimePicker>` component. Drives `hideTime`, `use12HourFormat`, and `timePicker` props directly from `fieldDef.time`. Also passes `clearable` and `disabled` (when `fieldDef.admin.readOnly`). `modal` is not passed — uses the picker's own default.
- **Cell:** `new Date(value).toLocaleDateString()`. Returns `null` if value is falsy.
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

1. `checkbox` — simplest, introduces checkbox UI primitive
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
| `emailVerified` | `checkbox({ admin: { readOnly: true } })` |
| `image` | `imageUrl()` |
| `createdAt` | `date({ admin: { readOnly: true } })` |
| `updatedAt` | `date({ admin: { readOnly: true } })` |
| `role` (admin plugin) | `select({ options: ["admin", "user"] })` |
| `banned` (admin plugin) | `checkbox()` |
| `banReason` (admin plugin) | `text()` |
| `banExpires` (admin plugin) | `date()` |
| `twoFactorEnabled` (two-factor plugin) | `checkbox({ admin: { readOnly: true } })` |
| `username` (username plugin) | `text()` |
| `phoneNumber` (phone-number plugin) | `text()` |
| `phoneNumberVerified` (phone-number plugin) | `checkbox({ admin: { readOnly: true } })` |
| `isAnonymous` (anonymous plugin) | `checkbox({ admin: { readOnly: true } })` |

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
| `enabled` | `checkbox()` |
| `rateLimitEnabled` | `checkbox()` |
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

---

## Implementation Notes

### Completed (synced 2026-04-11)

**UI primitives:** `checkbox.tsx` and `select.tsx` are implemented. `textarea.tsx` is not yet built.

**`checkbox` field** — Implemented as specced with the following intentional deviations:
- The function name is `checkbox()` and the type string is `"checkbox"` (not `boolean`) — the field type names describe the UI widget, not the data type.
- `admin.width` defaults to `"full"` (not `"half"`). The original spec proposed overriding to "half" but the implementation keeps the base default.
- `CheckboxFieldCell` renders `"Yes"` / `"No"` text (not icons). Simpler, no icon import required.

**`number` field** — Implemented as specced with one deviation:
- `admin.cellAlignment` defaults to `"left"` (not `"right"`). The original spec proposed overriding to "right" but the implementation keeps the base default.

**`date` field** — Implemented with notable deviations from spec:
- `defaultValue` is `undefined` (not `0`). An undefined default means the field starts empty rather than epoch.
- `time` config option is a full config object `{ hidden, use12HourFormat, timePicker }` (not a simple boolean). Defaults are merged in `date()` so every key is always present on `DateField.time`. This allows `DateFieldInput` to drive all `<DateTimePicker>` props directly from `fieldDef.time` without conditional logic.
- `DateField` also accepts optional `min?: number` and `max?: number` timestamp constraints (not in spec).
- Input uses `<DateTimePicker>` component. `modal` prop is not passed. Drives `hideTime`, `use12HourFormat`, and `timePicker` from `fieldDef.time`.
- Cell renders via `new Date(value).toLocaleDateString()` instead of `date-fns`.

### Remaining work
- `select`, `imageUrl`, `password`, `json`, `relationship` field types
- `textarea.tsx` UI primitive
- Part 2: `@vexcms/better-auth` auth adapter (entirely not started)

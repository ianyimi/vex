# @vexcms/better-auth

[Better Auth](https://www.better-auth.com/) adapter for [VEX CMS](https://github.com/ianyimi/vex). Automatically extracts Better Auth's authentication tables and converts them into VEX collection definitions, enabling admin panel management of auth data.

## Installation

```bash
pnpm add @vexcms/better-auth
```

## Usage

```typescript
import { defineConfig } from "@vexcms/core"
import { vexBetterAuth } from "@vexcms/better-auth"

export default defineConfig({
  auth: vexBetterAuth({
    config: {
      user: { modelName: "users" },
      plugins: [admin()],
    },
  }),
  collections: [/* ... */],
})
```

## What It Does

`vexBetterAuth()` takes your Better Auth configuration and:

1. **Extracts auth tables** — Uses Better Auth's `getAuthTables()` to resolve the complete schema including plugin-contributed fields
2. **Converts fields** — Maps Better Auth field types to VEX field types (string → text, boolean → checkbox, references → relationship, etc.)
3. **Configures admin UI** — Sets appropriate field visibility:
   - **Editable**: user name, image, role, ban status
   - **Hidden**: sensitive fields (tokens, secrets, verification values)
   - **Read-only**: everything else
4. **Creates indexes** — Generates database indexes for indexed/unique fields
5. **Groups in sidebar** — All auth collections appear under the "Auth" group

## Supported Auth Tables

| Table | Description |
|-------|-------------|
| `user` | User accounts with profile data |
| `session` | Active sessions with tokens and metadata |
| `account` | OAuth/credential accounts linked to users |
| `verification` | Email verification and password reset tokens |

Plugin-contributed tables (e.g., from `admin()`, `apiKey()`) are automatically included.

## Plugin Support

Better Auth plugins that add fields or tables are fully supported:

```typescript
import { admin } from "better-auth/plugins"

vexBetterAuth({
  config: {
    plugins: [admin()],  // Adds role, banned, banReason fields to user
  },
})
```

## Custom Model Names

Custom `modelName` values are respected and propagated to relationship references:

```typescript
vexBetterAuth({
  config: {
    user: { modelName: "users" },
    session: { modelName: "sessions" },
  },
})
```

## Peer Dependencies

- `@vexcms/core` — Core VEX CMS types
- `better-auth` — Better Auth (>=1.4.9 <1.5.0)

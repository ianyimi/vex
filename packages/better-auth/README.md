# @vexcms/better-auth

[Better Auth](https://www.better-auth.com/) integration for [VEX CMS](https://github.com/ianyimi/vex). Converts Better Auth's user/session/account/verification tables — and any registered plugin's tables — into standard Vex collections, so auth data is manageable through the same admin panel as everything else.

## Installation

```bash
pnpm add @vexcms/better-auth
```

## Two entry points

VexCMS configuration is split into a client-safe `vex.config.ts` and a server-only
`vex.config.server.ts`, and this package mirrors that split:

| Entry point | Where it's imported | What it does |
|---|---|---|
| `@vexcms/better-auth` (root) | `vex.config.server.ts`, Convex functions | `betterAuthAdapter()` — instantiates the live adapter from your real Better Auth options. Re-exports the Convex DB adapter, so it pulls in `convex/server`. **Never import this from client code.** |
| `@vexcms/better-auth/client` | `vex.config.ts` | `betterAuthCollections()` — derives the same collections from a plain-data schema description. No plugin factories, no environment reads, no server SDKs (~1 KB gzip marginal). |

## Usage

Author a client-safe module holding everything about your Better Auth setup that determines
which collections exist and which fields they carry — model names, `user.additionalFields`,
and which plugins are registered:

```ts
// src/auth/schema.ts — no server imports, safe in the browser bundle
import type { BetterAuthSchemaInput } from "@vexcms/better-auth/client";

export const authSchema = {
  user: {
    additionalFields: {
      roles: { type: "string[]", defaultValue: ["user"], required: true },
    },
  },
  plugins: {
    admin: true,
    anonymous: true,
    apiKey: true,
    convex: true,
    organization: { teams: true },
  },
} satisfies BetterAuthSchemaInput;
```

```ts
// vex.config.ts (client)
import { betterAuthCollections } from "@vexcms/better-auth/client";
import { defineConfig } from "@vexcms/core";

import { authSchema } from "./auth/schema";

export default defineConfig({
  authCollections: betterAuthCollections(authSchema),
  collections: [/* ... */],
});
```

Your real Better Auth options spread the same schema module and add everything server-only —
the secret, base URL, and real plugin instances. `plugins` on `authSchema` is a descriptor map
for `betterAuthCollections()`, not plugin instances, so it's dropped by name rather than
shadowed by the override:

```ts
// src/auth/options.ts (server)
import type { BetterAuthOptions } from "better-auth";
import { admin, anonymous, organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { convex } from "@convex-dev/better-auth/plugins";

import { authSchema } from "./schema";

const { plugins: _pluginDescriptors, ...schemaOptions } = authSchema;

export const authOptions: BetterAuthOptions = {
  ...schemaOptions,
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [admin(), anonymous(), apiKey(), convex(), organization({ teams: true })],
};
```

```ts
// vex.config.server.ts (server)
import { betterAuthAdapter } from "@vexcms/better-auth";
import { defineServerConfig } from "@vexcms/core";

import { authOptions } from "./auth/options";

import vexConfig from "./vex.config";

export default defineServerConfig({
  config: vexConfig,
  server: {
    auth: { adapter: betterAuthAdapter({ config: authOptions }) },
  },
});
```

`defineServerConfig` compares the client config's `authCollections` against the live
adapter's `collections` and throws `VexAuthConfigError` naming the first divergence — e.g.
`collection "user" is missing field(s) "phone"` — the moment `authSchema` and `authOptions`
fall out of sync. Registering the adapter (`server.auth`) is optional: omit it for a project
with no auth, or to skip the check.

## What It Does

Both entry points convert Better Auth's schema into Vex collections through the same pipeline:

1. **Resolves the full schema** — `betterAuthAdapter()` runs Better Auth's `getAuthTables()`
   over your real options; `betterAuthCollections()` runs it over plain `{ id, schema }` plugin
   stubs resolved from a committed schema snapshot, so both produce identical collections
2. **Converts fields** — maps Better Auth field types to Vex field types (string → text,
   boolean → checkbox, references → relationship, etc.)
3. **Configures admin UI** — sets field visibility: editable (name, image, role, ban status),
   hidden (tokens, secrets, verification values), read-only (everything else)
4. **Creates indexes** — generates database indexes for indexed/unique fields
5. **Protects system collections** — every auth collection except `user` is `protected`, so a
   user-defined collection can't override its slug

## Supported Auth Tables

| Table | Description |
|-------|-------------|
| `user` | User accounts with profile data |
| `session` | Active sessions with tokens and metadata |
| `account` | OAuth/credential accounts linked to users |
| `verification` | Email verification and password reset tokens |

## Modelled plugins

`betterAuthCollections()` models 11 plugins' schemas directly — `admin`, `anonymous`,
`apiKey`, `convex`, `deviceAuthorization`, `jwt`, `mcp`, `oidcProvider`, `organization`
(`teams` changes which tables exist), `phoneNumber`, `siwe`, `twoFactor`. Each descriptor
accepts `true` or schema-affecting options only (`{ schema: { ... } }` to rename columns or
add fields) — runtime options (roles, mailers, secrets) are rejected by the type, since
accepting them would risk a server callback ending up in the browser bundle.

Naming any other `better-auth/plugins` export in `authSchema.plugins` is a type error pointing
at the fix: read that plugin's `schema` off its real instance on the server, and hand-copy the
plain-data value into `extraSchema`:

```ts
// src/auth/schema.ts
export const authSchema = {
  plugins: { admin: true },
  // `magicLink` isn't modelled — copy its `schema` shape from the real plugin
  // instance rather than importing `better-auth/plugins` here.
  extraSchema: {
    verification: { fields: {} },
  },
} satisfies BetterAuthSchemaInput;
```

`betterAuthAdapter()` (server-side) accepts any registered plugin directly — it instantiates
your real options, so it needs no such list.

## Custom Model Names

Custom `modelName` values are respected and propagated to relationship references:

```ts
export const authSchema = {
  user: { modelName: "users" },
  session: { modelName: "sessions" },
} satisfies BetterAuthSchemaInput;
```

## Keeping the plugin schema snapshot fresh

`betterAuthCollections()` reads plugin schemas from a snapshot committed to this package
(`src/pluginSchemas.generated.ts`), so it never instantiates a real plugin factory.
Regenerate it after a Better Auth upgrade:

```bash
pnpm --filter @vexcms/better-auth gen:auth-schemas
```

`pluginSchemas.test.ts` fails whenever the committed snapshot and the installed `better-auth`
version disagree, and a new upstream plugin fails this package's typecheck via an
exhaustiveness assertion until it's classified as modelled or explicitly routed to
`extraSchema`. Projects consuming this package never run this — it's this package's own
maintenance task.

## Peer Dependencies

- `@vexcms/core` — Core VEX CMS types
- `better-auth` — Better Auth (>=1.6.23 <1.7.0)
- `convex` — Convex backend (>=1.44.0 <2)

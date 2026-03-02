# @vexcms/better-auth Package Spec

Implement the `@vexcms/better-auth` package that exports `vexBetterAuth(config)` — a function accepting a `BetterAuthOptions` config and returning a fully-resolved `VexAuthAdapter` for the required `auth` field on `VexConfigInput`.

**Referenced by**: [12-schema-generation-auth-integration-spec.md](./12-schema-generation-auth-integration-spec.md) — Phase D (Stage 1, Step 3)

**Depends on**: `@vexcms/core` auth types (`VexAuthAdapter`, `AuthTableDefinition`, `AuthFieldDefinition`, `AuthIndexDefinition`) and error types (`VexAuthConfigError`)

**Prerequisite**: Ensure `VexAuthConfigError` is exported from `@vexcms/core`'s main `index.ts`. The class exists in `packages/core/src/errors/index.ts` but may not be re-exported from the package entry point yet. If not, add it before starting this spec.

---

## Design Decisions

1. **Hardcoded plugin contributions** — Admin and apiKey plugins have their fields/tables hardcoded because better-auth's plugin `schema` types don't map cleanly to Convex validators (e.g., admin `role` is `type: "string"` but needs `v.array(v.string())`). Unknown plugins log `console.warn` and are skipped.
2. **`v.id()` for relationships** — All `userId` fields on auth tables use `v.id("<userSlug>")` instead of `v.string()`. This is a deliberate improvement over the test app's manual schema.
3. **`v.float64()` for dates** — Convex stores dates as milliseconds. All better-auth `"date"` type fields map to `v.float64()`.
4. **Runtime options ignored** — `database`, `secret`, `baseURL`, `trustedOrigins`, etc. are accepted in the config type but only schema-affecting properties are read.
5. **No runtime dependency on better-auth** — It's a `peerDependency` used only for types.

## Out of Scope

- Generic plugin schema parsing
- Auth middleware, session management, or any runtime auth logic
- The `by_email` index on the user table (belongs to user collection config or future spec)
- Two-factor, organization, phone-number, or other less-common plugins
- Schema generation (`generateVexSchema`) — that lives in `@vexcms/core` per spec 12
- Shared auth config pattern (single config for both `vexBetterAuth()` and `betterAuth()`)

---

## Target Directory Structure

```
packages/better-auth/
├── src/
│   ├── index.ts                    # vexBetterAuth() factory + re-exports
│   ├── index.test.ts               # integration tests for vexBetterAuth()
│   ├── types.ts                    # TableSlugs, ResolvedContributions
│   ├── validators.ts               # betterAuthTypeToValidator() helper
│   ├── extract/
│   │   ├── index.ts                # re-exports
│   │   ├── userFields.ts           # extractUserFields() + BASE_USER_FIELDS
│   │   ├── userFields.test.ts
│   │   ├── tables.ts               # buildBaseTables()
│   │   ├── tables.test.ts
│   │   ├── plugins.ts              # resolvePluginContributions()
│   │   └── plugins.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## Implementation Order

The build order follows an outside-in approach: set up the package and entry point first so it builds and can be imported, then progressively implement and test each internal function. At every step the package compiles and tests run.

1. Package scaffolding + `pnpm install` → package exists, builds empty
2. Entry point `vexBetterAuth()` + types + hardcoded return → builds, exports function, test app imports it
3. Integration test file → tests run (against hardcoded return)
4. `betterAuthTypeToValidator()` → tested via userFields tests in next step
5. `extractUserFields()` + `BASE_USER_FIELDS` + tests → replace hardcoded userFields in entry point
6. `buildBaseTables()` + tests → replace hardcoded tables in entry point
7. `resolvePluginContributions()` + tests → wire into entry point
8. Update integration tests to cover full pipeline, verify build, update test app

---

## Step 1: Package Scaffolding

- [x] Fill in `packages/better-auth/package.json`
- [x] Fill in `packages/better-auth/tsconfig.json`
- [x] Fill in `packages/better-auth/tsup.config.ts`
- [x] Fill in `packages/better-auth/vitest.config.ts`
- [x] Run `pnpm install` from workspace root
- [x] Verify `pnpm --filter @vexcms/better-auth build` succeeds (empty output is fine)

These files already exist as empty scaffolds. Fill them in.

**File: `packages/better-auth/package.json`**

```json
{
  "name": "@vexcms/better-auth",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "better-auth": "*",
    "@vexcms/core": "workspace:*"
  },
  "devDependencies": {
    "@vexcms/core": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
    "better-auth": "^1.2.0",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

`better-auth` is both a `peerDependency` (consumers must install it) and a `devDependency` (so we can import its types during development). `@vexcms/core` is a peer dep for the `VexAuthAdapter` type.

**File: `packages/better-auth/tsconfig.json`**

```json
{
  "extends": "@vexcms/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**File: `packages/better-auth/tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["better-auth", "@vexcms/core"],
});
```

External `better-auth` and `@vexcms/core` since they're peer dependencies — don't bundle them.

**File: `packages/better-auth/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
```

After filling in these files, run `pnpm install` from the workspace root to link dependencies, then verify the package builds.

---

## Step 2: Entry Point + Types + Hardcoded Return

Set up the public API so the package can be imported and used in `vex.config.ts` immediately. Start with a hardcoded return value — the internals get extracted into separate functions in later steps.

- [x] Create `packages/better-auth/src/types.ts`
- [x] Create `packages/better-auth/src/index.ts` with `vexBetterAuth()` returning hardcoded adapter
- [x] Verify `pnpm --filter @vexcms/better-auth build` succeeds
- [x] Verify `vex.config.ts` in test app compiles with `auth: vexBetterAuth({...})`

**File: `packages/better-auth/src/types.ts`**

Internal types used across the package. Not exported from the public API.

```typescript
import type { AuthFieldDefinition, AuthTableDefinition } from "@vexcms/core";

/**
 * Table slug configuration extracted from BetterAuthOptions.
 * Each value comes from `config.<table>?.modelName ?? "<default>"`.
 */
export interface TableSlugs {
  userSlug: string;
  sessionSlug: string;
  accountSlug: string;
  verificationSlug: string;
}

/**
 * Return type of resolvePluginContributions().
 * Contains the merged user fields and tables after applying all plugin contributions.
 */
export interface ResolvedContributions {
  userFields: Record<string, AuthFieldDefinition>;
  tables: AuthTableDefinition[];
}
```

**File: `packages/better-auth/src/index.ts`**

The entry point. Start with a hardcoded return so the package builds and can be imported. The slug extraction is real — only the user fields and tables are temporary placeholders that get replaced as you implement each extract function.

````typescript
import type { VexAuthAdapter } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import type { TableSlugs } from "./types";

/**
 * Creates a VexAuthAdapter from a BetterAuthOptions config.
 *
 * Accepts the same config object you pass to betterAuth() on the server.
 * Only reads schema-affecting properties (modelNames, additionalFields, plugins).
 * Runtime options (database, secret, baseURL, etc.) are ignored.
 *
 * @example
 * ```ts
 * import { vexBetterAuth } from "@vexcms/better-auth";
 * import { admin } from "better-auth/plugins";
 *
 * export default defineConfig({
 *   auth: vexBetterAuth({
 *     user: { modelName: "users" },
 *     plugins: [admin()],
 *   }),
 *   // ...
 * });
 * ```
 */
export function vexBetterAuth(config: BetterAuthOptions): VexAuthAdapter {
  const slugs: TableSlugs = {
    userSlug: config.user?.modelName ?? "user",
    sessionSlug: config.session?.modelName ?? "session",
    accountSlug: config.account?.modelName ?? "account",
    verificationSlug: config.verification?.modelName ?? "verification",
  };

  // TODO: replace these with extractUserFields(config) in Step 5
  const userFields = {};

  // TODO: replace with buildBaseTables(slugs) in Step 6
  const tables = [];

  // TODO: wire in resolvePluginContributions() in Step 7

  return {
    name: "better-auth",
    userCollection: slugs.userSlug,
    userFields,
    tables,
  };
}
````

After this step, build the package and add `auth: vexBetterAuth({...})` to `apps/test-app/vex.config.ts` to verify the import works and TypeScript compiles. The adapter will have empty fields/tables for now — that's fine.

---

## Step 3: Integration Test Shell

Set up the integration test file now so `pnpm --filter @vexcms/better-auth test` works from this point forward. Start with the tests that can pass against the hardcoded return, then add more tests in Step 8 after all internals are implemented.

- [x] Create `packages/better-auth/src/index.test.ts` with initial tests
- [x] Verify `pnpm --filter @vexcms/better-auth test` runs (some tests will be skipped/failing — that's expected)

**File: `packages/better-auth/src/index.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { vexBetterAuth } from "./index";

describe("vexBetterAuth", () => {
  it("returns correct adapter shape", () => {
    const adapter = vexBetterAuth({});
    expect(adapter.name).toBe("better-auth");
    expect(adapter.userCollection).toBe("user");
    // no extra keys on the adapter
    expect(Object.keys(adapter).sort()).toEqual([
      "name",
      "tables",
      "userCollection",
      "userFields",
    ]);
  });

  it("uses default slugs when no modelNames provided", () => {
    const adapter = vexBetterAuth({});
    expect(adapter.userCollection).toBe("user");
  });

  it("uses custom modelName for userCollection", () => {
    const adapter = vexBetterAuth({
      user: { modelName: "users" },
    });
    expect(adapter.userCollection).toBe("users");
  });

  // These tests are added in Step 8 after all internals are wired up:
  // - minimal config returns 12 user fields and 4 tables
  // - custom modelNames propagate into v.id() references
  // - admin plugin adds user fields and session impersonatedBy
  // - api-key plugin adds apikey table
  // - test app config produces expected adapter
  // - next-cookies plugin has no effect
});
```

At this point: package builds, tests run, slug extraction works. The tests above should all pass against the hardcoded return.

---

## Step 4: `betterAuthTypeToValidator()`

This helper is needed by `extractUserFields()` in the next step. Implement it now so it's ready.

- [ ] Create `packages/better-auth/src/validators.ts`
- [ ] Implement `betterAuthTypeToValidator()`

**File: `packages/better-auth/src/validators.ts`**

```typescript
import { VexAuthConfigError } from "@vexcms/core";

/**
 * Maps a better-auth field type string to a Convex validator string.
 *
 * @param type - The better-auth field type (e.g., "string", "number", "date", "string[]")
 * @param required - Whether the field is required. If false, wraps in v.optional().
 * @returns The Convex validator string (e.g., "v.string()", "v.optional(v.float64())")
 * @throws VexAuthConfigError if the type is not recognized
 */
export function betterAuthTypeToValidator(
  type: string,
  required: boolean,
): string {
  // TODO: implement
  // Map type to inner validator:
  //   "string"   → "v.string()"
  //   "number"   → "v.float64()"
  //   "boolean"  → "v.boolean()"
  //   "date"     → "v.float64()"   (Convex stores dates as milliseconds)
  //   "string[]" → "v.array(v.string())"
  //   "number[]" → "v.array(v.float64())"
  //   unknown    → throw new VexAuthConfigError(`Unknown better-auth field type: "${type}"`)
  //
  // If !required, wrap: `v.optional(${inner})`
  // If required, return inner as-is
  throw new Error("Not implemented");
}
```

**Edge cases:**

- `"date"` maps to `v.float64()`, NOT `v.number()` — Convex convention for timestamps
- Array types (`"string[]"`, `"number[]"`) — the inner type also needs mapping (string→string, number→float64)
- Unknown type string — throw `VexAuthConfigError` with a descriptive message including the type value

No separate test file — this function is tested indirectly through `extractUserFields` tests in the next step (every type mapping is exercised there). If you want to add a direct test file, you can.

---

## Step 5: `extractUserFields()` + `BASE_USER_FIELDS` + Tests

Implement user field extraction and wire it into the entry point.

- [ ] Create `packages/better-auth/src/extract/userFields.ts` with `BASE_USER_FIELDS` constant and `extractUserFields()` function
- [ ] Create `packages/better-auth/src/extract/userFields.test.ts`
- [ ] Update `packages/better-auth/src/index.ts` — replace hardcoded `userFields = {}` with `extractUserFields(config)`
- [ ] Run tests: `pnpm --filter @vexcms/better-auth test`

**File: `packages/better-auth/src/extract/userFields.ts`**

```typescript
import type { AuthFieldDefinition } from "@vexcms/core";
import { VexAuthConfigError } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import { betterAuthTypeToValidator } from "../validators";

/**
 * The base fields that better-auth always creates on the user table.
 * Does NOT include plugin-contributed fields (admin, apiKey, etc.)
 * or user-defined additionalFields.
 */
export const BASE_USER_FIELDS: Record<string, AuthFieldDefinition> = {
  name: { validator: "v.string()" },
  email: { validator: "v.string()" },
  emailVerified: { validator: "v.boolean()" },
  image: { validator: "v.optional(v.string())" },
  username: { validator: "v.optional(v.union(v.null(), v.string()))" },
  displayUsername: { validator: "v.optional(v.union(v.null(), v.string()))" },
  phoneNumber: { validator: "v.optional(v.union(v.null(), v.string()))" },
  phoneNumberVerified: {
    validator: "v.optional(v.union(v.null(), v.boolean()))",
  },
  isAnonymous: { validator: "v.optional(v.union(v.null(), v.boolean()))" },
  twoFactorEnabled: { validator: "v.optional(v.union(v.null(), v.boolean()))" },
  createdAt: { validator: "v.number()" },
  updatedAt: { validator: "v.number()" },
};

/**
 * Extracts all user fields from a BetterAuthOptions config.
 * Starts with BASE_USER_FIELDS, then merges any user.additionalFields
 * from the config. Additional fields override base fields if names collide.
 *
 * @returns Record of field name → AuthFieldDefinition with validator strings
 */
export function extractUserFields(
  config: BetterAuthOptions,
): Record<string, AuthFieldDefinition> {
  // TODO: implement
  // 1. Shallow clone BASE_USER_FIELDS into a new object: { ...BASE_USER_FIELDS }
  // 2. If config.user?.additionalFields exists, iterate Object.entries()
  // 3. For each [fieldName, attr], call betterAuthTypeToValidator(attr.type, attr.required ?? true)
  // 4. Set fields[fieldName] = { validator: result }
  //    → additionalFields with same name as a base field override it
  // 5. Return the merged fields object
  //
  // Edge cases:
  // - No `user` key in config → return base fields only
  // - Empty additionalFields object → return base fields only
  // - additionalField overriding a base field (e.g., overriding "name") → last write wins
  throw new Error("Not implemented");
}
```

Note: `userId` is NOT a base user field. The user table's own ID is Convex's `_id`. The `userId` field on account/session tables references the user table.

**File: `packages/better-auth/src/extract/userFields.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { VexAuthConfigError } from "@vexcms/core";
import { extractUserFields, BASE_USER_FIELDS } from "./userFields";

describe("extractUserFields", () => {
  it("returns 12 base fields when no additionalFields provided", () => {
    const fields = extractUserFields({});
    expect(Object.keys(fields)).toHaveLength(12);
    expect(fields.name).toEqual({ validator: "v.string()" });
    expect(fields.email).toEqual({ validator: "v.string()" });
    expect(fields.emailVerified).toEqual({ validator: "v.boolean()" });
    expect(fields.image).toEqual({ validator: "v.optional(v.string())" });
    expect(fields.createdAt).toEqual({ validator: "v.number()" });
    expect(fields.updatedAt).toEqual({ validator: "v.number()" });
  });

  it("returns base fields when config has user but no additionalFields", () => {
    const fields = extractUserFields({ user: { modelName: "users" } });
    expect(Object.keys(fields)).toHaveLength(12);
  });

  it("merges additionalFields into base fields", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          role: { type: "string[]", defaultValue: ["user"], required: true },
        },
      },
    });
    expect(Object.keys(fields)).toHaveLength(13);
    expect(fields.role).toEqual({ validator: "v.array(v.string())" });
    // base fields still present
    expect(fields.name).toEqual({ validator: "v.string()" });
  });

  it("maps string type with required: true to v.string()", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          bio: { type: "string", required: true },
        },
      },
    });
    expect(fields.bio).toEqual({ validator: "v.string()" });
  });

  it("maps number type with required: true to v.float64()", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          age: { type: "number", required: true },
        },
      },
    });
    expect(fields.age).toEqual({ validator: "v.float64()" });
  });

  it("maps boolean type with required: true to v.boolean()", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          active: { type: "boolean", required: true },
        },
      },
    });
    expect(fields.active).toEqual({ validator: "v.boolean()" });
  });

  it("maps date type with required: true to v.float64()", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          lastLogin: { type: "date", required: true },
        },
      },
    });
    expect(fields.lastLogin).toEqual({ validator: "v.float64()" });
  });

  it("maps string[] type with required: true to v.array(v.string())", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          tags: { type: "string[]", required: true },
        },
      },
    });
    expect(fields.tags).toEqual({ validator: "v.array(v.string())" });
  });

  it("wraps in v.optional() when required is false", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          nickname: { type: "string", required: false },
        },
      },
    });
    expect(fields.nickname).toEqual({ validator: "v.optional(v.string())" });
  });

  it("defaults required to true when not specified", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          bio: { type: "string" },
        },
      },
    });
    expect(fields.bio).toEqual({ validator: "v.string()" });
  });

  it("additionalField with same name as base field overrides it", () => {
    const fields = extractUserFields({
      user: {
        additionalFields: {
          name: { type: "string", required: false },
        },
      },
    });
    // base "name" is v.string(), override makes it optional
    expect(fields.name).toEqual({ validator: "v.optional(v.string())" });
  });

  it("does not mutate BASE_USER_FIELDS", () => {
    const before = { ...BASE_USER_FIELDS };
    extractUserFields({
      user: {
        additionalFields: {
          name: { type: "boolean", required: true },
        },
      },
    });
    expect(BASE_USER_FIELDS).toEqual(before);
  });

  it("throws VexAuthConfigError on unknown type", () => {
    expect(() =>
      extractUserFields({
        user: {
          additionalFields: {
            data: { type: "json" as any, required: true },
          },
        },
      }),
    ).toThrow(VexAuthConfigError);
  });
});
```

**Changes to `packages/better-auth/src/index.ts`** — replace the hardcoded userFields:

```typescript
// ADD import at top
import { extractUserFields } from "./extract/userFields";

// REPLACE inside vexBetterAuth():
//   const userFields = {};
// WITH:
const userFields = extractUserFields(config);
```

After this step: all `userFields.test.ts` tests pass, and the integration test for adapter shape still passes (now with real user fields).

---

## Step 6: `buildBaseTables()` + Tests

Implement table construction and wire it into the entry point.

- [ ] Create `packages/better-auth/src/extract/tables.ts`
- [ ] Create `packages/better-auth/src/extract/tables.test.ts`
- [ ] Update `packages/better-auth/src/index.ts` — replace hardcoded `tables = []` with `buildBaseTables(slugs)`
- [ ] Run tests: `pnpm --filter @vexcms/better-auth test`

**File: `packages/better-auth/src/extract/tables.ts`**

Builds the 4 base auth infrastructure tables. This is a pure data function — no config parsing, just table construction from slugs.

```typescript
import type { AuthTableDefinition } from "@vexcms/core";
import type { TableSlugs } from "../types";

/**
 * Builds the 4 base auth infrastructure tables:
 * account, session, verification, jwks.
 *
 * Uses the provided slugs for table names and v.id() references.
 * The jwks table slug is always "jwks" (not configurable in better-auth).
 */
export function buildBaseTables(slugs: TableSlugs): AuthTableDefinition[] {
  // TODO: implement
  // Return an array of 4 AuthTableDefinition objects.
  // Each has: { slug, fields: Record<string, { validator }>, indexes?: [...] }
  //
  // account table (slug: slugs.accountSlug):
  //   Fields: accountId, userId (v.id("<userSlug>")), providerId,
  //           accessToken (optional), refreshToken (optional), idToken (optional),
  //           password (optional), scope (optional),
  //           accessTokenExpiresAt (optional v.float64()), refreshTokenExpiresAt (optional v.float64()),
  //           createdAt (v.float64()), updatedAt (v.float64())
  //   Indexes: by_userId ["userId"], by_accountId ["accountId"]
  //
  // session table (slug: slugs.sessionSlug):
  //   Fields: token, userId (v.id("<userSlug>")), expiresAt (v.float64()),
  //           ipAddress (optional), userAgent (optional),
  //           createdAt (v.float64()), updatedAt (v.float64())
  //   Indexes: by_token ["token"]
  //
  // verification table (slug: slugs.verificationSlug):
  //   Fields: identifier, value, expiresAt (v.float64()),
  //           createdAt (v.float64()), updatedAt (v.float64())
  //   Indexes: by_identifier ["identifier"], by_expiresAt ["expiresAt"]
  //
  // jwks table (slug: "jwks"):
  //   Fields: publicKey, privateKey (optional), createdAt (v.float64())
  //   No indexes
  //
  // Use template literals for v.id() references: `v.id("${slugs.userSlug}")`
  //
  // Edge cases: none — this is a pure data function with no conditional logic
  throw new Error("Not implemented");
}
```

**File: `packages/better-auth/src/extract/tables.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { buildBaseTables } from "./tables";
import type { TableSlugs } from "../types";

const defaultSlugs: TableSlugs = {
  userSlug: "user",
  sessionSlug: "session",
  accountSlug: "account",
  verificationSlug: "verification",
};

describe("buildBaseTables", () => {
  it("builds exactly 4 tables", () => {
    const tables = buildBaseTables(defaultSlugs);
    expect(tables).toHaveLength(4);
  });

  it("uses correct default slugs", () => {
    const tables = buildBaseTables(defaultSlugs);
    const slugs = tables.map((t) => t.slug).sort();
    expect(slugs).toEqual(["account", "jwks", "session", "verification"]);
  });

  it("uses custom slugs for table names", () => {
    const tables = buildBaseTables({
      userSlug: "users",
      sessionSlug: "sessions",
      accountSlug: "accounts",
      verificationSlug: "verifications",
    });
    const slugs = tables.map((t) => t.slug).sort();
    expect(slugs).toEqual(["accounts", "jwks", "sessions", "verifications"]);
  });

  describe("account table", () => {
    it("has 12 fields", () => {
      const tables = buildBaseTables(defaultSlugs);
      const account = tables.find((t) => t.slug === "account")!;
      expect(Object.keys(account.fields)).toHaveLength(12);
    });

    it("uses v.id() for userId with default slug", () => {
      const tables = buildBaseTables(defaultSlugs);
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.userId).toEqual({ validator: 'v.id("user")' });
    });

    it("uses v.id() for userId with custom slug", () => {
      const tables = buildBaseTables({ ...defaultSlugs, userSlug: "users" });
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.userId).toEqual({ validator: 'v.id("users")' });
    });

    it("has 2 indexes", () => {
      const tables = buildBaseTables(defaultSlugs);
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.indexes).toHaveLength(2);
      expect(account.indexes).toContainEqual({
        name: "by_userId",
        fields: ["userId"],
      });
      expect(account.indexes).toContainEqual({
        name: "by_accountId",
        fields: ["accountId"],
      });
    });

    it("has correct field validators", () => {
      const tables = buildBaseTables(defaultSlugs);
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.accountId).toEqual({ validator: "v.string()" });
      expect(account.fields.providerId).toEqual({ validator: "v.string()" });
      expect(account.fields.accessToken).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(account.fields.refreshToken).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(account.fields.idToken).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(account.fields.password).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(account.fields.scope).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(account.fields.accessTokenExpiresAt).toEqual({
        validator: "v.optional(v.float64())",
      });
      expect(account.fields.refreshTokenExpiresAt).toEqual({
        validator: "v.optional(v.float64())",
      });
      expect(account.fields.createdAt).toEqual({ validator: "v.float64()" });
      expect(account.fields.updatedAt).toEqual({ validator: "v.float64()" });
    });
  });

  describe("session table", () => {
    it("has 7 fields", () => {
      const tables = buildBaseTables(defaultSlugs);
      const session = tables.find((t) => t.slug === "session")!;
      expect(Object.keys(session.fields)).toHaveLength(7);
    });

    it("uses v.id() for userId", () => {
      const tables = buildBaseTables(defaultSlugs);
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.userId).toEqual({ validator: 'v.id("user")' });
    });

    it("has 1 index", () => {
      const tables = buildBaseTables(defaultSlugs);
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.indexes).toHaveLength(1);
      expect(session.indexes).toContainEqual({
        name: "by_token",
        fields: ["token"],
      });
    });

    it("has correct field validators", () => {
      const tables = buildBaseTables(defaultSlugs);
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.token).toEqual({ validator: "v.string()" });
      expect(session.fields.expiresAt).toEqual({ validator: "v.float64()" });
      expect(session.fields.ipAddress).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(session.fields.userAgent).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(session.fields.createdAt).toEqual({ validator: "v.float64()" });
      expect(session.fields.updatedAt).toEqual({ validator: "v.float64()" });
    });
  });

  describe("verification table", () => {
    it("has 5 fields", () => {
      const tables = buildBaseTables(defaultSlugs);
      const verification = tables.find((t) => t.slug === "verification")!;
      expect(Object.keys(verification.fields)).toHaveLength(5);
    });

    it("has 2 indexes", () => {
      const tables = buildBaseTables(defaultSlugs);
      const verification = tables.find((t) => t.slug === "verification")!;
      expect(verification.indexes).toHaveLength(2);
      expect(verification.indexes).toContainEqual({
        name: "by_identifier",
        fields: ["identifier"],
      });
      expect(verification.indexes).toContainEqual({
        name: "by_expiresAt",
        fields: ["expiresAt"],
      });
    });
  });

  describe("jwks table", () => {
    it("always uses 'jwks' slug regardless of config", () => {
      const tables = buildBaseTables({
        ...defaultSlugs,
        userSlug: "custom_users",
      });
      const jwks = tables.find((t) => t.slug === "jwks")!;
      expect(jwks).toBeDefined();
    });

    it("has 3 fields", () => {
      const tables = buildBaseTables(defaultSlugs);
      const jwks = tables.find((t) => t.slug === "jwks")!;
      expect(Object.keys(jwks.fields)).toHaveLength(3);
      expect(jwks.fields.publicKey).toEqual({ validator: "v.string()" });
      expect(jwks.fields.privateKey).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(jwks.fields.createdAt).toEqual({ validator: "v.float64()" });
    });

    it("has no indexes", () => {
      const tables = buildBaseTables(defaultSlugs);
      const jwks = tables.find((t) => t.slug === "jwks")!;
      expect(jwks.indexes ?? []).toHaveLength(0);
    });
  });

  it("propagates custom userSlug into v.id() references", () => {
    const tables = buildBaseTables({ ...defaultSlugs, userSlug: "members" });
    const session = tables.find((t) => t.slug === "session")!;
    const account = tables.find((t) => t.slug === "account")!;
    expect(session.fields.userId).toEqual({ validator: 'v.id("members")' });
    expect(account.fields.userId).toEqual({ validator: 'v.id("members")' });
  });
});
```

**Changes to `packages/better-auth/src/index.ts`** — replace the hardcoded tables:

```typescript
// ADD import at top
import { buildBaseTables } from "./extract/tables";

// REPLACE inside vexBetterAuth():
//   const tables = [];
// WITH:
const tables = buildBaseTables(slugs);
```

After this step: `userFields.test.ts` and `tables.test.ts` all pass. The entry point now returns real user fields AND real tables.

---

## Step 7: `resolvePluginContributions()` + Tests

Implement plugin resolution and wire it into the entry point. This is the last internal function.

- [ ] Create `packages/better-auth/src/extract/plugins.ts`
- [ ] Create `packages/better-auth/src/extract/plugins.test.ts`
- [ ] Update `packages/better-auth/src/index.ts` — add `resolvePluginContributions()` call
- [ ] Run tests: `pnpm --filter @vexcms/better-auth test`

**File: `packages/better-auth/src/extract/plugins.ts`**

Applies hardcoded known-plugin field/table contributions. Does not mutate inputs — returns new objects.

```typescript
import type { AuthFieldDefinition, AuthTableDefinition } from "@vexcms/core";
import { VexAuthConfigError } from "@vexcms/core";
import type { TableSlugs, ResolvedContributions } from "../types";

/**
 * Resolves known better-auth plugin contributions into user fields and tables.
 *
 * Hardcodes contributions for known plugins (admin, api-key, next-cookies).
 * Unknown plugin IDs log a console.warn and are skipped.
 * Plugins missing an `id` property throw VexAuthConfigError.
 * Does NOT mutate the input objects — returns new copies.
 */
export function resolvePluginContributions(
  plugins: any[] | undefined,
  userFields: Record<string, AuthFieldDefinition>,
  tables: AuthTableDefinition[],
  slugs: TableSlugs,
): ResolvedContributions {
  // TODO: implement
  //
  // 1. If plugins is undefined or empty, return { userFields, tables } unchanged
  // 2. Deep clone userFields (spread) and tables (map + spread fields) to avoid mutation
  // 3. Iterate each plugin, read plugin.id
  //    → If plugin has no `id` property, throw new VexAuthConfigError(`Plugin at index ${i} has no "id" property`)
  // 4. Switch on known plugin IDs:
  //
  //    "admin":
  //      Add to user fields:
  //        role:      { validator: "v.array(v.string())" }        ← NOT v.string(), NOT optional
  //        banned:    { validator: "v.optional(v.boolean())" }
  //        banReason: { validator: "v.optional(v.string())" }
  //        banExpires:{ validator: "v.optional(v.float64())" }    ← date → float64
  //      Add to session table fields:
  //        impersonatedBy: { validator: `v.optional(v.id("${slugs.userSlug}"))` }
  //      → Must find the session table by slug (slugs.sessionSlug) in the tables array
  //
  //    "api-key":
  //      Append new table:
  //        slug: "apikey"
  //        fields: name (v.string()), start (v.optional(v.string())),
  //                prefix (v.optional(v.string())), key (v.string()),
  //                userId (v.id("<userSlug>")),
  //                refillInterval (v.optional(v.string())),
  //                refillAmount (v.optional(v.float64())),
  //                lastRefillAt (v.optional(v.float64())),
  //                enabled (v.optional(v.boolean())),
  //                rateLimitEnabled (v.optional(v.boolean())),
  //                rateLimitTimeWindow (v.optional(v.float64())),
  //                rateLimitMax (v.optional(v.float64())),
  //                requestCount (v.optional(v.float64())),
  //                remaining (v.optional(v.float64())),
  //                lastRequest (v.optional(v.float64())),
  //                expiresAt (v.optional(v.float64())),
  //                createdAt (v.float64()), updatedAt (v.float64()),
  //                permissions (v.optional(v.string())),
  //                metadata (v.optional(v.string()))
  //        indexes: by_userId ["userId"], by_key ["key"]
  //
  //    "next-cookies": skip silently (no schema contributions)
  //
  //    unknown: console.warn(`[vexBetterAuth] Unknown plugin "${id}" — schema contributions skipped`)
  //
  // 5. Return { userFields: clonedFields, tables: clonedTables }
  //
  // Edge cases:
  //   - Plugin with no `id` property → throw VexAuthConfigError
  //   - Duplicate plugin IDs → apply both (last write wins for user fields)
  //   - Session table not found in tables array (shouldn't happen with buildBaseTables, but guard)
  throw new Error("Not implemented");
}
```

**File: `packages/better-auth/src/extract/plugins.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { resolvePluginContributions } from "./plugins";
import type { AuthFieldDefinition, AuthTableDefinition } from "@vexcms/core";
import { VexAuthConfigError } from "@vexcms/core";
import type { TableSlugs } from "../types";

const defaultSlugs: TableSlugs = {
  userSlug: "user",
  sessionSlug: "session",
  accountSlug: "account",
  verificationSlug: "verification",
};

function makeBaseUserFields(): Record<string, AuthFieldDefinition> {
  return {
    name: { validator: "v.string()" },
    email: { validator: "v.string()" },
  };
}

function makeBaseTables(): AuthTableDefinition[] {
  return [
    {
      slug: "session",
      fields: {
        token: { validator: "v.string()" },
        userId: { validator: 'v.id("user")' },
      },
      indexes: [{ name: "by_token", fields: ["token"] }],
    },
    {
      slug: "account",
      fields: {
        accountId: { validator: "v.string()" },
        userId: { validator: 'v.id("user")' },
      },
      indexes: [{ name: "by_accountId", fields: ["accountId"] }],
    },
  ];
}

describe("resolvePluginContributions", () => {
  it("returns inputs unchanged when plugins is undefined", () => {
    const userFields = makeBaseUserFields();
    const tables = makeBaseTables();
    const result = resolvePluginContributions(
      undefined,
      userFields,
      tables,
      defaultSlugs,
    );
    expect(result.userFields).toEqual(userFields);
    expect(result.tables).toEqual(tables);
  });

  it("returns inputs unchanged when plugins is empty array", () => {
    const userFields = makeBaseUserFields();
    const tables = makeBaseTables();
    const result = resolvePluginContributions(
      [],
      userFields,
      tables,
      defaultSlugs,
    );
    expect(result.userFields).toEqual(userFields);
    expect(result.tables).toEqual(tables);
  });

  describe("admin plugin", () => {
    const adminPlugin = { id: "admin" };

    it("adds 4 fields to user fields", () => {
      const result = resolvePluginContributions(
        [adminPlugin],
        makeBaseUserFields(),
        makeBaseTables(),
        defaultSlugs,
      );
      expect(result.userFields.role).toEqual({
        validator: "v.array(v.string())",
      });
      expect(result.userFields.banned).toEqual({
        validator: "v.optional(v.boolean())",
      });
      expect(result.userFields.banReason).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(result.userFields.banExpires).toEqual({
        validator: "v.optional(v.float64())",
      });
    });

    it("role field is NOT optional (v.array, not v.optional)", () => {
      const result = resolvePluginContributions(
        [adminPlugin],
        makeBaseUserFields(),
        makeBaseTables(),
        defaultSlugs,
      );
      expect(result.userFields.role.validator).toBe("v.array(v.string())");
      expect(result.userFields.role.validator).not.toContain("v.optional");
    });

    it("adds impersonatedBy to session table", () => {
      const result = resolvePluginContributions(
        [adminPlugin],
        makeBaseUserFields(),
        makeBaseTables(),
        defaultSlugs,
      );
      const session = result.tables.find((t) => t.slug === "session")!;
      expect(session.fields.impersonatedBy).toEqual({
        validator: 'v.optional(v.id("user"))',
      });
    });

    it("uses custom userSlug in impersonatedBy v.id()", () => {
      const result = resolvePluginContributions(
        [adminPlugin],
        makeBaseUserFields(),
        makeBaseTables(),
        { ...defaultSlugs, userSlug: "members" },
      );
      const session = result.tables.find((t) => t.slug === "session")!;
      expect(session.fields.impersonatedBy).toEqual({
        validator: 'v.optional(v.id("members"))',
      });
    });
  });

  describe("api-key plugin", () => {
    const apiKeyPlugin = { id: "api-key" };

    it("adds an apikey table", () => {
      const result = resolvePluginContributions(
        [apiKeyPlugin],
        makeBaseUserFields(),
        makeBaseTables(),
        defaultSlugs,
      );
      const apikey = result.tables.find((t) => t.slug === "apikey");
      expect(apikey).toBeDefined();
    });

    it("apikey table userId uses v.id() with userSlug", () => {
      const result = resolvePluginContributions(
        [apiKeyPlugin],
        makeBaseUserFields(),
        makeBaseTables(),
        defaultSlugs,
      );
      const apikey = result.tables.find((t) => t.slug === "apikey")!;
      expect(apikey.fields.userId).toEqual({ validator: 'v.id("user")' });
    });

    it("apikey table has indexes", () => {
      const result = resolvePluginContributions(
        [apiKeyPlugin],
        makeBaseUserFields(),
        makeBaseTables(),
        defaultSlugs,
      );
      const apikey = result.tables.find((t) => t.slug === "apikey")!;
      expect(apikey.indexes).toContainEqual({
        name: "by_userId",
        fields: ["userId"],
      });
      expect(apikey.indexes).toContainEqual({
        name: "by_key",
        fields: ["key"],
      });
    });
  });

  describe("next-cookies plugin", () => {
    it("skips silently — no schema contributions", () => {
      const userFields = makeBaseUserFields();
      const tables = makeBaseTables();
      const result = resolvePluginContributions(
        [{ id: "next-cookies" }],
        userFields,
        tables,
        defaultSlugs,
      );
      expect(result.userFields).toEqual(userFields);
      expect(result.tables).toEqual(tables);
    });
  });

  describe("unknown plugin", () => {
    it("logs console.warn and is skipped", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const userFields = makeBaseUserFields();
      const tables = makeBaseTables();
      const result = resolvePluginContributions(
        [{ id: "some-unknown-plugin" }],
        userFields,
        tables,
        defaultSlugs,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("some-unknown-plugin"),
      );
      expect(result.userFields).toEqual(userFields);
      expect(result.tables).toEqual(tables);
      warnSpy.mockRestore();
    });
  });

  describe("plugin with no id", () => {
    it("throws VexAuthConfigError", () => {
      expect(() =>
        resolvePluginContributions(
          [{ notAnId: true } as any],
          makeBaseUserFields(),
          makeBaseTables(),
          defaultSlugs,
        ),
      ).toThrow(VexAuthConfigError);
    });
  });

  it("does not mutate the input objects", () => {
    const userFields = makeBaseUserFields();
    const tables = makeBaseTables();
    const userFieldsBefore = JSON.parse(JSON.stringify(userFields));
    const tablesBefore = JSON.parse(JSON.stringify(tables));

    resolvePluginContributions(
      [{ id: "admin" }],
      userFields,
      tables,
      defaultSlugs,
    );

    expect(userFields).toEqual(userFieldsBefore);
    expect(tables).toEqual(tablesBefore);
  });

  it("applies multiple plugins in sequence", () => {
    const result = resolvePluginContributions(
      [{ id: "admin" }, { id: "api-key" }, { id: "next-cookies" }],
      makeBaseUserFields(),
      makeBaseTables(),
      defaultSlugs,
    );
    // admin fields present
    expect(result.userFields.role).toBeDefined();
    // apikey table present
    expect(result.tables.find((t) => t.slug === "apikey")).toBeDefined();
    // base tables still present
    expect(result.tables.find((t) => t.slug === "session")).toBeDefined();
  });
});
```

**Changes to `packages/better-auth/src/index.ts`** — wire in plugin resolution:

```typescript
// ADD import at top
import { resolvePluginContributions } from "./extract/plugins";

// ADD after buildBaseTables() call, before the return:
const resolved = resolvePluginContributions(
  config.plugins,
  userFields,
  tables,
  slugs,
);

// CHANGE the return to use resolved values:
return {
  name: "better-auth",
  userCollection: slugs.userSlug,
  userFields: resolved.userFields,
  tables: resolved.tables,
};
```

After this step: all 3 test files pass (`userFields`, `tables`, `plugins`), and the entry point is fully wired.

---

## Step 8: Complete Integration Tests + Re-exports + Build + Test App

Final step: expand the integration tests to cover the full pipeline, add re-exports, verify build, update test app.

- [ ] Create `packages/better-auth/src/extract/index.ts` (re-exports)
- [ ] Update `packages/better-auth/src/index.test.ts` with full integration tests
- [ ] Run all tests: `pnpm --filter @vexcms/better-auth test`
- [ ] Build: `pnpm --filter @vexcms/better-auth build`
- [ ] Update `apps/test-app/vex.config.ts` with `auth: vexBetterAuth({...})`
- [ ] Verify test app compiles: `pnpm --filter test-app typecheck`

**File: `packages/better-auth/src/extract/index.ts`**

```typescript
export { extractUserFields, BASE_USER_FIELDS } from "./userFields";
export { buildBaseTables } from "./tables";
export { resolvePluginContributions } from "./plugins";
```

**Replace `packages/better-auth/src/index.test.ts`** with the full integration tests:

```typescript
import { describe, it, expect } from "vitest";
import { vexBetterAuth } from "./index";

describe("vexBetterAuth", () => {
  it("minimal config returns correct adapter shape", () => {
    const adapter = vexBetterAuth({});
    expect(adapter.name).toBe("better-auth");
    expect(adapter.userCollection).toBe("user");
    expect(Object.keys(adapter.userFields)).toHaveLength(12);
    expect(adapter.tables).toHaveLength(4);
    // no extra keys on the adapter
    expect(Object.keys(adapter).sort()).toEqual([
      "name",
      "tables",
      "userCollection",
      "userFields",
    ]);
  });

  it("custom modelNames propagate to userCollection and v.id() references", () => {
    const adapter = vexBetterAuth({
      user: { modelName: "users" },
      session: { modelName: "sessions" },
      account: { modelName: "accounts" },
      verification: { modelName: "verifications" },
    });
    expect(adapter.userCollection).toBe("users");

    const session = adapter.tables.find((t) => t.slug === "sessions")!;
    expect(session.fields.userId).toEqual({ validator: 'v.id("users")' });

    const account = adapter.tables.find((t) => t.slug === "accounts")!;
    expect(account.fields.userId).toEqual({ validator: 'v.id("users")' });
  });

  it("admin plugin adds user fields and session impersonatedBy", () => {
    const adapter = vexBetterAuth({
      plugins: [{ id: "admin" } as any],
    });
    expect(adapter.userFields.role).toEqual({
      validator: "v.array(v.string())",
    });
    expect(adapter.userFields.banned).toEqual({
      validator: "v.optional(v.boolean())",
    });
    expect(adapter.userFields.banReason).toEqual({
      validator: "v.optional(v.string())",
    });
    expect(adapter.userFields.banExpires).toEqual({
      validator: "v.optional(v.float64())",
    });

    const session = adapter.tables.find((t) => t.slug === "session")!;
    expect(session.fields.impersonatedBy).toEqual({
      validator: 'v.optional(v.id("user"))',
    });
  });

  it("api-key plugin adds apikey table", () => {
    const adapter = vexBetterAuth({
      plugins: [{ id: "api-key" } as any],
    });
    const apikey = adapter.tables.find((t) => t.slug === "apikey");
    expect(apikey).toBeDefined();
    expect(apikey!.fields.userId).toEqual({ validator: 'v.id("user")' });
    // 4 base + 1 apikey = 5
    expect(adapter.tables).toHaveLength(5);
  });

  it("test app config produces expected adapter", () => {
    // Mirrors the test app's actual auth config
    const adapter = vexBetterAuth({
      user: {
        modelName: "user",
        additionalFields: {
          role: { type: "string[]", defaultValue: ["user"], required: true },
        },
      },
      session: { modelName: "session" },
      account: { modelName: "account" },
      verification: { modelName: "verification" },
      plugins: [
        { id: "admin" } as any,
        { id: "api-key" } as any,
        { id: "next-cookies" } as any,
      ],
    });

    expect(adapter.name).toBe("better-auth");
    expect(adapter.userCollection).toBe("user");

    // User fields: 12 base + role additionalField + 4 admin fields
    // role appears in both additionalFields and admin plugin — both produce v.array(v.string())
    expect(adapter.userFields.role).toEqual({
      validator: "v.array(v.string())",
    });
    expect(adapter.userFields.banned).toBeDefined();

    // 4 base tables + 1 apikey = 5
    expect(adapter.tables).toHaveLength(5);

    // v.id() references use "user"
    const session = adapter.tables.find((t) => t.slug === "session")!;
    expect(session.fields.userId).toEqual({ validator: 'v.id("user")' });
    expect(session.fields.impersonatedBy).toEqual({
      validator: 'v.optional(v.id("user"))',
    });

    const account = adapter.tables.find((t) => t.slug === "account")!;
    expect(account.fields.userId).toEqual({ validator: 'v.id("user")' });
  });

  it("next-cookies plugin does not add any tables or fields", () => {
    const withPlugin = vexBetterAuth({
      plugins: [{ id: "next-cookies" } as any],
    });
    const without = vexBetterAuth({});
    expect(withPlugin.tables).toHaveLength(without.tables.length);
    expect(Object.keys(withPlugin.userFields)).toHaveLength(
      Object.keys(without.userFields).length,
    );
  });
});
```

**Changes to `apps/test-app/vex.config.ts`** — add the `auth` field:

```typescript
// ADD these imports
import { vexBetterAuth } from "@vexcms/better-auth";
import { admin, apiKey } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

export default defineConfig({
  // ADD this auth field
  auth: vexBetterAuth({
    account: { modelName: "account" },
    emailAndPassword: { enabled: true },
    plugins: [
      admin({ adminRoles: ["admin"], defaultRole: "user" }),
      apiKey(),
      nextCookies(),
    ],
    session: { modelName: "session" },
    user: {
      additionalFields: {
        role: { type: "string[]", defaultValue: ["user"], required: true },
      },
      modelName: "user",
    },
    verification: { modelName: "verification" },
  }),
  // ... existing admin, basePath, collections fields
});
```

Runtime-only options (`database`, `secret`, `baseURL`, `trustedOrigins`) are NOT passed to `vexBetterAuth()` — they are only needed by `betterAuth()` on the Convex server side.

---

## Success Criteria

- [ ] All 4 test files pass: `userFields.test.ts`, `tables.test.ts`, `plugins.test.ts`, `index.test.ts`
- [ ] Package builds with `tsup` producing ESM output with type declarations
- [ ] `defineConfig({ auth: vexBetterAuth(...) })` compiles without type errors
- [ ] `vexBetterAuth()` with the test app's config produces a `VexAuthAdapter` whose tables and user fields match the test app's current manual `convex/schema.ts` (with `v.id()` for relationship fields)
- [ ] No runtime dependency on `better-auth` — it is a `peerDependency` used only for types

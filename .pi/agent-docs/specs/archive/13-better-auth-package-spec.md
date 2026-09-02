# @vexcms/better-auth Package Spec

Implement the `@vexcms/better-auth` package that exports `vexBetterAuth(config)` — a function accepting a `BetterAuthOptions` config and returning a fully-resolved `VexAuthAdapter` for the required `auth` field on `VexConfigInput`.

**Referenced by**: [12-schema-generation-auth-integration-spec.md](./12-schema-generation-auth-integration-spec.md) — Phase D (Stage 1, Step 3)

**Depends on**: `@vexcms/core` auth types (`VexAuthAdapter`, `AuthTableDefinition`, `AuthFieldDefinition`, `AuthIndexDefinition`) and error types (`VexAuthConfigError`)

**Prerequisite**: Ensure `VexAuthConfigError` is exported from `@vexcms/core`'s main `index.ts`. The class exists in `packages/core/src/errors/index.ts` but may not be re-exported from the package entry point yet. If not, add it before starting this spec.

---

## Design Decisions

1. **Use `getAuthTables()` from `better-auth/db`** — Instead of hardcoding base table fields and plugin contributions separately, we call better-auth's own `getAuthTables(config)` which returns the fully merged schema for all tables (base fields + plugin fields + `additionalFields`). This means: one function to extract everything, no hardcoded field lists to maintain, automatic support for all current and future plugins, and the same source of truth that better-auth itself uses. Each table's `DBFieldAttribute` entries are converted to Convex validators uniformly.
2. **`v.id()` for relationships** — Fields with `references` on their `DBFieldAttribute` produce `v.id("<modelName>")` instead of `v.string()`. The `references.model` value comes directly from `getAuthTables()`, which already resolves custom `modelName` values.
3. **`v.number()` for dates** — Convex stores dates as numbers. All better-auth `"date"` type fields map to `v.number()`.
4. **Runtime options ignored** — `database`, `secret`, `baseURL`, `trustedOrigins`, etc. are accepted in the config type but only schema-affecting properties are read by `getAuthTables()`.
5. **No runtime dependency on better-auth** — It's a `peerDependency`. We import `getAuthTables` from `better-auth/db` and types from `better-auth`.
6. **All tables uniform** — `getAuthTables()` returns all tables including `user`. All are returned as `AuthTableDefinition[]` in a flat array. Core's schema generator merges any user-defined collection configs on top of matching auth tables.

## Out of Scope

- Auth middleware, session management, or any runtime auth logic
- The `by_email` index on the user table (belongs to user collection config or future spec)
- Schema generation (`generateVexSchema`) — that lives in `@vexcms/core` per spec 12
- Shared auth config pattern (single config for both `vexBetterAuth()` and `betterAuth()`)

---

## Target Directory Structure

```
packages/better-auth/
├── src/
│   ├── index.ts                    # vexBetterAuth() factory + re-exports
│   ├── index.test.ts               # integration tests for vexBetterAuth()
│   ├── types.ts                    # Re-exports core auth types
│   ├── validators.ts               # betterAuthTypeToValidator() helper
│   ├── validators.test.ts          # unit tests for validator mapping
│   ├── extract/
│   │   ├── tables.ts               # extractAuthTables() — uses getAuthTables()
│   │   └── tables.test.ts          # tests for extractAuthTables()
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
4. `betterAuthTypeToValidator()` + unit tests → validator mapping works, tested directly
5. `extractAuthTables()` + tests → unified function using `getAuthTables()` from `better-auth/db`, replaces hardcoded tables in entry point
6. Update integration tests to cover full pipeline, verify build, update test app

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

Re-exports core auth types for internal use across the package.

```typescript
export type { AuthTableDefinition, AuthFieldDefinition, AuthIndexDefinition } from "@vexcms/core";
```

**File: `packages/better-auth/src/index.ts`**

The entry point. Start with a hardcoded return so the package builds and can be imported. The tables array is a temporary placeholder that gets replaced as you implement `extractAuthTables()`.

```typescript
import type { VexAuthAdapter } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import { extractAuthTables } from "./extract/tables";

interface VexBetterAuthOptions {
  config?: BetterAuthOptions;
}

export function vexBetterAuth(props?: VexBetterAuthOptions): VexAuthAdapter {
  const tables = extractAuthTables(props?.config ?? {});
  return { name: "better-auth", tables };
}
```

After this step, build the package and add `auth: vexBetterAuth({...})` to `apps/test-app/vex.config.ts` to verify the import works and TypeScript compiles. The adapter will have empty tables for now — that's fine.

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
    const adapter = vexBetterAuth();
    expect(adapter.name).toBe("better-auth");
    // no extra keys on the adapter
    expect(Object.keys(adapter).sort()).toEqual([
      "name",
      "tables",
    ]);
  });

  it("includes user table in the tables array", () => {
    const adapter = vexBetterAuth();
    const user = adapter.tables.find(t => t.slug === "user")!;
    expect(user).toBeDefined();
    expect(user.fields.name).toEqual({ validator: "v.string()" });
    expect(user.fields.email).toEqual({ validator: "v.string()" });
  });

  // These tests are added in Step 6 after all internals are wired up:
  // - minimal config returns all tables including user
  // - custom modelNames propagate into v.id() references
  // - admin plugin adds user fields and session impersonatedBy
  // - api-key plugin adds apikey table
  // - test app config produces expected adapter
  // - next-cookies plugin has no effect
});
```

At this point: package builds, tests run. The tests above should all pass against the initial return.

---

## Step 4: `betterAuthTypeToValidator()` + Unit Tests

This helper converts a single `DBFieldAttribute` to a Convex validator string. It handles all `DBFieldType` variants plus the `references` field for relationship types.

- [x] Update `packages/better-auth/src/validators.ts` — use `DBFieldAttribute` types from `better-auth`
- [x] Create `packages/better-auth/src/validators.test.ts` with unit tests
- [x] Run tests: `pnpm --filter @vexcms/better-auth test`

**File: `packages/better-auth/src/validators.ts`**

```typescript
import { VexAuthConfigError } from "@vexcms/core";
import type { DBFieldAttribute } from "better-auth";

/**
 * Maps a better-auth field type to a Convex validator string.
 *
 * DBFieldType from better-auth is:
 *   "string" | "number" | "boolean" | "date" | "json" | "string[]" | "number[]" | Array<LiteralString>
 *
 * The Array<LiteralString> variant represents enums (e.g., ["admin", "user"]) — stored as a string.
 *
 * Fields with `references` produce `v.id("<modelName>")` regardless of their `type` value.
 *
 * @param type - The better-auth field type
 * @param required - Whether the field is required. If false, wraps in v.optional().
 * @param references - If present, produces v.id() instead of using type.
 * @returns The Convex validator string (e.g., "v.string()", "v.optional(v.number())")
 * @throws VexAuthConfigError if the type is not recognized
 */
export function betterAuthTypeToValidator({
  type,
  required = false,
  references,
}: {
  type: DBFieldAttribute["type"];
  required?: boolean;
  references?: DBFieldAttribute["references"];
}): string {
  // TODO: implement
  //
  // 1. If references is defined, validator = `v.id("${references.model}")`
  //    (references takes precedence over type — the type is ignored)
  //
  // 2. Else if Array.isArray(type), validator = "v.string()"
  //    (Array<LiteralString> enum — stored as a string in the DB)
  //
  // 3. Else switch on type:
  //   "string"   → "v.string()"
  //   "number"   → "v.number()"
  //   "boolean"  → "v.boolean()"
  //   "date"     → "v.number()"    (Convex stores dates as numbers)
  //   "json"     → "v.any()"       (arbitrary JSON data)
  //   "string[]" → "v.array(v.string())"
  //   "number[]" → "v.array(v.number())"
  //   default    → throw new VexAuthConfigError(`Unknown better-auth field type: ${type}`)
  //
  // 4. If !required, wrap: `v.optional(${validator})`
  // 5. Return validator
  throw new Error("Not implemented");
}
```

**File: `packages/better-auth/src/validators.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { VexAuthConfigError } from "@vexcms/core";
import { betterAuthTypeToValidator } from "./validators";

describe("betterAuthTypeToValidator", () => {
  // --- Primitive types (required) ---

  it('maps "string" required to v.string()', () => {
    expect(betterAuthTypeToValidator({ type: "string", required: true })).toBe(
      "v.string()",
    );
  });

  it('maps "number" required to v.number()', () => {
    expect(betterAuthTypeToValidator({ type: "number", required: true })).toBe(
      "v.number()",
    );
  });

  it('maps "boolean" required to v.boolean()', () => {
    expect(betterAuthTypeToValidator({ type: "boolean", required: true })).toBe(
      "v.boolean()",
    );
  });

  it('maps "date" required to v.number() (stored as ms)', () => {
    expect(betterAuthTypeToValidator({ type: "date", required: true })).toBe(
      "v.number()",
    );
  });

  it('maps "json" required to v.any()', () => {
    expect(betterAuthTypeToValidator({ type: "json", required: true })).toBe(
      "v.any()",
    );
  });

  // --- Array types (required) ---

  it('maps "string[]" required to v.array(v.string())', () => {
    expect(
      betterAuthTypeToValidator({ type: "string[]", required: true }),
    ).toBe("v.array(v.string())");
  });

  it('maps "number[]" required to v.array(v.number())', () => {
    expect(
      betterAuthTypeToValidator({ type: "number[]", required: true }),
    ).toBe("v.array(v.number())");
  });

  // --- Enum type (Array<LiteralString>) ---

  it('maps enum array ["admin", "user"] required to v.string()', () => {
    expect(
      betterAuthTypeToValidator({
        type: ["admin", "user"] as unknown as any,
        required: true,
      }),
    ).toBe("v.string()");
  });

  it("maps empty enum array [] required to v.string()", () => {
    expect(
      betterAuthTypeToValidator({
        type: [] as unknown as any,
        required: true,
      }),
    ).toBe("v.string()");
  });

  // --- Reference / relationship fields ---

  it("maps a required reference field to v.id() with the model name", () => {
    expect(
      betterAuthTypeToValidator({
        type: "string",
        required: true,
        references: { model: "user", field: "id" },
      }),
    ).toBe('v.id("user")');
  });

  it("maps an optional reference field to v.optional(v.id())", () => {
    expect(
      betterAuthTypeToValidator({
        type: "string",
        required: false,
        references: { model: "session", field: "id" },
      }),
    ).toBe('v.optional(v.id("session"))');
  });

  it("reference takes precedence over type (type is ignored)", () => {
    expect(
      betterAuthTypeToValidator({
        type: "number",
        required: true,
        references: { model: "account", field: "id" },
      }),
    ).toBe('v.id("account")');
  });

  it("uses the model name from references for custom table names", () => {
    expect(
      betterAuthTypeToValidator({
        type: "string",
        required: true,
        references: { model: "users", field: "id" },
      }),
    ).toBe('v.id("users")');
  });

  // --- Optional wrapping ---

  it("wraps in v.optional() when required is false", () => {
    expect(betterAuthTypeToValidator({ type: "string", required: false })).toBe(
      "v.optional(v.string())",
    );
  });

  it("wraps enum in v.optional() when required is false", () => {
    expect(
      betterAuthTypeToValidator({
        type: ["admin", "user"] as unknown as any,
        required: false,
      }),
    ).toBe("v.optional(v.string())");
  });

  it("wraps json in v.optional() when required is false", () => {
    expect(betterAuthTypeToValidator({ type: "json", required: false })).toBe(
      "v.optional(v.any())",
    );
  });

  it("defaults required to false when not specified", () => {
    expect(betterAuthTypeToValidator({ type: "string" })).toBe(
      "v.optional(v.string())",
    );
  });

  // --- Error cases ---

  it("throws VexAuthConfigError on truly unknown type", () => {
    expect(() =>
      betterAuthTypeToValidator({
        type: "bigint" as any,
        required: true,
      }),
    ).toThrow(VexAuthConfigError);
  });

  it("error message includes the unknown type", () => {
    expect(() =>
      betterAuthTypeToValidator({ type: "xml" as any, required: true }),
    ).toThrow(/xml/);
  });
});
```

After this step: `validators.test.ts` passes. All type mappings are verified.

---

## Step 5: `extractAuthTables()` + Tests — Unified Table Extraction

This is the core change. Instead of separate `extractUserFields()` + `buildBaseTables()` + `resolvePluginContributions()`, we use a single `extractAuthTables()` function that calls `getAuthTables()` from `better-auth/db`. This gives us the fully merged schema for all tables — base fields, plugin fields, and `additionalFields` — from better-auth's own source of truth.

- [x] Update `packages/better-auth/src/types.ts` — re-exports core auth types
- [x] Rewrite `packages/better-auth/src/extract/tables.ts` — implement `extractAuthTables()` using `getAuthTables()`
- [x] Rewrite `packages/better-auth/src/extract/tables.test.ts` — test the unified function
- [x] Delete `packages/better-auth/src/extract/userFields.ts` (no longer needed)
- [x] Delete `packages/better-auth/src/extract/userFields.test.ts` (no longer needed)
- [x] Update `packages/better-auth/src/index.ts` — replace hardcoded tables with `extractAuthTables(config)`
- [x] Run tests: `pnpm --filter @vexcms/better-auth test`

**File: `packages/better-auth/src/types.ts`**

```typescript
export type { AuthTableDefinition, AuthFieldDefinition, AuthIndexDefinition } from "@vexcms/core";
```

**File: `packages/better-auth/src/extract/tables.ts`**

Uses `getAuthTables()` from `better-auth/db` which returns the fully merged schema. Each table entry has `modelName` (the slug) and `fields` (a `Record<string, DBFieldAttribute>`). We convert each `DBFieldAttribute` to a Convex validator string using `betterAuthTypeToValidator()`, extract indexes from `index: true` / `unique: true` attributes, and skip the `id` field (Convex auto-generates `_id`). All tables including `user` are returned in a flat `AuthTableDefinition[]` array.

```typescript
import type {
  AuthFieldDefinition,
  AuthIndexDefinition,
  AuthTableDefinition,
} from "@vexcms/core";
import type { BetterAuthOptions, DBFieldAttribute } from "better-auth";
import { getAuthTables } from "better-auth/db";
import { betterAuthTypeToValidator } from "../validators";

/**
 * Converts a Record of better-auth DBFieldAttributes into Convex AuthFieldDefinitions.
 * Skips the "id" field since Convex auto-generates _id.
 */
function convertFields(
  fields: Record<string, DBFieldAttribute>,
): Record<string, AuthFieldDefinition> {
  // TODO: implement
  // 1. Create empty result object
  // 2. Iterate Object.entries(fields)
  // 3. Skip fieldName === "id" (Convex auto-generates _id)
  // 4. For each field, call betterAuthTypeToValidator({ type, required, references })
  //    - required defaults to false if not specified on the attribute
  // 5. result[fieldName] = { validator }
  // 6. Return result
  throw new Error("Not implemented");
}

/**
 * Extracts indexes from better-auth field attributes.
 * Fields with `index: true` or `unique: true` get a `by_<fieldName>` index.
 */
function extractIndexes(
  fields: Record<string, DBFieldAttribute>,
): AuthIndexDefinition[] {
  // TODO: implement
  // 1. Create empty indexes array
  // 2. Iterate Object.entries(fields)
  // 3. Skip fieldName === "id"
  // 4. If field has (field as any).index === true or (field as any).unique === true,
  //    push { name: `by_${fieldName}`, fields: [fieldName] }
  // 5. Return indexes
  throw new Error("Not implemented");
}

/**
 * Extracts all auth tables from a BetterAuthOptions config using
 * better-auth's own `getAuthTables()` to get the full merged schema
 * (base fields + plugin fields + additionalFields for all tables).
 *
 * Returns all tables (including user) as a flat AuthTableDefinition[] array.
 */
export function extractAuthTables(
  config: BetterAuthOptions,
): AuthTableDefinition[] {
  // TODO: implement
  // 1. Call getAuthTables(config) — returns Record<string, { modelName, fields, ... }>
  // 2. Initialize tables as empty array
  // 3. Iterate Object.entries(allTables)
  // 4. For each [tableKey, tableDef]:
  //    a. slug = tableDef.modelName || tableKey
  //    b. fields = convertFields(tableDef.fields)
  //    c. indexes = extractIndexes(tableDef.fields)
  //    d. Push { slug, fields, ...(indexes.length > 0 ? { indexes } : {}) } to tables
  // 5. Return tables
  //
  // Key behaviors:
  // - getAuthTables() already merges plugin schema fields + additionalFields for ALL tables
  // - All tables (including user) are returned uniformly in the flat array
  // - Plugin tables (e.g., apiKey) appear as additional keys in the getAuthTables() output
  // - References are resolved by getAuthTables() using custom modelNames
  // - Core's schema generator merges user-defined collection configs on top of matching auth tables
  throw new Error("Not implemented");
}
```

**Edge cases:**

- `getAuthTables()` always returns at least user, session, account, verification
- Plugin tables (e.g., apiKey, rateLimit) appear as additional keys
- `modelName` on each table entry reflects custom names from config (e.g., `"users"` instead of `"user"`)
- `references.model` values also reflect custom names (getAuthTables resolves these)
- The `id` field on every table must be skipped — Convex uses `_id`
- `index: true` and `unique: true` on field attributes both produce indexes

**File: `packages/better-auth/src/extract/tables.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { extractAuthTables } from "./tables";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

describe("extractAuthTables", () => {
  describe("minimal config (no plugins, no additionalFields)", () => {
    it("returns user table with base fields", () => {
      const tables = extractAuthTables({});
      const user = tables.find((t) => t.slug === "user")!;
      expect(user).toBeDefined();
      // base user fields: name, email, emailVerified, image, createdAt, updatedAt
      expect(user.fields.name).toEqual({ validator: "v.string()" });
      expect(user.fields.email).toEqual({ validator: "v.string()" });
      expect(user.fields.emailVerified).toEqual({ validator: "v.boolean()" });
      expect(user.fields.image).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(user.fields.createdAt).toEqual({ validator: "v.number()" });
      expect(user.fields.updatedAt).toEqual({ validator: "v.number()" });
    });

    it("does not include 'id' in user table fields", () => {
      const tables = extractAuthTables({});
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.id).toBeUndefined();
    });

    it("returns at least 4 tables (user, session, account, verification)", () => {
      const tables = extractAuthTables({});
      const slugs = tables.map((t) => t.slug);
      expect(slugs).toContain("user");
      expect(slugs).toContain("session");
      expect(slugs).toContain("account");
      expect(slugs).toContain("verification");
    });

    it("session table has userId as v.id() referencing user", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.userId).toEqual({ validator: 'v.id("user")' });
    });

    it("account table has userId as v.id() referencing user", () => {
      const tables = extractAuthTables({});
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.userId).toEqual({ validator: 'v.id("user")' });
    });

    it("session table has date fields as v.number()", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.expiresAt).toEqual({ validator: "v.number()" });
      expect(session.fields.createdAt).toEqual({ validator: "v.number()" });
      expect(session.fields.updatedAt).toEqual({ validator: "v.number()" });
    });

    it("session table does not include 'id' field", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.id).toBeUndefined();
    });

    it("session table has indexes for token and userId", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.indexes).toContainEqual({
        name: "by_token",
        fields: ["token"],
      });
      expect(session.indexes).toContainEqual({
        name: "by_userId",
        fields: ["userId"],
      });
    });

    it("account table has indexes", () => {
      const tables = extractAuthTables({});
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.indexes).toContainEqual({
        name: "by_userId",
        fields: ["userId"],
      });
    });

    it("verification table has identifier index", () => {
      const tables = extractAuthTables({});
      const verification = tables.find((t) => t.slug === "verification")!;
      expect(verification.indexes).toContainEqual({
        name: "by_identifier",
        fields: ["identifier"],
      });
    });
  });

  describe("custom modelNames", () => {
    it("uses custom user modelName in v.id() references", () => {
      const tables = extractAuthTables({
        user: { modelName: "users" },
      });
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.userId).toEqual({ validator: 'v.id("users")' });

      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.userId).toEqual({ validator: 'v.id("users")' });
    });

    it("uses custom user modelName as user table slug", () => {
      const tables = extractAuthTables({
        user: { modelName: "users" },
      });
      const user = tables.find((t) => t.slug === "users");
      expect(user).toBeDefined();
    });

    it("uses custom session modelName as table slug", () => {
      const tables = extractAuthTables({
        session: { modelName: "sessions" },
      });
      const session = tables.find((t) => t.slug === "sessions");
      expect(session).toBeDefined();
    });

    it("uses custom account modelName as table slug", () => {
      const tables = extractAuthTables({
        account: { modelName: "accounts" },
      });
      const account = tables.find((t) => t.slug === "accounts");
      expect(account).toBeDefined();
    });
  });

  describe("user additionalFields", () => {
    it("merges additionalFields into user table", () => {
      const tables = extractAuthTables({
        user: {
          additionalFields: {
            bio: { type: "string", required: true },
          },
        },
      });
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.bio).toEqual({ validator: "v.string()" });
      // base fields still present
      expect(user.fields.name).toEqual({ validator: "v.string()" });
    });

    it("additionalField with required: false wraps in v.optional()", () => {
      const tables = extractAuthTables({
        user: {
          additionalFields: {
            nickname: { type: "string", required: false },
          },
        },
      });
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.nickname).toEqual({
        validator: "v.optional(v.string())",
      });
    });

    it("additionalField can reference another table", () => {
      const tables = extractAuthTables({
        user: {
          additionalFields: {
            orgId: {
              type: "string",
              required: true,
              references: { model: "organization", field: "id" },
            },
          },
        },
      });
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.orgId).toEqual({
        validator: 'v.id("organization")',
      });
    });
  });

  describe("with admin plugin", () => {
    it("admin plugin adds fields to user table", () => {
      const tables = extractAuthTables({
        plugins: [admin()],
      });
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.role).toBeDefined();
      expect(user.fields.banned).toBeDefined();
      expect(user.fields.banReason).toBeDefined();
      expect(user.fields.banExpires).toBeDefined();
    });

    it("admin plugin adds impersonatedBy to session table", () => {
      const tables = extractAuthTables({
        plugins: [admin()],
      });
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.impersonatedBy).toBeDefined();
    });

    it("admin impersonatedBy uses v.optional(v.string())", () => {
      const tables = extractAuthTables({
        user: { modelName: "users" },
        plugins: [admin()],
      });
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.impersonatedBy.validator).toBe("v.optional(v.string())");
    });
  });

  describe("with next-cookies plugin (no schema contribution)", () => {
    it("does not add extra tables", () => {
      const without = extractAuthTables({});
      const withPlugin = extractAuthTables({
        plugins: [nextCookies()],
      });
      expect(withPlugin.length).toBe(without.length);
    });
  });

  describe("session additionalFields", () => {
    it("merges additionalFields into session table", () => {
      const tables = extractAuthTables({
        session: {
          additionalFields: {
            device: { type: "string", required: false },
          },
        },
      });
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.device).toEqual({
        validator: "v.optional(v.string())",
      });
    });
  });

  describe("account additionalFields", () => {
    it("merges additionalFields into account table", () => {
      const tables = extractAuthTables({
        account: {
          additionalFields: {
            metadata: { type: "json", required: false },
          },
        },
      });
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.metadata).toEqual({
        validator: "v.optional(v.any())",
      });
    });
  });
});
```

**Changes to `packages/better-auth/src/index.ts`** — replace hardcoded tables with the unified function:

```typescript
import type { VexAuthAdapter } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import { extractAuthTables } from "./extract/tables";

interface VexBetterAuthOptions {
  config?: BetterAuthOptions;
}

/**
 * Creates a VexAuthAdapter from a BetterAuthOptions config.
 *
 * Uses better-auth's own getAuthTables() to get the fully merged schema
 * for all tables (base + plugins + additionalFields), then converts
 * each field to a Convex validator string.
 */
export function vexBetterAuth(props?: VexBetterAuthOptions): VexAuthAdapter {
  const tables = extractAuthTables(props?.config ?? {});
  return { name: "better-auth", tables };
}
```

**Cleanup:**

- [x] Delete `packages/better-auth/src/extract/userFields.ts`
- [x] Delete `packages/better-auth/src/extract/userFields.test.ts`

After this step: `validators.test.ts` and `tables.test.ts` all pass. The entry point returns real tables (including user) from better-auth's own schema definitions. No hardcoded field lists to maintain.

---

## Step 6: Complete Integration Tests + Build + Test App

Final step: expand the integration tests to cover the full pipeline, verify build, update test app.

- [x] Update `packages/better-auth/src/index.test.ts` with full integration tests
- [x] Run all tests: `pnpm --filter @vexcms/better-auth test`
- [x] Build: `pnpm --filter @vexcms/better-auth build`
- [x] Update `apps/test-app/vex.config.ts` with `auth: vexBetterAuth({...})`
- [x] Verify test app compiles: `pnpm --filter test-app typecheck`

**Replace `packages/better-auth/src/index.test.ts`** with the full integration tests:

```typescript
import { describe, it, expect } from "vitest";
import { vexBetterAuth } from "./index";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

describe("vexBetterAuth", () => {
  it("returns correct adapter shape", () => {
    const adapter = vexBetterAuth();
    expect(adapter.name).toBe("better-auth");
    expect(Object.keys(adapter).sort()).toEqual([
      "name",
      "tables",
    ]);
  });

  it("returns all tables including user", () => {
    const adapter = vexBetterAuth();
    const slugs = adapter.tables.map((t) => t.slug);
    expect(slugs).toContain("user");
    expect(slugs).toContain("session");
    expect(slugs).toContain("account");
    expect(slugs).toContain("verification");
  });

  it("user table has base fields", () => {
    const adapter = vexBetterAuth();
    const user = adapter.tables.find((t) => t.slug === "user")!;
    expect(user.fields.name).toEqual({ validator: "v.string()" });
    expect(user.fields.email).toEqual({ validator: "v.string()" });
    expect(Object.keys(user.fields).length).toBeGreaterThanOrEqual(6);
  });

  it("custom modelNames propagate into v.id() references", () => {
    const adapter = vexBetterAuth({
      config: {
        user: { modelName: "users" },
        session: { modelName: "sessions" },
        account: { modelName: "accounts" },
      },
    });
    const session = adapter.tables.find((t) => t.slug === "sessions")!;
    expect(session.fields.userId).toEqual({ validator: 'v.id("users")' });

    const account = adapter.tables.find((t) => t.slug === "accounts")!;
    expect(account.fields.userId).toEqual({ validator: 'v.id("users")' });
  });

  it("admin plugin adds user fields and session impersonatedBy", () => {
    const adapter = vexBetterAuth({
      config: { plugins: [admin()] },
    });
    const user = adapter.tables.find((t) => t.slug === "user")!;
    expect(user.fields.role).toBeDefined();
    expect(user.fields.banned).toBeDefined();

    const session = adapter.tables.find((t) => t.slug === "session")!;
    expect(session.fields.impersonatedBy).toBeDefined();
  });

  it("next-cookies plugin has no schema effect", () => {
    const withPlugin = vexBetterAuth({
      config: { plugins: [nextCookies()] },
    });
    const without = vexBetterAuth();
    expect(withPlugin.tables.length).toBe(without.tables.length);
  });

  it("test app config produces expected adapter", () => {
    const adapter = vexBetterAuth({
      config: {
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
          admin({ adminRoles: ["admin"], defaultRole: "user" }),
          nextCookies(),
        ],
      },
    });

    expect(adapter.name).toBe("better-auth");
    // user table has role and admin plugin fields
    const user = adapter.tables.find((t) => t.slug === "user")!;
    expect(user.fields.role).toBeDefined();
    expect(user.fields.banned).toBeDefined();

    // v.id() references use "user"
    const session = adapter.tables.find((t) => t.slug === "session")!;
    expect(session.fields.userId).toEqual({ validator: 'v.id("user")' });

    const account = adapter.tables.find((t) => t.slug === "account")!;
    expect(account.fields.userId).toEqual({ validator: 'v.id("user")' });
  });
});
```

**Changes to `apps/test-app/vex.config.ts`** — add the `auth` field:

```typescript
import { vexBetterAuth } from "@vexcms/better-auth";

export default defineConfig({
  auth: vexBetterAuth({ config: betterAuthOptions }),
  // ... existing admin, basePath, collections fields
});
```

Where `betterAuthOptions` is the same config object used for `betterAuth()` on the server side. Runtime-only options (`database`, `secret`, `baseURL`) are accepted but ignored — only schema-affecting properties are read.

---

## Success Criteria

- [x] `validators.test.ts` passes — all type mappings including references
- [x] `tables.test.ts` passes — unified extraction from `getAuthTables()`
- [x] `index.test.ts` passes — full integration tests
- [x] Package builds with `tsup` producing ESM output with type declarations
- [x] `defineConfig({ auth: vexBetterAuth(...) })` compiles without type errors
- [x] No hardcoded base field lists — everything comes from `getAuthTables()`
- [x] `v.id()` for all relationship fields with correct model names
- [x] All auth tables (including user) returned in flat `tables` array — no special-casing
- [x] No `packages/better-auth/src/extract/userFields.ts` (deleted)
- [x] No `packages/better-auth/src/extract/plugins.ts` (not needed — plugins handled by `getAuthTables()`)

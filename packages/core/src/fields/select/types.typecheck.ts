import { select } from "./config";

/**
 * Compile-time pin: `select()`'s `schema` option is typed `never` when
 * `hasMany: true` — overrides only apply to single-value storage
 * (`SelectFieldInput.schema`, `SchemaOverrideInput`). `pnpm typecheck` IS
 * the assertion, no test runner involved.
 */
select({ hasMany: false, schema: { validator: "literal" } });
select({ hasMany: false, schema: { validator: "string" } });
select({ schema: { validator: "literal" } });
select({ hasMany: true });
select({});

// @ts-expect-error - `schema` is `never` when `hasMany: true`.
select({ hasMany: true, schema: { validator: "literal" } });

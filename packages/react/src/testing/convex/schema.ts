import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
} from "convex/server";
import { v } from "convex/values";

/**
 * Minimal, self-contained Convex schema for `@vexcms/react`'s `./testing`
 * subpath — one `documents` table, just enough to seed relationship targets
 * for the convex-test bridge (`bridge.ts`) and the relationship field
 * fixture built on top of it (spec step 11).
 *
 * Deliberately NOT `packages/core/src/api/test/convex/schema.ts`: that
 * fixture lives under core's `src/api/test/**`, which `tsconfig.build.json`
 * excludes from core's published output — workspace-private, unimportable
 * from a published `@vexcms/react` subpath. `./testing` ships to consumers,
 * so its own Convex fixtures must be self-contained rather than reaching
 * into a sibling package's private test-only directory.
 */
const schema = defineSchema({
  documents: defineTable({
    title: v.string(),
  }).searchIndex("search_title", { searchField: "title", filterFields: [] }),
});

export default schema;

/**
 * Data model derived from this file's own schema — used by `bridge.ts` to
 * type `ctx.db` inside fake query handlers, and by `bridge.test.ts` to type
 * seeded/returned documents.
 */
export type TestDataModel = DataModelFromSchemaDefinition<typeof schema>;

/** A document from one of this schema's tables, Convex system fields included. */
export type TestDoc<TableName extends keyof TestDataModel> = DocumentByName<
  TestDataModel,
  TableName
>;

/**
 * Explicit module map for `convexTest()`'s second argument.
 *
 * `convex-test`'s default (called when no second argument is passed) is
 * `import.meta.glob("../../../convex/**\/*.*s")` — a Vite build-time macro
 * that only gets rewritten inside source files Vite's own plugin actually
 * transforms. It is never rewritten inside `convex-test`'s own pre-built
 * `dist/index.js`, where that default line lives, so calling `convexTest(schema)`
 * with no second argument throws `(intermediate value).glob is not a
 * function` at runtime before the mock backend is even constructed —
 * confirmed by actually running `bridge.test.tsx` against the omitted
 * second argument. `@vexcms/core`'s own suite works around the identical
 * problem the same way (see e.g. `packages/core/src/api/populate.test.ts`'s
 * "Explicit modules map for convex-test (replaces import.meta.glob which
 * requires Vite)" comment).
 *
 * `convex-test` also requires at least one module path containing
 * `"_generated"` to locate its module root (`findModulesRoot` in
 * `convex-test/dist/index.js`); the entry's value is never actually invoked
 * here because this test kit ships no registered Convex functions for
 * `t.query()`/`t.mutation()` to resolve against — every call this kit makes
 * goes through `t.run()` directly.
 */
export const testModules: Record<string, () => Promise<unknown>> = {
  "./_generated/api": () => Promise.resolve({}),
};

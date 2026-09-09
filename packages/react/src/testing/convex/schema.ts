import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
} from "convex/server";
import { v } from "convex/values";
import type { TestConvex } from "convex-test";

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
  // `title` is optional and `status` is declared because this table backs BOTH
  // seeded reads (every row this kit inserts sets `title`) and real writes made
  // by components under test: `CreateDocumentModal` submits `testCollection`'s
  // own fields — slug "posts", one `status` text field — through the real
  // `vex:create` mutation, and Convex rejects both an undeclared field and a
  // missing required one.
  documents: defineTable({
    status: v.optional(v.string()),
    title: v.optional(v.string()),
  }).searchIndex("search_title", { searchField: "title", filterFields: [] }),
  // The media counterpart of `documents`: `MediaLibraryGrid`, `FilePreview` and
  // `MediaUploadDropzone` all read `VexMediaDocument`'s own fields
  // (filename/mimeType/size/alt/src), none of which `documents` models — so the
  // media suites can run against real convex-test data instead of a mocked
  // `useQuery`. Field set mirrors `VexMediaCreateMediaDocumentArgs` plus the
  // `src`/`deleted` fields the render paths read.
  media: defineTable({
    adapter: v.string(),
    alt: v.string(),
    collectionSlug: v.string(),
    deleted: v.boolean(),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    src: v.optional(v.string()),
    storageId: v.string(),
  }).searchIndex("search_filename", { searchField: "filename", filterFields: [] }),
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

/**
 * Seeds `count` documents titled `"Doc 0"`, `"Doc 1"`, … into `t`'s
 * `documents` table, returning their real generated ids in insertion order.
 * Used by `usePaginatedQuery.test.tsx` (Step 3) to page through a
 * predictable, ordered document set — convex-test's default index preserves
 * this insertion order, so tests can assert exact page contents by title.
 *
 * @param t - The `convexTest()` instance to seed.
 * @param count - Number of documents to insert.
 * @returns The seeded documents' ids, in insertion order.
 */
export async function seedDocuments(
  t: TestConvex<typeof schema>,
  count: number,
): Promise<string[]> {
  const ids: string[] = [];
  await t.run(async (ctx) => {
    for (let i = 0; i < count; i++) {
      ids.push(await ctx.db.insert("documents", { title: `Doc ${i}` }));
    }
  });
  return ids;
}

/** A `media` row as this schema stores it, before Convex system fields are added. */
export type TestMediaInput = Omit<TestDoc<"media">, "_id" | "_creationTime">;

/**
 * Seeds `media` rows, filling every field a render path reads with a sensible
 * default so a caller only spells out what its own assertion cares about.
 *
 * @param t - The `convexTest()` instance to seed.
 * @param rows - Per-row overrides; one seeded row per entry, in order.
 * @returns The seeded rows' ids, in insertion order.
 */
export async function seedMedia(
  t: TestConvex<typeof schema>,
  rows: Array<Partial<TestMediaInput>>,
): Promise<string[]> {
  const ids: string[] = [];
  await t.run(async (ctx) => {
    for (const [index, row] of rows.entries()) {
      ids.push(
        await ctx.db.insert("media", {
          adapter: "convex",
          alt: "",
          collectionSlug: "images",
          deleted: false,
          filename: `file-${index}.png`,
          mimeType: "image/png",
          size: 1024,
          src: `https://example.com/file-${index}.png`,
          storageId: `storage_${index}`,
          ...row,
        }),
      );
    }
  });
  return ids;
}

/**
 * Reads every row of a table back out of `t`, for asserting what a real
 * mutation actually wrote instead of spying on the call that made it.
 *
 * @param t - The `convexTest()` instance to read from.
 * @param table - Which table to read.
 * @returns Every row in that table, in insertion order.
 */
export async function readTable<TableName extends keyof TestDataModel & string>(
  t: TestConvex<typeof schema>,
  table: TableName,
): Promise<TestDoc<TableName>[]> {
  return t.run(async (ctx) => ctx.db.query(table).collect() as Promise<TestDoc<TableName>[]>);
}

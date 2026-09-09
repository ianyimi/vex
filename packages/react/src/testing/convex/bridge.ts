import {
  anyApi,
  getFunctionName,
  type FunctionReference,
  type GenericMutationCtx,
  type GenericSchema,
  type SchemaDefinition,
} from "convex/server";
import type { GenericId } from "convex/values";
import type { TestConvex } from "convex-test";
import { find, get, search } from "@vexcms/core/server";
import type { PaginationOptions, PaginationResult } from "@vexcms/core";

import schema, { type TestDataModel, type TestDoc } from "./schema";

/**
 * The instance `convexTest()` returns, generic over any schema. Named here
 * (rather than `ReturnType<typeof convexTest>`) because `convexTest`'s own
 * declared return type already is a named generic — `TestConvex<Schema>` —
 * so there is no reason to re-derive it structurally.
 */
export type ConvexTestInstance = TestConvex<SchemaDefinition<GenericSchema, boolean>>;

/**
 * A fake query handler runs inside `t.run()` against convex-test's mock
 * backend — the same execution path
 * `docs/standards/testing/convex-integration-testing.md` documents for
 * `@vexcms/core`'s own suite — rather than a registered Convex `query()`
 * function. This test kit ships no `convex/` function files at all (only
 * `schema.ts`), so `t.query()`/`t.mutation()` have nothing to resolve;
 * `createFakeConvexClient` bridges that gap by dispatching on the
 * function-name string `@convex-dev/react-query` already extracts.
 */
type FakeQueryHandler = (
  ctx: GenericMutationCtx<TestDataModel>,
  args: Record<string, unknown>,
) => Promise<unknown>;

/**
 * A fake mutation handler, same shape and same `t.run()` context as
 * {@link FakeQueryHandler} — writes go through `ctx.db` directly rather than
 * `@vexcms/core/server`'s `create`, which requires a resolved `VexConfig`
 * (for its access check) this data-shape kit deliberately does not stand up.
 */
type FakeMutationHandler = FakeQueryHandler;

/**
 * Media collection slugs this kit's `media` table backs. A media collection's
 * slug is a config-level name ("images"), not a table name, so the generic
 * `vex:*` handlers below resolve it to a table rather than passing it straight
 * through to `ctx.db`.
 */
const MEDIA_COLLECTION_SLUGS: ReadonlySet<string> = new Set(["images", "media"]);

/**
 * Resolves a call's `collection` argument to one of this schema's two tables:
 * a media collection slug reads/writes `media`, anything else `documents`.
 *
 * @param args - The Convex call's args, as received by a handler.
 * @returns The table the call operates on.
 */
function resolveTable(args: Record<string, unknown>): "documents" | "media" {
  const collection = args.collection ?? args.collectionSlug;
  return typeof collection === "string" && MEDIA_COLLECTION_SLUGS.has(collection)
    ? "media"
    : "documents";
}

/**
 * Function-name → handler lookup table. Keys are the exact string
 * `getFunctionName()` produces for a `"modulePath:exportName"` reference —
 * the same string `convexQuery()` embeds in its query key
 * (`getFunctionName(funcRef) as unknown as typeof funcRef`, see
 * `@convex-dev/react-query`'s `src/index.ts`) and the same string
 * `ConvexQueryClient.queryFn()` reads back out of that query key before
 * calling `this.convexClient.query(func, args)`. Extend this table — never
 * `createFakeConvexClient`'s signature, which is frozen across every step
 * that consumes it — when a later step needs another fake query.
 */
const QUERY_HANDLERS: Record<string, FakeQueryHandler> = {
  "documents:list": async (ctx) => ctx.db.query("documents").collect(),
  "vex:search": async (ctx, args) =>
    search({
      ctx,
      collection: resolveTable(args),
      query: args.query as string,
      searchIndexName: args.searchIndexName as string,
      searchField: args.searchField as string,
    }),
  "vex:get": async (ctx, args) =>
    get({ ctx, id: args.id as GenericId<"documents">, collection: resolveTable(args) }),
  "vex:find": async (ctx, args) => {
    const paginationOpts = args.paginationOpts as PaginationOptions | undefined;
    const collection = resolveTable(args);
    return paginationOpts ? find({ ctx, collection, paginationOpts }) : find({ ctx, collection });
  },
};

/**
 * Function-name → handler lookup table for mutations, the write-side
 * counterpart of {@link QUERY_HANDLERS}. `ConvexReactClient.mutation(func,
 * args)` is what `useConvexMutation` (and therefore `useVexMutation`) calls,
 * so a component that writes runs its real mutation path against convex-test
 * data here instead of a spy — assertions read the written row back out of the
 * table (see `schema.ts`'s `readTable`).
 */
const MUTATION_HANDLERS: Record<string, FakeMutationHandler> = {
  "vex:create": async (ctx, args) =>
    ctx.db.insert(resolveTable(args), args.data as Record<string, never>),
  "vex/media:createMediaDocument": async (ctx, args) =>
    ctx.db.insert("media", {
      adapter: args.adapter as string,
      alt: (args.alt as string | undefined) ?? "",
      collectionSlug: args.collectionSlug as string,
      deleted: false,
      filename: args.filename as string,
      mimeType: args.mimeType as string,
      size: args.size as number,
      storageId: args.storageId as string,
    }),
  // Mints a fixed stand-in for a signed upload URL: no adapter in this kit
  // ever fetches it, the URL is only handed to the caller-supplied
  // `StorageAdapterContextProvider` upload function.
  "vex/media:generateUploadUrl": async () => ({ url: "https://example.com/fake-upload-url" }),
};

/**
 * `documents:list`'s function reference, typed for `convexQuery()` call
 * sites. Built the same way `@vexcms/core`'s own `vexConvexApi` builds
 * references without generated codegen (`packages/core/src/api/convex.ts`):
 * `anyApi.<module>.<export>` cast to the exact `FunctionReference` shape.
 * `anyApi` is a `Proxy` that manufactures a `"module:export"` name for any
 * property path without a real registered Convex function behind it — this
 * name only ever gets resolved back through `QUERY_HANDLERS` above, never
 * against a real backend.
 */
export const documentsListQuery = anyApi.documents.list as FunctionReference<
  "query",
  "public",
  Record<string, never>,
  TestDoc<"documents">[]
>;

/**
 * `vexConvexApi.findPaginated`'s function reference, typed for direct
 * `convexQuery()` call sites against this test kit's `documents` table.
 * Built from `anyApi.vex.find` — the exact same underlying reference
 * `vexConvexApi.findPaginated` casts in `packages/core/src/api/convex.ts`,
 * since one registered Convex `find` query serves both the array and
 * paginated shapes (overloaded server-side on `paginationOpts`). Its
 * `getFunctionName()` output is therefore `"vex:find"`, identical to
 * `vexConvexApi.find`'s — see the `"vex:find"` entry above, which now
 * forwards `paginationOpts` when present.
 */
export const findPaginatedQuery = anyApi.vex.find as FunctionReference<
  "query",
  "public",
  { paginationOpts: PaginationOptions },
  PaginationResult<TestDoc<"documents">>
>;

/**
 * Adapts a `convex-test` instance into the minimal `ConvexReactClient` shape
 * `ConvexQueryClient` needs at runtime: `.query(func, args)` for `queryFn`'s
 * one-shot fetch (what actually resolves `useQuery`'s `data`), and
 * `.watchQuery(func, args, opts)` for the `QueryCache` subscription
 * `ConvexQueryClient` sets up on every `"added"` cache event once it's
 * `.connect()`-ed to a `QueryClient`. Cast the result to `ConvexReactClient`
 * at the call site.
 *
 * `watchQuery` is a no-op stub: it never pushes a live update. Real-time
 * subscription updates are the one behavior this bridge does not attempt —
 * `queryFn`'s one-shot fetch is what this spike proves resolves real data;
 * nothing in this test kit asserts an update arriving *after* the initial
 * render. A future step that needs live-update assertions must replace this
 * stub with one that actually re-queries and calls `onUpdate`.
 *
 * `.mutation(func, args)` dispatches through {@link MUTATION_HANDLERS}, so a
 * component's real write path (`useVexMutation` → `useConvexMutation` →
 * `client.mutation`) lands in convex-test's tables and can be asserted by
 * reading the row back.
 *
 * @param t - The `convexTest()` instance to dispatch fake queries against.
 * @returns A `ConvexReactClient`-shaped object — cast at the call site.
 */
export function createFakeConvexClient(t: ConvexTestInstance): unknown {
  // `t`'s frozen parameter type is intentionally schema-erased (every other
  // step's call site is written against it with no knowledge of this file's
  // schema). This bridge's own lookup table is written against ITS OWN
  // schema, so re-asserting that specific, already-known schema here is safe.
  const typedT = t as TestConvex<typeof schema>;

  return {
    query: async (
      func: FunctionReference<"query"> | string,
      args: Record<string, unknown> = {},
    ) => {
      const name = typeof func === "string" ? func : getFunctionName(func);
      const handler = QUERY_HANDLERS[name];
      if (!handler) {
        throw new Error(`createFakeConvexClient: no fake query handler registered for "${name}"`);
      }
      return typedT.run((ctx) => handler(ctx, args));
    },
    mutation: async (
      func: FunctionReference<"mutation"> | string,
      args: Record<string, unknown> = {},
    ) => {
      const name = typeof func === "string" ? func : getFunctionName(func);
      const handler = MUTATION_HANDLERS[name];
      if (!handler) {
        throw new Error(
          `createFakeConvexClient: no fake mutation handler registered for "${name}"`,
        );
      }
      return typedT.run((ctx) => handler(ctx, args));
    },
    watchQuery: () => ({
      onUpdate: () => () => {},
      localQueryResult: () => undefined,
    }),
  };
}

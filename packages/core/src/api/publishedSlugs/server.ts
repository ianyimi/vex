import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { find } from "../find/server";
import type { AccessCallOptions, QueryCallActionFor } from "../types";

/**
 * Server-side args for `publishedSlugs`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface PublishedSlugsServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> {
  /** Per-call access override. Sitemaps are anonymous — pass `{ bypass: true }`. */
  access?: AccessCallOptions<QueryCallActionFor<TCollectionSlug>>;
  /** The collection to read slugs from. */
  collection: TCollectionSlug;
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** Maximum number of documents to return. Defaults to 5000. */
  limit?: number;
}

/** One collection document's slug and timestamps. */
export interface PublishedSlug {
  /**
   * The document's `_creationTime` — Convex's insert timestamp. Never moves on
   * update, so it is NOT a last-modified time.
   */
  createdAt: number;
  /** The document's `slug` field. */
  slug: string;
  /**
   * Last write through vexcms's own API, if known.
   *
   * `undefined` for rows written outside the app — the Convex dashboard,
   * `npx convex import`, and streaming import all bypass application code.
   * Emit `<lastmod>` only when this is defined.
   */
  updatedAt?: number;
}

/**
 * Reads every document's `slug` and `_creationTime` from a collection, for
 * `sitemap.xml` generation and `generateStaticParams`. Server-side only.
 *
 * Skips documents with no string `slug` field rather than throwing, so a
 * collection with mixed field shapes degrades to a partial sitemap instead of
 * failing the whole route.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - Input args: `{ ctx, collection, access?, limit? }`.
 * @returns Promise resolving to `{ slug, createdAt, updatedAt? }` for every matching document.
 *
 * @example
 * ```ts
 * import { publishedSlugs } from "@vexcms/core/server";
 *
 * export const listSlugs = query({
 *   args: {},
 *   handler: (ctx) => publishedSlugs({ ctx, collection: "pages", access: { bypass: true } }),
 * });
 * ```
 */
export async function publishedSlugs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: PublishedSlugsServerArgs<DataModel, TCollectionSlug>): Promise<PublishedSlug[]> {
  const docs = await find({
    access: args.access,
    collection: args.collection,
    ctx: args.ctx,
    limit: args.limit ?? 5000,
  });

  const entries: PublishedSlug[] = [];

  for (const doc of docs) {
    // `find`'s return is generic over the augmented `DocumentBySlug`, which a
    // consumer's `vex generate` output need not declare system fields on — so
    // `slug` and `_creationTime` are narrowed at runtime rather than asserted.
    if (doc === null || typeof doc !== "object") {
      continue;
    }
    if (!("slug" in doc) || typeof doc.slug !== "string") {
      continue;
    }
    if (!("_creationTime" in doc) || typeof doc._creationTime !== "number") {
      continue;
    }

    entries.push({
      createdAt: doc._creationTime,
      slug: doc.slug,
      updatedAt: "updatedAt" in doc && typeof doc.updatedAt === "number" ? doc.updatedAt : undefined,
    });
  }

  return entries;
}

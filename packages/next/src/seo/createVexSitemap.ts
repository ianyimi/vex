import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";
import type { MetadataRoute } from "next";

import type { VexServerClient } from "../cache/types";

type ArrayItem<T> = T extends (infer Item)[] ? Item : never;

/**
 * Creates a Next.js `sitemap.ts` default export from a Convex published-slugs
 * query (`packages/core/src/api/publishedSlugs/server.ts`).
 *
 * Tolerates an unreachable Convex deployment (P-020): a read failure returns
 * `[]` — an empty sitemap — rather than failing the build.
 *
 * @param props - Sitemap configuration.
 * @returns A `sitemap()` function suitable as `app/sitemap.ts`'s default export.
 */
export function createVexSitemap<Query extends FunctionReference<"query">>(props: {
  args?: OptionalRestArgs<Query>[0];
  client: VexServerClient;
  getSlug: (item: ArrayItem<FunctionReturnType<Query>>) => string;
  /**
   * Optional last-modified extractor. Omit it when the collection carries no
   * modification timestamp — Convex's `_creationTime` is set at insert and
   * never moves, so reporting it as `lastModified` would be a lie.
   * `lastModified` is optional in the sitemap protocol; an absent value is
   * correct, a wrong one costs crawl budget.
   *
   * May return `undefined` for an individual item, and that is the common
   * case: `defineCollection` injects `updatedAt` on every content collection,
   * but only a write through `create`/`update` populates it — a seeded or
   * imported row has none. Those entries are emitted with no `lastModified`
   * rather than an `Invalid Date`.
   */
  getUpdatedAt?: (item: ArrayItem<FunctionReturnType<Query>>) => number | undefined;
  /**
   * Maps one item's slug to its absolute public URL — the route mapper, so URL
   * shape (e.g. `/blog/[slug]` vs `/[slug]`) is the caller's choice.
   */
  toUrl: (slug: string) => string;
  query: Query;
}): () => Promise<MetadataRoute.Sitemap> {
  return async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
      const items = await props.client.query(props.query, props.args ?? {});
      if (!Array.isArray(items)) {
        return [];
      }
      const { getUpdatedAt } = props;
      // `Array.isArray` widens a generic return to `any[]`, so the element
      // type is restated here rather than asserted on `items`.
      return items.map((item: ArrayItem<FunctionReturnType<Query>>) => {
        // Resolved per item, not per call: a collection can carry `updatedAt`
        // while an individual seeded or imported row has never been written
        // through the API. `new Date(undefined)` is an `Invalid Date`, which
        // serializes to a `<lastmod>` no crawler can parse, so the tag is
        // dropped for that entry instead.
        const updatedAt = getUpdatedAt?.(item);
        return {
          url: props.toUrl(props.getSlug(item)),
          ...(typeof updatedAt === "number" && Number.isFinite(updatedAt)
            ? { lastModified: new Date(updatedAt) }
            : {}),
        };
      });
    } catch {
      // Unreachable deployment, or any other read failure.
      return [];
    }
  };
}

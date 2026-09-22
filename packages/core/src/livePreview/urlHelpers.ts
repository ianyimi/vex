import type { CollectionSlug, GlobalSlug, VexQueryCtx } from "../types/generated";
import type { DocumentByCollectionSlug, DocumentByGlobalSlug } from "../types/generated";
import type { LivePreviewServerUrl, LivePreviewUrlResolver } from "./types";

/**
 * Types a collection's `{ server }` preview-URL resolver against a real
 * collection — the `textValidator` of live preview.
 *
 * Needed for the same reason field validators need theirs: `defineCollection`
 * is a per-collection factory with no access to the project's data model, so a
 * resolver declared there has nothing to type `ctx` from. Passing the slug
 * types `doc`; the `DataModel` type argument types `ctx`.
 *
 * NOT needed in the root `admin.livePreview.collections` map — the key supplies
 * the document type, so a resolver declared there is written inline. `ctx` is
 * the project's own {@link VexQueryCtx} in every form, from the `DataModel`
 * `vex generate` writes into the type augmentation; no model is threaded by hand.
 *
 * @param slug - The owning collection's slug, used only to infer the document type.
 * @param resolve - The resolver, checked against that collection's real document.
 * @returns The `{ server }` wrapper, re-typed to the loose public `url` form.
 *
 * @example
 * ```ts
 * // Beside the collection. In the root map, write the resolver inline instead.
 * defineCollection({
 *   slug: "authors",
 *   admin: {
 *     livePreview: {
 *       url: livePreviewUrl<"authors">("authors", async ({ ctx, doc }) => {
 *         const page = await ctx.db
 *           .query("pages")
 *           .withIndex("by_author", (q) => q.eq("author", doc._id))
 *           .first();
 *         return page ? `/${page.slug}` : undefined;
 *       }),
 *     },
 *   },
 * });
 * ```
 */
export function livePreviewUrl<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  resolve: (props: {
    ctx: VexQueryCtx;
    doc: Partial<DocumentByCollectionSlug<TCollectionSlug>>;
  }) => Promise<string | undefined> | string | undefined,
): LivePreviewServerUrl {
  void slug;
  return { server: resolve } as unknown as LivePreviewServerUrl;
}

/**
 * `livePreviewUrl` for a global. @see {@link livePreviewUrl}
 *
 * @param slug - The owning global's slug, used only to infer the document type.
 * @param resolve - The resolver, checked against that global's real document.
 * @returns The `{ server }` wrapper, re-typed to the loose public `url` form.
 */
export function globalLivePreviewUrl<TGlobalSlug extends GlobalSlug>(
  slug: TGlobalSlug,
  resolve: (props: {
    ctx: VexQueryCtx;
    doc: Partial<DocumentByGlobalSlug<TGlobalSlug>>;
  }) => Promise<string | undefined> | string | undefined,
): LivePreviewServerUrl {
  void slug;
  return { server: resolve } as unknown as LivePreviewServerUrl;
}

/**
 * Types a client-side preview-URL resolver against a real collection.
 *
 * Rarely needed: a `url` in the root map is typed by its key, and one inside
 * `defineCollection` by its sibling `slug`. Provided so the client and server
 * forms have symmetrical escape hatches where inference cannot reach.
 *
 * @param slug - The owning collection's slug, used only to infer the document type.
 * @param resolve - The resolver, checked against that collection's real document.
 * @returns The same function, re-typed to the loose public resolver signature.
 */
export function livePreviewPath<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  resolve: (doc: Partial<DocumentByCollectionSlug<TCollectionSlug>>) => string | undefined,
): LivePreviewUrlResolver {
  void slug;
  return resolve as unknown as LivePreviewUrlResolver;
}

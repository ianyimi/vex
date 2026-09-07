import type { VexDocument } from "../api/convex";
import type { CollectionSlug } from "../types";

/**
 * User-supplied function mapping one document to the public paths that render
 * it.
 *
 * Configured once as `vex.config.ts`'s `routes.map`. Deliberately a plain
 * lookup with no I/O and no framework coupling: it answers "where does this
 * document appear?" and nothing else, so every consumer that needs that answer
 * can share one definition.
 *
 * Called once per document *state* involved in a write, never once per write —
 * so an update passes the `before` and `after` documents separately and a slug
 * rename resolves BOTH the old and the new path without the map looping over
 * them itself.
 *
 * @param props - The collection slug and the document to resolve paths for.
 * @returns The public paths that render `props.doc`. Return `[]` for a
 *   collection that renders no public page — that is the normal case for most
 *   collections, not an error.
 *
 * @example
 * ```ts
 * const map: VexRouteMapper = ({ collection, doc }) => {
 *   if (collection !== "pages") return []
 *   const { slug } = doc
 *   if (typeof slug !== "string") return []
 *   return [slug === "home" ? "/" : `/${slug}`]
 * }
 * ```
 */
export type VexRouteMapper = (props: {
  /** The collection the document belongs to. */
  collection: CollectionSlug;
  /**
   * The document to resolve paths for. `Partial` because a freshly created
   * document is known to the client only by the id its mutation returned —
   * `_creationTime` is assigned server-side and never reaches the caller.
   */
  doc: Partial<VexDocument>;
}) => string[];

/**
 * Maps documents to the public paths that render them.
 *
 * Omit entirely for a project with no public pages, or one whose public pages
 * read no CMS documents. There is no sensible default: only the project knows
 * its own URL shape.
 *
 * Named for what it describes rather than for a consumer. Cache revalidation is
 * the first consumer — `resolveTargets` uses `map` to decide which paths a
 * write invalidated — but the same answer drives an admin "View page" link,
 * sitemap URL generation, and preview links, none of which are cache concerns.
 *
 * Note that this does NOT configure the ISR window. Next reads
 * `export const revalidate` by static analysis before any module executes, so
 * that value can only be an inline literal in the route file and no config
 * here could reach it.
 *
 * @see {@link VexRouteMapper} for the `map` contract
 */
export interface VexRoutesConfig {
  /**
   * Maps a document to the public paths that render it. Required — a `routes`
   * block with no `map` configures nothing.
   */
  map: VexRouteMapper;
}

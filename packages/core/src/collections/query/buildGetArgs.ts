import type { MediaCollectionConfig } from "../../media";
import type { GlobalConfig } from "../../globals";
import type { VexGetArgs } from "../api/types";
import type { CollectionConfig } from "../types";

/**
 * Builds the exact `vexConvexApi.get` args for one document — shared by every caller that
 * needs this collection's active document (server prefetch, the collection/media edit
 * views' own data query, `AdminTopNav`'s document-title crumb, `ListViewPeek`'s deep-link
 * fetch/prefetch, and relationship/upload filter-value title resolution) so none of them can
 * drift into a different-shaped key for the SAME document (polish fixes, Decision 5).
 *
 * `drafts` is included ONLY when the collection is actually versioned — NEVER a concrete
 * `drafts: false`. This is the one rule every caller must share: `collection.versions.drafts`
 * is always a concrete boolean after `defineCollection`'s own defaults (`false` for a
 * non-versioned collection, never `undefined`) — a caller that does
 * `drafts: collection.versions.drafts` directly bakes a literal `"drafts":false` into its
 * JSON-serialized query key, while a caller that omits the field entirely for the same
 * non-versioned collection produces `"drafts"` missing from the JSON altogether. Those are
 * two DIFFERENT keys for the identical document — exactly the bug this closes: the media-edit
 * breadcrumb crumb (`drafts: collection.versions.drafts` → `false`) never matched the media
 * edit view's own prefetch/query (both omitted `drafts` → `undefined`, stripped from JSON).
 *
 * @param props.id - The document's `_id`.
 * @param props.collection - The resolved collection (or media collection) config.
 * @returns `{ id, collection, drafts }` with `drafts` present (always `true`) only when
 *   `collection.versions.drafts` is `true`, omitted otherwise.
 */
export function buildGetArgs(props: {
  id: string;
  collection: CollectionConfig | MediaCollectionConfig;
}): Pick<VexGetArgs, "id" | "collection" | "drafts"> {
  return {
    id: props.id,
    collection: props.collection.slug,
    ...(props.collection.versions.drafts ? { drafts: true as const } : {}),
  };
}

/**
 * The {@link buildGetArgs} equivalent for `vexConvexApi.globals.get` — same "`drafts` only
 * when actually versioned, never a concrete `false`" rule (Decision 5), for the same reason:
 * a global's own `versions.drafts` is just as concretely-defaulted as a collection's.
 *
 * @param props.global - The resolved global config.
 * @returns `{ slug, drafts }` with `drafts` present (always `true`) only when
 *   `global.versions.drafts` is `true`, omitted otherwise.
 */
export function buildGlobalGetArgs(props: { global: GlobalConfig }): { slug: string; drafts?: true } {
  return {
    slug: props.global.slug,
    ...(props.global.versions.drafts ? { drafts: true as const } : {}),
  };
}

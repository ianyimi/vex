import type { GenericDocument } from "convex/server";

/**
 * Decision-35 count-cap evaluation, shared by `find` and `search` — counts
 * at most `countLimit + 1` RAW rows off a query already narrowed by the
 * same index/filter as the main page query, instead of `.collect()`-ing
 * the whole matching set (the old unbounded count re-scanned every
 * matching row on each list open and failed outright above Convex's
 * ~32k-document transaction scan limit).
 *
 * `totalDocsCapped` is decided on the RAW window length, before
 * `readable()` can drop rows (an unreadable `whereFields` match, a
 * non-compilable access callback) — deciding it on the readable-filtered
 * length would under-report: a full raw window (`countLimit + 1`) with
 * some rows filtered out could still read as `<= countLimit` post-filter,
 * presenting an exact-looking total while more matching rows exist beyond
 * the window that were never scanned (polish fix).
 *
 * @param props - Input props.
 * @param props.countQuery - A query already narrowed by the same
 *   index/filter as the caller's own main page query — this only calls
 *   `.take()` on it, never `.collect()` or `.paginate()`.
 * @param props.countLimit - `admin.view.state.countLimit` (Decision 35).
 * @param props.readable - The caller's own `readableDocuments` closure.
 * @returns `totalDocs` (exact up to `countLimit`, never beyond it) and
 *   `totalDocsCapped` (`true` when more matching rows exist beyond the
 *   counted window).
 */
export async function resolveTotalDocsCap<TRaw extends GenericDocument, TDoc>(props: {
  countQuery: { take: (n: number) => Promise<TRaw[]> };
  countLimit: number;
  readable: (docs: readonly TRaw[]) => TDoc[];
}): Promise<{ totalDocs: number; totalDocsCapped: boolean }> {
  const rawCountDocs = await props.countQuery.take(props.countLimit + 1);
  const countDocs = props.readable(rawCountDocs);
  const totalDocsCapped = rawCountDocs.length > props.countLimit;
  return { totalDocs: Math.min(countDocs.length, props.countLimit), totalDocsCapped };
}

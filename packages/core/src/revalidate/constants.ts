/**
 * Maximum number of `changes` entries accepted in a single revalidation
 * request.
 *
 * `useVexMutation` (`@vexcms/react`) chunks a larger batch into requests of at
 * most this size, issued sequentially; the route created by
 * `createVexRevalidateRoute` (`@vexcms/next`) rejects a request whose `changes`
 * array exceeds it with `413` — so a hand-rolled client cannot force an
 * unbounded mapper loop. The case this guards is a "select all" bulk delete,
 * which would otherwise produce a multi-megabyte request body.
 *
 * Both packages read this constant rather than hard-coding `100` (P-003).
 */
export const VEX_REVALIDATE_BATCH_SIZE = 100;

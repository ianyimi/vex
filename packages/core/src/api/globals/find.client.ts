import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";

/**
 * Returns tanstack-query options for listing all saved global documents.
 * Each element is a flat `VexDocumentGlobal` (unnarrowed). For typed
 * single-global access use `globals.get` instead. Client-side only.
 *
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 *
 * @example
 * ```tsx
 * import { globals } from "@vexcms/core/client";
 *
 * const { data } = useQuery(globals.find({}));
 * data?.map((g) => g._slug); // ["siteSettings", "nav"]
 * ```
 */
export function findGlobals() {
  return convexQuery(vexConvexApi.globals.find, {});
}

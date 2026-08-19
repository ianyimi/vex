import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexGlobalsFindArgs } from "../convex";
import type { VexDocumentGlobal } from "../../types/generated";
import type { VexQueryOptions } from "../types";

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
export function findGlobals(): VexQueryOptions<VexGlobalsFindArgs, VexDocumentGlobal[]> {
  // Intentionally un-narrowed: this returns a mixed-slug list. Globals carry a
  // runtime `_slug` discriminator, so callers can narrow it safely themselves.
  const funcRef = vexConvexApi.globals.find as FunctionReference<
    "query",
    "public",
    VexGlobalsFindArgs,
    VexDocumentGlobal[]
  >;
  return convexQuery(funcRef, {});
}

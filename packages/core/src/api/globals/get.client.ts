import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexGlobalsGetArgs } from "../convex";
import type { GlobalSlug, GlobalPopulateShape } from "../../types/generated";
import type { VexQueryOptions } from "../types";
import type { GetGlobalReturn } from "./get.server";

/**
 * Client-side args for `globals.get`.
 *
 * @typeParam TSlug - Global slug; narrowed after `vex generate`.
 * @typeParam TPopulate - Populate shape; keys restricted to relationship fields.
 */
export interface GetGlobalClientArgs<
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TPopulate extends GlobalPopulateShape<TGlobalSlug> = Record<string, never>,
> {
  /** Discriminator: client args must NOT include `ctx`. */
  ctx?: never;
  /** Global slug to fetch. Compile-error on unknown slugs after `vex generate`. */
  slug: TGlobalSlug;
  /** Relationship fields to populate. Keys narrowed to relationship fields post-generate. */
  populate?: TPopulate;
}

/**
 * Returns tanstack-query options for fetching a single global by slug.
 * The returned document is flat — user fields are at root level alongside
 * `_id`, `_creationTime`, and `_slug`. Client-side only.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `getGlobal` from `@vexcms/core/server`.
 *
 * @typeParam TSlug - Global slug.
 * @typeParam TPopulate - Populate shape.
 * @param args - `{ slug, populate? }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 *
 * @example
 * ```tsx
 * import { globals } from "@vexcms/core/client";
 *
 * // Basic
 * const { data } = useQuery(globals.get({ slug: "siteSettings" }));
 * data?.siteName; // string | undefined
 *
 * // With populate
 * const { data } = useQuery(globals.get({ slug: "siteSettings", populate: { activeTheme: true } }));
 * data?.activeTheme; // Doc<"themes">[] (runtime) | Record<string, unknown>[] (type)
 * ```
 */
export function getGlobal<
  TSlug extends GlobalSlug = GlobalSlug,
  const TPopulate extends GlobalPopulateShape<TSlug> = Record<string, never>,
>(
  args: GetGlobalClientArgs<TSlug, TPopulate>,
): VexQueryOptions<VexGlobalsGetArgs, GetGlobalReturn<TSlug, TPopulate, 0>> {
  // Cast for the reason documented on `get`: `api.vex.globals.get` is one
  // registered function serving every global, so its return type is fixed at
  // codegen and the runtime `slug` cannot narrow it. `GetGlobalClientArgs` has
  // no `depth`, hence the literal `0`.
  const funcRef = vexConvexApi.globals.get as FunctionReference<
    "query",
    "public",
    VexGlobalsGetArgs,
    GetGlobalReturn<TSlug, TPopulate, 0>
  >;
  return convexQuery(funcRef, {
    slug: args.slug,
    populate: args.populate,
  });
}

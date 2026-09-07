import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";

import type { VexServerClient } from "../cache/types";

type ArrayItem<T> = T extends (infer Item)[] ? Item : never;

/**
 * Builds Next.js `generateStaticParams` output for a slug-driven route from a
 * Convex query.
 *
 * Returns `[]` when the read fails — including an unreachable Convex
 * deployment, which every CI build hits because it supplies placeholder env
 * rather than skipping validation (P-020). A route with no static params still
 * renders correctly on demand; it is simply not prerendered until the next
 * build.
 *
 * @param props - Static params configuration.
 * @returns `{ [paramName]: string }[]`, or `[]` if the read fails.
 */
export async function vexStaticParams<Query extends FunctionReference<"query">>(props: {
  args?: OptionalRestArgs<Query>[0];
  client: VexServerClient;
  getSlug: (item: ArrayItem<FunctionReturnType<Query>>) => string;
  paramName: string;
  query: Query;
}): Promise<Record<string, string>[]> {
  try {
    const items = await props.client.query(props.query, props.args ?? {});
    if (!Array.isArray(items)) {
      return [];
    }
    // `Array.isArray` widens a generic return to `any[]`, so the element type
    // is restated here rather than asserted on `items`.
    return items.map((item: ArrayItem<FunctionReturnType<Query>>) => ({
      [props.paramName]: props.getSlug(item),
    }));
  } catch {
    // Unreachable deployment, or any other read failure. An empty list means
    // "prerender nothing", which is correct — the route still renders on
    // demand — and never fails the build.
    return [];
  }
}

import type { PopulatedPage } from "@convex/pages";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useLivePreviewDocumentQuery, useLivePreviewQuery } from "@vexcms/react";

import { GLOBAL_SLUG_SITE_SETTINGS } from "~/db/constants";

/**
 * Compile-time pin for `useLivePreviewQuery`'s overridable `TData` generic —
 * `pnpm typecheck` IS the assertion, no test runner involved.
 *
 * Before this generic existed, `queryOptions`/`data` were pinned to the RAW
 * `DocumentByResourceSlug<TCollectionSlug>[]` with no override, so a
 * `populate`-resolved query — `convex/pages.ts`'s `getBySlugPopulated`, real,
 * not a stand-in — could never satisfy it: `testImage` resolved to real
 * `Image`/`HiddenDocument` documents is not assignable to its raw
 * `Id<"images">[]` declared shape. Every consumer backing this hook with a
 * populated query needed `convexQuery(...) as never` on the call AND a
 * second cast on the destructured result. `pin` proves BOTH the call and the
 * result need zero casts once `TData` is given explicitly —
 * `api.pages.getBySlug` (no `populate`) stays correctly REJECTED here (its
 * real return, `Page[]`, is not `PopulatedPage[]`), confirming this isn't
 * just a widened/loosened escape hatch.
 */
function usePopulatedArrayQueryPin() {
  const { data } = useLivePreviewQuery<"pages", PopulatedPage[]>(
    {
      ...convexQuery(api.pages.getBySlugPopulated, { slug: "home" }),
      initialData: [],
    },
    "pages",
  );

  const testImageFilenames: string[] | undefined = data?.testImage
    ?.filter((image) => "filename" in image)
    .map((image) => image.filename);
  void testImageFilenames;

  return data;
}

/**
 * Compile-time pin for `useLivePreviewDocumentQuery`'s now-unconstrained
 * `TData` generic — mirrors the fix above for the single-document hook,
 * against `getFirstPopulated` below (real, same `populate`, `[0]` narrowed
 * server-side — the `getFirst`-style shape `headers.ts`/`footers.ts` already
 * use). Before this, `TData extends DocumentByResourceSlug<TCollectionSlug> | null`
 * still rejected the populated document for the same `testImage` mismatch.
 * `pin` proves the call and the destructured result both need zero casts
 * once `TData` is given explicitly.
 */
function usePopulatedDocumentQueryPin() {
  const { data } = useLivePreviewDocumentQuery<"pages", null | PopulatedPage>(
    {
      ...convexQuery(api.pages.getFirstPopulated, { slug: "home" }),
      initialData: null,
    },
    "pages",
  );

  const testImageFilenames: string[] | undefined = data?.testImage
    ?.filter((image) => "filename" in image)
    .map((image) => image.filename);
  void testImageFilenames;

  return data;
}

/**
 * Compile-time pin for `useLivePreviewQuery`/`useLivePreviewDocumentQuery`
 * accepting a bare `convexQuery(api.x.y, args)` result with no cast — `pnpm
 * typecheck` IS the assertion, no test runner involved.
 *
 * Both hooks used to require `TQueryKey extends readonly unknown[]` as its
 * own type parameter, mirroring `UseQueryOptions`'s fourth generic. That type
 * appears in both a covariant position (`queryKey`) and a contravariant one
 * (`queryFn`'s context parameter), and the moment a caller gives an EARLIER
 * type parameter explicitly (`useLivePreviewDocumentQuery<"siteSettings">`,
 * needed whenever the slug argument isn't itself a literal), TypeScript stops
 * inferring `TQueryKey` from the call entirely and falls back to the
 * generic's default (`readonly unknown[]`) — which rejects `convexQuery`'s
 * specific tuple key. `ThemeLive.tsx` (here, apps/www and the marketing
 * template) worked around it with `convexQuery(...) as never`.
 */
function useThemeLiveInferencePins() {
  const documentQueryNoGenerics = useLivePreviewDocumentQuery(
    convexQuery(api.siteSettings.get, {}),
    GLOBAL_SLUG_SITE_SETTINGS,
  );

  const documentQueryExplicitSlug = useLivePreviewDocumentQuery<typeof GLOBAL_SLUG_SITE_SETTINGS>(
    convexQuery(api.siteSettings.get, {}),
    GLOBAL_SLUG_SITE_SETTINGS,
  );

  const arrayQueryNoGenerics = useLivePreviewQuery(convexQuery(api.pages.getBySlug, { slug: "home" }), "pages");

  const arrayQueryExplicitSlug = useLivePreviewQuery<"pages">(
    convexQuery(api.pages.getBySlug, { slug: "home" }),
    "pages",
  );

  return [
    documentQueryNoGenerics,
    documentQueryExplicitSlug,
    arrayQueryNoGenerics,
    arrayQueryExplicitSlug,
  ] as const;
}

// Consumed so no-unused-vars stays quiet; the hooks above are the assertion.
export { usePopulatedArrayQueryPin, usePopulatedDocumentQueryPin, useThemeLiveInferencePins };

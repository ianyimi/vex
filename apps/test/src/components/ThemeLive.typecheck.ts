import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useLivePreviewDocumentQuery, useLivePreviewQuery } from "@vexcms/react";

import { GLOBAL_SLUG_SITE_SETTINGS } from "~/db/constants";

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

// Consumed so no-unused-vars stays quiet; the hook above is the assertion.
export { useThemeLiveInferencePins };

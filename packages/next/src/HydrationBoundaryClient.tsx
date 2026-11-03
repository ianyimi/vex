"use client";

import { HydrationBoundary } from "@tanstack/react-query";

/**
 * Re-exports `@tanstack/react-query`'s own `HydrationBoundary` through an explicit
 * `"use client"` module boundary, in its own tsup entry (`tsup.config.ts`'s client build
 * target, `@tanstack/react-query` marked `external` there) — `NextAdminPage.tsx` (a Server
 * Component, no banner) imports it from HERE, not directly from `@tanstack/react-query`.
 *
 * Importing `HydrationBoundary` directly into `NextAdminPage.tsx`'s own no-banner tsup
 * bundle let tsup inline/bundle it into the SAME output chunk as the server component code
 * — losing the "use client" boundary Next.js's RSC compiler needs to see at the MODULE
 * level (boundary detection is per-file, not per-component-within-a-bundled-chunk),
 * confirmed live: "createContext only works in Client Components" from inside
 * `HydrationBoundary`'s own internals. The same class of issue `NextAdminLayoutClient.tsx`
 * exists to avoid for `NextAdminLayout`'s client leaf.
 */
export { HydrationBoundary as HydrationBoundaryClient };

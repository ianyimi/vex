import { createVexServerClient } from "@vexcms/next/cache"

import { env } from "~/env.mjs"

/**
 * The single shared Convex read client for every server component and route in
 * this app.
 *
 * `createVexServerClient` (`@vexcms/next/cache`) wraps its `query` method in a
 * `React.cache` created fresh on every call — so two files that each call
 * `createVexServerClient()` themselves get two independent caches and never
 * share a round trip, no matter how identical their reads are. Importing this
 * one instance everywhere is what lets `generatePageMetadata` (`~/lib/metadata`)
 * and the page calling it collapse their identical `pages.getBySlug` read into a
 * single Convex call within one request, instead of two.
 */
export const vex = createVexServerClient({ url: env.NEXT_PUBLIC_CONVEX_URL })

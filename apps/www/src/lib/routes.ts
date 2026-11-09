/**
 * The static demo-unavailable fallback route. Served from `app/tour/page.tsx`
 * with `dynamic = "force-static"`, so it renders with no Convex dependency —
 * the target for every redirect that fires when the backend itself is what
 * failed.
 */
export const TOUR_PATH = "/tour";

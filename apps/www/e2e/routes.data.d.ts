/**
 * One route audited by the Playwright axe and width-matrix suites. `notFound`
 * marks the deliberate 404 probe, which Lighthouse can't audit (it aborts on a
 * 404 document).
 */
export interface QualityRoute {
  path: string;
  draft?: true;
  notFound?: true;
}

/**
 * Every `apps/www` route the quality pass audits: the seeded marketing pages,
 * the announcement and launch-week posts (all seeded `draft`, so `CI` skips
 * them), the static `/tour` demo fallback, the auth form routes, a guaranteed
 * 404 and `/unauthorized`. A route not yet seeded still 404s until its owning
 * page lands — the baseline run records that, rather than this file omitting
 * it.
 */
export const QUALITY_ROUTES: QualityRoute[];

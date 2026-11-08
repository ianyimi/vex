/**
 * One route audited by the Playwright axe suite. `notFound` marks the
 * deliberate 404 probe, mirroring `apps/www/e2e/routes.data.d.ts`'s
 * `QualityRoute`.
 */
export interface QualityRoute {
  path: string;
  draft?: true;
  notFound?: true;
}

/**
 * Every `apps/test` frontend route the quality pass audits: the same seeded
 * marketing pages `apps/www/e2e/routes.ts` audits (`apps/test` carries every
 * www page plus `/accessibility`, seeded here too — step 12 is what keeps
 * the two seeds in sync), the static `/tour` fallback, the auth form routes,
 * `/unauthorized`, a guaranteed 404, and the test-only `/posts/[slug]` route
 * (no www equivalent — it dogfoods the richtext field, not a marketing post).
 * `plate-upgrade-smoke` is the one published fixture post whose body
 * exercises headings, bold/italic, lists, a blockquote and an inline image —
 * the widest markup coverage of the published fixtures.
 */
export const QUALITY_ROUTES: QualityRoute[];

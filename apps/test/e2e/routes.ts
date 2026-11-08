/**
 * `QUALITY_ROUTES`/`QualityRoute` live in `routes.data.js` (plain
 * CommonJS, no TypeScript syntax) so `scripts/validate-html.mjs` can load
 * them with a bare `import()` on any Node ≥20, without Node's native
 * TypeScript type-stripping (≥22.18). Types come from the sibling
 * `routes.data.d.ts`.
 */
export type { QualityRoute } from "./routes.data.js";
export { QUALITY_ROUTES } from "./routes.data.js";

/** Same theme set `apps/www/e2e/routes.ts` audits. */
export const QUALITY_THEMES = ["light", "dark"] as const;

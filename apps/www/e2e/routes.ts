/**
 * `QUALITY_ROUTES`/`QualityRoute` live in `routes.data.js` (plain CommonJS,
 * typed by `routes.data.d.ts`) so `lighthouserc.cjs` and
 * `scripts/validate-html.mjs` load them on any Node ≥ 20, without Node's
 * native TypeScript type stripping (≥ 22.18).
 */
export type { QualityRoute } from "./routes.data.js";
export { QUALITY_ROUTES } from "./routes.data.js";

/**
 * Viewport widths every width-matrix and (indirectly, via Lighthouse's mobile
 * preset) performance check runs at. 375/390/768/1024 are the
 * `2026-09-13-discord-post-readiness` regression set; 640/767/769/1280/1536
 * are new.
 */
export const QUALITY_WIDTHS = [375, 390, 640, 767, 768, 769, 1024, 1280, 1536] as const;

/**
 * Color schemes the axe suite emulates by writing `localStorage["vex-theme"]`
 * before navigation — the same key `@vexcms/react/server`'s `ThemeScript`
 * reads before first paint.
 */
export const QUALITY_THEMES = ["light", "dark"] as const;

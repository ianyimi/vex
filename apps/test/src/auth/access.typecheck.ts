import type { MutationCallActionFor, QueryCallActionFor } from "@vexcms/core";

/**
 * Compile-time pins for the slug-aware `access.action` unions. No test runner —
 * `pnpm typecheck` IS the assertion, so these hold on every www check.
 *
 * They pin the STRICT arms of `QueryCallActionFor` / `MutationCallActionFor`, which
 * only exist once `vex generate` has augmented `CustomActionsBySlug` — core's suite
 * runs unaugmented and can only see the permissive fallback. Two regressions led
 * here, both invisible to core:
 *
 * 1. The emitter wrote `CustomActionsBySlugs` (trailing `s`): the augmentation key
 *    never matched, the registry silently resolved to `{}`, and every call fell back
 *    to the permissive union — custom verbs vanished from completions.
 * 2. The unions carried `| DraftAction`: `QueryAction` already includes `readDrafts`,
 *    so the only effect was offering `saveDraft`/`publish`/`unpublish` — mutation
 *    verbs — on every query position.
 *
 * If a declared custom action changes in `access.ts`, update the matching line here:
 * that is this file working, not breaking.
 */

type PagesQuery = QueryCallActionFor<"pages">;
type ArticlesQuery = QueryCallActionFor<"articles">;
type ArticlesMutation = MutationCallActionFor<"articles">;

// ── pages: no custom actions declared — query side is exactly read | readDrafts ──
const pagesRead: PagesQuery = "read";
const pagesReadDrafts: PagesQuery = "readDrafts";
// @ts-expect-error — pages declares no custom actions; a once-declared verb must
// stop compiling the moment its declaration is removed (this line previously held
// `"test"` as a POSITIVE assertion while access.ts declared it)
const pagesTest: PagesQuery = "test";
// @ts-expect-error — publish is articles' MUTATION verb, never a pages query verb
const pagesPublish: PagesQuery = "publish";
// @ts-expect-error — saveDraft is mutation-shaped, never offered on a query
const pagesSaveDraft: PagesQuery = "saveDraft";
// @ts-expect-error — listFeatured belongs to articles, not pages
const pagesListFeatured: PagesQuery = "listFeatured";
// @ts-expect-error — arbitrary strings are rejected post-generation
const pagesNonsense: PagesQuery = "nonsense";

// ── articles: custom verbs land on their declared side only ────────────────
const articlesListFeatured: ArticlesQuery = "listFeatured";
const articlesPublish: ArticlesMutation = "publish";
const articlesSaveDraft: ArticlesMutation = "saveDraft";
// @ts-expect-error — readDrafts is query-shaped, never a mutation verb
const articlesReadDrafts: ArticlesMutation = "readDrafts";
// @ts-expect-error — listFeatured is articles' QUERY verb, not a mutation
const articlesListFeaturedM: ArticlesMutation = "listFeatured";

// Consumed so no-unused-vars stays quiet; the assignments above are the assertions.
export const accessActionTypePins = [
  pagesRead,
  pagesReadDrafts,
  pagesTest,
  pagesPublish,
  pagesSaveDraft,
  pagesListFeatured,
  pagesNonsense,
  articlesListFeatured,
  articlesPublish,
  articlesSaveDraft,
  articlesReadDrafts,
  articlesListFeaturedM,
] as const;

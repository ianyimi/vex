/**
 * Maps a `pages` document's slug to its public path. Shared by `vex.config.ts`'s
 * `routes.map` and `pages.ts`'s `admin.livePreview.url`.
 */
export function resolvePagePath(slug: string | undefined): string | undefined {
  if (!slug) {
    return undefined;
  }
  return slug === "home" ? "/" : `/${slug}`;
}

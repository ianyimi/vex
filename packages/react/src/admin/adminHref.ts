import { addLeadingSlash } from "@vexcms/core";
import { MODALS } from "../modals/constants";

/**
 * Target an admin panel URL points at — the one discriminated union every
 * hand-built `${basePath}/...` string in this package is replaced with.
 *
 * `"create"` is not a separate route: creating a document opens a modal on
 * the collection's own list view (`CollectionListView`), so it resolves to
 * the SAME path as `"collection"` plus the create-modal's `nuqs` query
 * param. Media's own "Upload" action uses a DIFFERENT modal
 * (`MODALS.uploadMedia`) and is left to its call site to append — `"create"`
 * only knows about `MODALS.createDocument`.
 */
export type AdminHrefTarget =
  | { type: "dashboard" }
  | { type: "collection"; slug: string }
  | { type: "global"; slug: string }
  | { type: "document"; slug: string; id: string }
  | { type: "create"; slug: string };

/**
 * Builds an admin panel URL from a target and the project's configured
 * `basePath` — the one place every admin link in `@vexcms/react` (and, via
 * re-export, `@vexcms/next`) computes a path. Replaces 30 hand-built
 * `` `${basePath}/...` `` / hardcoded `"/admin/..."` call sites across the
 * nav, breadcrumb, dashboard, list views, and all 16 field types' `Cell.tsx`
 * title links (Step 17 audit finding 7) — grep for `adminHref(` to confirm
 * no hand-built admin URL remains outside this file.
 *
 * URL shape is UNCHANGED from what every call site already produced —
 * `/{basePath}/{slug}`, `/{basePath}/globals/{slug}`,
 * `/{basePath}/{slug}/{id}`. Launch spec H moves collections to
 * `/admin/collections/<slug>`; once it lands, that change is a one-file edit
 * here (plus the route parser `NextAdminLayoutClient.tsx` reads pathname
 * segments from — a separate, pre-existing concern this function does not
 * touch) instead of a 30-site grep.
 *
 * @param target - What the link points at.
 * @param basePath - The project's configured `VexClientConfig.basePath`
 *   (e.g. `config.basePath`), leading-slash-normalized internally via
 *   `addLeadingSlash` the same way every replaced call site already did.
 * @returns The absolute admin panel path for `target`.
 *
 * @example
 * ```ts
 * adminHref({ type: "dashboard" }, "/admin");                          // "/admin"
 * adminHref({ type: "collection", slug: "posts" }, "/admin");          // "/admin/posts"
 * adminHref({ type: "global", slug: "siteSettings" }, "/admin");       // "/admin/globals/siteSettings"
 * adminHref({ type: "document", slug: "posts", id: "abc" }, "/admin"); // "/admin/posts/abc"
 * adminHref({ type: "create", slug: "posts" }, "/admin");              // "/admin/posts?createNew=true"
 * ```
 */
export function adminHref(target: AdminHrefTarget, basePath: string): string {
  const root = addLeadingSlash(basePath);
  switch (target.type) {
    case "dashboard":
      return root;
    case "collection":
      return `${root}/${target.slug}`;
    case "global":
      return `${root}/globals/${target.slug}`;
    case "document":
      return `${root}/${target.slug}/${target.id}`;
    case "create":
      return `${root}/${target.slug}?${MODALS.createDocument.urlParam}=true`;
  }
}

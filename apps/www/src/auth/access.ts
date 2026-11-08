import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import { footers, headers, images, leads, pages, posts, products, testimonials, themes, users } from "~/vexcms/collections";
import { siteSettings } from "~/vexcms/globals";

const readOnly = {
  "*": false,
  read: true,
};

/**
 * `pages.versions.drafts: true` (versioning-drafts spec) adds five actions to `pages`'
 * permission surface — `readDrafts`, `saveDraft`, `publish`, `unpublish`,
 * `deleteVersions` (`DRAFT_ACTIONS`, `@vexcms/core`) — beside the CRUD set every
 * resource already carries. Neither role below needed a new entry to gate them:
 * - `[USER_ROLES.admin]`'s blanket `"*": true` already covers every action on every
 *   resource, drafts included.
 * - `[USER_ROLES.user]`'s `pages: readOnly` (`"*": false, read: true`) already denies
 *   every action it does not name, drafts included — the same default-deny posture
 *   that already denies `create`/`update`/`delete` here. `anonRole` resolves
 *   to `user`, so this is also what an unauthenticated visitor gets.
 * `convex/pages.ts`'s `getBySlugPreview` is the only caller that requests `readDrafts`
 * explicitly (`access: { action: DRAFT_ACTIONS.readDrafts }`); every other draft
 * action is exercised only from the admin panel, which always runs as `admin`.
 */
export const access = defineAccess({
  anonRole: USER_ROLES.user,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  resources: [images, users, pages, posts, siteSettings, themes, headers, footers, testimonials, products, leads],
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
    },
    [USER_ROLES.user]: {
      "*": false,
      pages: readOnly,
      posts: readOnly,
      adminPanel: {
        access: true,
        impersonate: false,
      },
      themes: readOnly,
      images: readOnly,
      // ── Live-demo content (anonymous visitors resolve to this role via `anonRole`).
      // Read-only is enforced server-side by default-deny, not by hiding buttons.
      // `readViews` makes the preset tabs visible; createView/updateView/deleteView stay
      // denied by `"*": false` (view actions are collection-level booleans).
      //
      // Testimonials: every public field EXCEPT `internalScore` — the "Needs Review"
      // preset's hidden `where` filters on exactly that field, so this role sees the
      // hidden-filter badge on that tab and never the filter's own value.
      testimonials: {
        "*": false,
        read: () => ({ "*": true, internalScore: false }),
        readViews: true,
      },
      // Headers/Footers: read-only, so the demo visitor can browse the site-chrome
      // collections (incl. `headers`' live-preview config).
      headers: readOnly,
      footers: readOnly,
      // Products: fully readable — the contrast case proving the UI hides exactly the
      // denied fields elsewhere, nothing more.
      products: {
        "*": false,
        read: true,
        readViews: true,
      },
      // Leads: the hidden-fields showcase — contact email, lead score, and sales notes
      // are admin-only. "Hot Leads" filters on `score` → hidden-filter badge.
      leads: {
        "*": false,
        read: () => ({ "*": true, email: false, score: false, internalNotes: false }),
        readViews: true,
      },
      // Users: name only, so `contributorId` relationship cells resolve their title
      // (`useAsTitle: "name"`) without exposing emails or any other Better Auth field.
      user: {
        "*": false,
        read: () => ({ name: true }),
      },
      // `_creationTime` added (Part 6 — "hidden unless listed" now applies to system
      // fields too): this role's field map previously implicitly kept it visible;
      // listed explicitly here so a real signed-in `user` (and the anonymous visitor
      // `anonRole` resolves to) doesn't silently lose it. `updatedAt` is NOT a valid
      // key on `siteSettings` — a global, not versioned (confirmed via typecheck:
      // "field map returns a field not on this resource").
      siteSettings: {
        "*": false,
        read: () => ({
          adminTheme: true,
          ogImage: true,
          name: true,
          description: true,
          _creationTime: true,
        }),
        update: () => ({ adminTheme: true }),
      },
    },
  },
});

import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import {
  articles,
  caseStudies,
  changelog,
  comments,
  fields,
  footers,
  headers,
  images,
  pages,
  posts,
  telemetryEvents,
  telemetryProjects,
  testimonials,
  themes,
  users,
} from "~/vexcms/collections";
import { announcement, nav, siteSettings } from "~/vexcms/globals";

import { ownOnly, readOwn, readPublished } from "./permissions";

export const access = defineAccess({
  // enabled: false,
  anonRole: USER_ROLES.guest,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
  resources: [
    footers,
    headers,
    images,
    pages,
    themes,
    users,
    articles,
    caseStudies,
    changelog,
    comments,
    nav,
    siteSettings,
    posts,
    announcement,
    fields,
    testimonials,
    telemetryEvents,
    telemetryProjects,
  ],
  customResources: {
    edit: {
      actions: ["save", "download"],
    },
  },
  customActions: {
    articles: {
      query: ["listFeatured"],
      mutation: ["publish"],
    },
  },
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
      telemetryEvents: {
        "*": false,
        read: true,
        readViews: true,
        createView: true,
        updateView: true,
        deleteView: true,
      },
      telemetryProjects: {
        "*": false,
        read: true,
        readViews: true,
        createView: true,
        updateView: true,
        deleteView: true,
      },
    },

    // ── Guest: anonymous demo session (Polish — anonymous admin access). Exclusively
    // used by Better Auth anonymous sessions via `anonRole` below — no real account is
    // ever assigned this role (confirmed via `npx convex data user`: every row carrying
    // `roles: ["guest"]` has `isAnonymous: true`). Curated to visibly demonstrate
    // field-level read filtering in the list, peek, and saved views: `posts` and
    // `fields` each expose a deliberately partial field set (the UI must hide exactly
    // these fields, nothing more/less); `pages` stays fully readable (every field) as
    // the contrast case. `readViews` on both so shared views are visible too. No
    // create/update/delete anywhere — read-only, enforced server-side like every other
    // role, not by hiding buttons.
    [USER_ROLES.guest]: {
      "*": false,
      adminPanel: {
        access: true,
        impersonate: false,
      },
      pages: {
        "*": false,
        read: true,
      },
      // `updatedAt` readable (Part 6 — system/UI fields in field maps); `vex_status`/
      // `_creationTime` deliberately stay hidden/unlisted — the demo for "hiding a
      // system field" alongside the data-field hiding `title`/`slug`/`body` already show.
      posts: {
        "*": false,
        read: () => ({ "*": false, title: true, slug: true, body: true, updatedAt: true }),
        readViews: true,
      },
      // `wordCount` (a `ui()` field, no stored value, Part 6) deliberately stays
      // unlisted — its own `Cell` reads `bio`, already hidden, so it already showed 0
      // for this role before this map could even name it; naming it here would just
      // show that same meaningless 0 in its own column instead of hiding the column.
      fields: {
        "*": false,
        read: () => ({
          contactEmail: true,
          title: true,
          settings: true,
          body: true,
          relatedUser: true,
        }),
        readViews: true,
      },
      // Testimonials: anonymous visitors see every public field EXCEPT
      // `internalScore` (a field-level read restriction demo) —
      // the "Needs Review" preset view's hidden `where` filters on exactly
      // that field, so this role sees the hidden-filter badge on that tab
      // and never the filter's own value. `readViews` on so all 3 preset
      // tabs are visible, read-only (no create/update/delete).
      testimonials: {
        "*": false,
        read: () => ({ "*": true, internalScore: false }),
        readViews: true,
      },
    },

    // ── Editor: full editorial control, no ownership restriction ────────────
    [USER_ROLES.editor]: {
      "*": false,
      articles: true,
      case_studies: true,
      changelog: true,
      comments: true,
      // Full editorial control over testimonials, including the full
      // VIEW_ACTIONS matrix (readViews/createView/updateView/deleteView —
      // an "allowed role" demo, contrasted with contributor below).
      testimonials: true,
      // Full draft workflow on posts. May draft the announcement but not
      // publish/unpublish it — exercises the disabled-Publish path.
      posts: true,
      announcement: {
        "*": true,
        publish: false,
        unpublish: false,
      },
      adminPanel: {
        access: true,
        impersonate: false,
      },
    },

    // ── Contributor: same matrix, own rows only ─────────────────────────────
    // Identical structure to `editor`; the difference is visible on one axis, which is
    // the point of reading the whole config top to bottom.
    [USER_ROLES.contributor]: {
      "*": false,
      articles: {
        read: readOwn(articles, "authorId"),
        create: true,
        update: ownOnly(articles, "authorId"),
        delete: ownOnly(articles, "authorId"),
      },
      case_studies: {
        read: readOwn(caseStudies, "authorId"),
        create: true,
        update: ownOnly(caseStudies, "authorId"),
        delete: ownOnly(caseStudies, "authorId"),
      },
      changelog: {
        read: readOwn(changelog, "authorId"),
        create: true,
        update: ownOnly(changelog, "authorId"),
        delete: ownOnly(changelog, "authorId"),
      },
      comments: {
        read: readOwn(comments, "authorId"),
        create: true,
        update: ownOnly(comments, "authorId"),
        delete: ownOnly(comments, "authorId"),
      },
      // May draft posts but not change `slug` in a draft — the same field map on
      // `saveDraft` as on `update` (launch-plan acceptance criterion). No
      // publish/unpublish: drafts only.
      posts: {
        read: true,
        readDrafts: true,
        create: true,
        update: () => ({ "*": true, slug: false }),
        saveDraft: () => ({ "*": true, slug: false }),
      },
      // Testimonials: can read (minus `internalScore`, denied field) and
      // update (so the row/bulk actions can be exercised), may read saved
      // views, but `createView`/`updateView`/`deleteView` are all denied —
      // a "denied role" VIEW_ACTIONS demo (boolean + a callback
      // form, with a `{ user }`-only callback shape).
      testimonials: {
        "*": false,
        read: () => ({ "*": true, internalScore: false }),
        update: true,
        readViews: true,
        createView: ({ user }) => user.roles?.includes(USER_ROLES.contributor) === true,
        updateView: false,
        deleteView: false,
      },
      adminPanel: {
        access: true,
        impersonate: false,
      },
    },

    // ── Reviewer: read/update `fields` + admin, no access to `user` at all ──
    // `fields` is the one resource this role names, so its `relatedUser`
    // relationship (pointing at a `user` document) hits the default-deny
    // posture for the unnamed `user` resource below — the `AccessDeniedItemRow`
    // locked-row demo on that field.
    [USER_ROLES.reviewer]: {
      "*": false,
      fields: {
        "*": false,
        read: true,
        update: true,
      },
      adminPanel: {
        access: true,
        impersonate: false,
      },
    },

    // ── User: public reader ────────────────────────────────────────────────
    [USER_ROLES.user]: {
      "*": false,
      user: {
        "*": false,
        read: {
          withIndex: ({ user }) => ({
            name: "by_email",
            range: (ix) => ix.eq("email", user.email),
          }),
        },
      },
      articles: {
        "*": false,
        read: readPublished(articles, "status"),
      },
      case_studies: {
        "*": false,
        read: readPublished(caseStudies, "status"),
      },
      changelog: {
        "*": false,
        read: readPublished(changelog, "status"),
      },
      comments: {
        // No `status` on comments, so moderation state is the gate instead. A plain
        // callback is the right tool and needs no helper — `approved` leads no index,
        // so there is nothing to push down.
        "*": false,
        read: ({ data }) => data?.approved === true,
      },
      // Published content only: no `readDrafts`, so drafts never reach a reader.
      posts: {
        "*": false,
        read: true,
      },
      announcement: {
        "*": false,
        read: true,
      },
      // Testimonials: public reader sees only approved testimonials, minus
      // `internalScore`; read-only, no saved-view permissions at all — the
      // signed-out/`guest` role's exact mirror but for a real signed-in
      // "denied role" (no `readViews`, so preset tabs collapse to just the
      // default view for this role).
      testimonials: {
        "*": false,
        read: () => ({ "*": true, internalScore: false }),
      },
      images: {
        "*": false,
        read: {
          where: ({ q }) => q.gt("size", 50000),
          filter({ data: image }) {
            return image.mimeType.includes("image");
          },
        },
        update: {
          where: ({ q }) => q.gt("size", 50000),
        },
      },
      edit: {
        "*": false,
        save: true,
      },
      pages: {
        "*": false,
        read: true,
        // update: true,
      },
      adminPanel: {
        access: true,
        impersonate: false,
      },
      nav: {
        "*": true,
      },
      // `_creationTime` added (Part 6 — "hidden unless listed" now applies to system
      // fields too): this role's field map previously implicitly kept it visible;
      // listed explicitly here so a real signed-in `user` doesn't silently lose it.
      // `updatedAt` is NOT a valid key on `siteSettings` — a global, not versioned
      // (confirmed via typecheck: "field map returns a field not on this resource").
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
      themes: {
        "*": false,
        read: true,
      },
    },
  },
});

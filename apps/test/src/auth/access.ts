import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import {
  articles,
  caseStudies,
  changelog,
  comments,
  footers,
  headers,
  images,
  pages,
  themes,
} from "~/vexcms/collections";
import { nav, siteSettings } from "~/vexcms/globals";

import { ownOnly, readOwn, readPublished } from "./permissions";

export const access = defineAccess({
  // enabled: false,
  anonRole: USER_ROLES.user,
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
    articles,
    caseStudies,
    changelog,
    comments,
    nav,
    siteSettings,
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
    },

    // ── Editor: full editorial control, no ownership restriction ────────────
    [USER_ROLES.editor]: {
      "*": false,
      articles: true,
      case_studies: true,
      changelog: true,
      comments: true,
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
          constraints: ({ user, q }) => q.withIndex("by_email", (fq) => fq.eq("email", user.email)),
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
      images: {
        "*": false,
        read: {
          constraints: ({ q }) => q.filter((fq) => fq.gt("size", 50000)),
          filter({ data: image }) {
            return image.mimeType.includes("image");
          },
        },
        update: {
          constraints: ({ q }) => q.filter((fq) => fq.gt("size", 50000)),
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
      siteSettings: {
        "*": true,
      },
      themes: {
        "*": true,
      },
    },
  },
});

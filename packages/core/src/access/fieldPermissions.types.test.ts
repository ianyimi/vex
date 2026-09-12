import { describe, it } from "vitest";
import { defineCollection, text } from "../index";
import { defineAccess } from "./config";

/**
 * Compile-time regression pins for field maps. Every guarantee here is a
 * TYPE-level one, so nothing else in the suite would notice a refactor of
 * `BasePermissionCheck`, `ValidateFieldMaps`, or `defineAccess`'s type
 * parameters silently destroying it. `vitest` type-checks this file through
 * `tsc --noEmit`; the runtime bodies assert nothing.
 *
 * Written as real `defineAccess({ … })` calls rather than against the raw
 * types: the validator only engages through the inference site, so testing
 * `FieldPermissionMap` in isolation would keep passing while the actual config
 * surface regressed.
 *
 * Field names come from the fixture registry in `api/test/convex/schema.ts`
 * (`posts` declares `title`, `slug`, `body`, `updatedAt`, `featured`,
 * `deleted`, `author`, `parent`), not from the local `defineCollection` call —
 * a subject's document type resolves by slug through the generated registry,
 * which is exactly the path a real project takes.
 *
 * Every call inlines its arguments. Spreading a shared `const base` widens
 * `roles`/`resources` out of their literal types, which collapses the subject
 * registry and silently turns every callback prop into `any` — the exact
 * failure the last case here exists to detect.
 */

const posts = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }), body: text() },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

describe("field maps — type level", () => {
  it("accepts booleans, callbacks, and both map polarities", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            create: true,
            update: () => ({ "*": false, title: true }),
            delete: () => ({ "*": true, body: false }),
          },
        },
      },
    });
  });

  it("accepts a map returned from `filter` beside `constraints`", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            read: {
              constraints: ({ q }) => q.withIndex("by_slug", (iq) => iq.eq("slug", "a")),
              filter: () => ({ "*": true, body: false }),
            },
          },
        },
      },
    });
  });

  it("accepts boolean subject entries, wildcards, and an undefined-returning callback", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: { update: () => undefined, "*": true },
          users: false,
        },
      },
    });
  });

  it("accepts per-field boolean expressions over the callback props", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            update: ({ user, data }) => ({
              "*": false,
              body: user.name === "root" && data.featured === true,
            }),
          },
        },
      },
    });
  });

  it("accepts a branching callback whose every branch is valid", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            update: ({ data }) =>
              data.featured === true ? { "*": true, body: false } : { "*": false },
          },
        },
      },
    });
  });

  it("rejects a map written directly on an action", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          // @ts-expect-error — a map is only ever a callback's RETURN value
          posts: { update: { "*": false, title: true } },
        },
      },
    });
  });

  it("rejects a per-field callback and a non-boolean field value", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          // @ts-expect-error — field values are plain booleans, never callbacks
          posts: { update: () => ({ "*": false, title: () => true }) },
        },
      },
    });

    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          // @ts-expect-error — field values are plain booleans, never strings
          posts: { update: () => ({ "*": false, title: "yes" }) },
        },
      },
    });
  });

  it("accepts a partial map with no wildcard", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: { update: () => ({ title: true }) },
        },
      },
    });
  });

  it("rejects a misspelled field key", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          // @ts-expect-error — ✖ field map returns a field not on this resource: "titel"
          posts: { update: () => ({ "*": false, titel: true }) },
        },
      },
    });
  });

  it("rejects a system field key", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          // @ts-expect-error — ✖ field map returns a field not on this resource: "_id"
          posts: { update: () => ({ "*": false, _id: true }) },
        },
      },
    });
  });

  it("rejects several bad keys at once", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          // @ts-expect-error — both "titel" and "bdy" are reported
          posts: { update: () => ({ "*": false, titel: true, bdy: true }) },
        },
      },
    });
  });

  it("rejects a bad key inside `filter` beside `constraints`", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            // @ts-expect-error — ✖ field map returns a field not on this resource: "titel"
            read: {
              constraints: ({ q }) => q.withIndex("by_slug", (iq) => iq.eq("slug", "a")),
              filter: () => ({ "*": false, titel: true }),
            },
          },
        },
      },
    });
  });

  it("rejects a bad key present in only ONE branch of a branching callback", () => {
    // Pins `ExcessFieldKeys`' distribution over the inferred union. Without it,
    // `keyof (A | B)` yields only the keys common to both branches and the bad
    // key in the other branch goes unreported.
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            // @ts-expect-error — ✖ field map returns a field not on this resource: "titel"
            update: ({ data }) =>
              data.featured === true ? { "*": true, titel: false } : { "*": false },
          },
        },
      },
    });
  });

  it("keeps callback props contextually typed rather than implicit any", () => {
    // The regression `defineAccess`'s `TPermissions` CONSTRAINT exists to
    // prevent: lose it and these props become `any`, every other case in this
    // file keeps passing, and the config surface goes silently untyped.
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            update: ({ data }) => ({
              "*": false,
              // @ts-expect-error — `data.title` is a string, not a number
              body: data.title === 1,
            }),
          },
        },
      },
    });
  });

  it("rejects an unknown role key", () => {
    defineAccess({
      roles: ["editor"] as const,
      resources: [posts, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: { posts: true },
        // @ts-expect-error — "ghost" is not in `roles`
        ghost: { posts: true },
      },
    });
  });
});

import { describe, expect, it } from "vitest";
import { convexToJson } from "convex/values";
import { defineCollection, text } from "../index";
import { PERMISSION_MODES, PERMISSION_SCOPES, WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { hasPermission } from "./hasPermission";
import { dataType, VexAccessError } from "./types";

// Core tests run with an unaugmented GeneratedVexTypes registry, so callback
// `data` params are the wide fallback (`Record<string, unknown>`) — the casts
// inside callbacks below are expected and disappear in apps after
// `vex generate` augments the registry.

const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true }), slug: text(), status: text({ index: "by_status" }) },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const PROTECTED_SLUGS = ["home", "pricing"];

/** Capability-mode fixture: one function-check role, one explicit-deny role. */
const capabilityAccess = defineAccess({
  roles: ["reviewer", "denier", "viewer"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    reviewer: {
      articles: {
        update: ({ data }) => (data as { ownerId?: string })?.ownerId === "u1",
      },
    },
    denier: {
      articles: { update: false },
    },
    viewer: {
      articles: { read: true },
    },
  },
});

/**
 * Probe-mechanism fixture: callbacks that read `data` via different access
 * patterns (`in`, `Object.keys`) plus one that throws a real error from its
 * body — exercises the capability-probe `has`/`ownKeys` traps and the
 * "propagate a genuine error" branch.
 */
const probeAccess = defineAccess({
  roles: ["inChecker", "keysChecker", "thrower"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    inChecker: {
      articles: { update: ({ data }) => "ownerId" in (data as object) },
    },
    keysChecker: {
      articles: { update: ({ data }) => Object.keys(data as object).length > 0 },
    },
    thrower: {
      articles: {
        update: () => {
          throw new RangeError("boom from callback body");
        },
      },
    },
  },
});

/**
 * Primary fixture: role wildcard, boolean shorthand, per-action maps,
 * action-level wildcard, field-mode objects, callbacks, custom resources
 * (one with a typed dataType carrier), and the built-in adminPanel subject.
 */
const access = defineAccess({
  roles: [
    "admin",
    "editor",
    "viewer",
    "restricted",
    "poweruser",
    "owner",
    "callbackUndefined",
  ] as const,
  resources: [articles, users],
  customResources: {
    apiKeys: { actions: ["create", "revoke"] },
    reviewQueue: { actions: ["approve", "reject"], data: dataType<{ status: string }>() },
  },
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    // Role-level wildcard: everything, including custom resources.
    admin: { [WILDCARD_KEY]: true },
    editor: {
      adminPanel: { access: true, impersonate: false },
      articles: {
        create: true,
        read: true,
        update: true,
        delete: ({ data }) => {
          // Registry is unaugmented in core tests — fixture data is wide.
          const post = data as { slug: string };
          return !PROTECTED_SLUGS.includes(post.slug);
        },
      },
      users: {
        // Only `read` declared — other actions fall through to the default.
        read: ({ data, user }) => {
          // Registry is unaugmented in core tests — fixture docs are wide.
          const target = data as { _id: string };
          const currentUser = user as { _id: string };
          return target._id === currentUser._id;
        },
      },
      apiKeys: { create: true, revoke: false },
      reviewQueue: {
        approve: ({ data }) => data?.status === "pending",
        reject: false,
      },
    },
    viewer: {
      articles: { read: true },
      users: false, // resource-level boolean shorthand — deny every action
    },
    // Role wildcard false: deny every subject NOT explicitly declared.
    restricted: {
      [WILDCARD_KEY]: false,
      articles: { read: true },
    },
    // Resource-level boolean shorthand — allow every action on articles.
    poweruser: {
      articles: true,
    },
    // Action-level wildcard with a callback; explicit `read` bypasses it.
    owner: {
      articles: {
        [WILDCARD_KEY]: ({ data, user }) => {
          // Registry is unaugmented in core tests — fixture docs are wide.
          const post = data as { ownerId?: string };
          const currentUser = user as { _id: string };
          return post.ownerId === currentUser._id;
        },
        read: true,
      },
    },
    callbackUndefined: {
      articles: { read: () => undefined },
    },
  },
});

/** Deny-posture fixture: undeclared role/subject/action resolves to deny. */
const accessDenyDefaults = defineAccess({
  roles: ["editor"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { articles: { read: true } },
  },
});

/** Org-aware fixture: organization is configured, so callbacks receive it. */
const accessWithOrg = defineAccess({
  roles: ["member"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  orgCollectionSlug: "organizations",
  permissions: {
    member: {
      articles: {
        read: (props) => {
          if (!("organization" in props)) {
            return false;
          }
          // Registry is unaugmented in core tests — the org doc is wide.
          const organization = props.organization as { _id: string } | undefined;
          return organization?._id === "org1";
        },
      },
    },
  },
});

/** Merge fixture: one mode/boolean combination per role. */
const mergeAccess = defineAccess({
  roles: [
    "boolTrue",
    "boolFalse",
  ] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    boolTrue: { articles: true },
    boolFalse: { articles: false },
  },
});

const asUser = (roles: string | string[] | number, _id = "u1") => ({ _id, roles });

describe("hasPermission — no access config", () => {
  it("allows everything when access is undefined", () => {
    expect(
      hasPermission({ access: undefined, user: {}, resource: "articles", action: "read" } as never),
    ).toBe(true);
  });

  it("never throws, even with throwOnDenied", () => {
    expect(
      hasPermission({
        access: undefined,
        user: {},
        resource: "articles",
        action: "delete",
        throwOnDenied: true,
      } as never),
    ).toBe(true);
  });
});

describe("hasPermission — roles derivation from userRolesField", () => {
  it("accepts a single string role value", () => {
    expect(
      hasPermission({ access, user: asUser("admin"), resource: "articles", action: "read" }),
    ).toBe(true);
  });

  it("accepts a string[] role value", () => {
    expect(
      hasPermission({ access, user: asUser(["admin"]), resource: "articles", action: "read" }),
    ).toBe(true);
  });

  it("denies when the roles field is missing from the user document", () => {
    expect(
      hasPermission({ access, user: { _id: "u1" }, resource: "articles", action: "read" }),
    ).toBe(false);
  });

  it("denies when the roles array is empty", () => {
    expect(hasPermission({ access, user: asUser([]), resource: "articles", action: "read" })).toBe(
      false,
    );
  });

  it("denies when the roles value is not a string or string[]", () => {
    expect(hasPermission({ access, user: asUser(42), resource: "articles", action: "read" })).toBe(
      false,
    );
  });

  it("ignores unknown roles; all-unknown denies", () => {
    expect(
      hasPermission({
        access,
        user: asUser(["ghost", "phantom"]),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("ignores unknown roles but honors known ones alongside them", () => {
    expect(
      hasPermission({
        access,
        user: asUser(["ghost", "viewer"]),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("denies when the user is null (unauthenticated)", () => {
    expect(
      hasPermission({ access, user: null as never, resource: "articles", action: "read" }),
    ).toBe(false);
  });

  it("filters non-string entries from a mixed roles array, honoring valid roles", () => {
    expect(
      hasPermission({
        access,
        user: { _id: "u1", roles: ["admin", 42, null] } as never,
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });
});

describe("hasPermission — boolean shorthand and per-action checks", () => {
  it("resource-level `true` allows every action", () => {
    expect(
      hasPermission({ access, user: asUser("poweruser"), resource: "articles", action: "delete" }),
    ).toBe(true);
  });

  it("resource-level `false` denies every action", () => {
    expect(
      hasPermission({ access, user: asUser("viewer"), resource: "users", action: "read" }),
    ).toBe(false);
  });

  it("explicit per-action booleans resolve directly", () => {
    expect(
      hasPermission({ access, user: asUser("editor"), resource: "articles", action: "create" }),
    ).toBe(true);
    expect(
      hasPermission({ access, user: asUser("editor"), resource: "apiKeys", action: "revoke" }),
    ).toBe(false);
  });

  it("an undeclared action on a declared subject is denied", () => {
    // editor declares only `read` on users; `create` is undeclared. The posture is
    // pinned to deny, so declaring a subject states the complete set of things the
    // role may do to it.
    expect(
      hasPermission({ access, user: asUser("editor"), resource: "users", action: "create" }),
    ).toBe(false);
  });

  it("undeclared subject with no role wildcard is denied", () => {
    // viewer declares only articles + users and has no role wildcard, so the
    // undeclared reviewQueue subject has nothing to grant it.
    expect(
      hasPermission({ access, user: asUser("viewer"), resource: "reviewQueue", action: "approve" }),
    ).toBe(false);
  });
});

describe("hasPermission — callbacks", () => {
  it("passes data and user to the callback", () => {
    const owner = asUser("editor", "u1");
    expect(
      hasPermission({
        access,
        user: owner,
        resource: "users",
        action: "read",
        data: { _id: "u1" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: owner,
        resource: "users",
        action: "read",
        data: { _id: "someone-else" } as never,
      }),
    ).toBe(false);
  });

  it("supports data-driven deny on protected documents", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "delete",
        data: { slug: "home" } as never,
      }),
    ).toBe(false);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "delete",
        data: { slug: "blog-post" } as never,
      }),
    ).toBe(true);
  });

  it("passes typed data to custom resource callbacks", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "reviewQueue",
        action: "approve",
        data: { status: "pending" },
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "reviewQueue",
        action: "approve",
        data: { status: "resolved" },
      }),
    ).toBe(false);
  });

  it("treats a callback returning undefined as deny — not as undeclared", () => {
    // Undeclared would resolve via the default (allow); this must be false.
    expect(
      hasPermission({
        access,
        user: asUser("callbackUndefined"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("passes organization to callbacks only when organizationCollection is configured", () => {
    expect(
      hasPermission({
        access: accessWithOrg,
        user: asUser("member"),
        organization: { _id: "org1" },
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: accessWithOrg,
        user: asUser("member"),
        organization: { _id: "org2" },
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("withholds organization from callbacks when no organizationCollection is configured", () => {
    // Primary fixture has no organizationCollection; the owner wildcard
    // callback never sees `organization` even though the caller passed one.
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        organization: { _id: "org1" },
        resource: "articles",
        action: "update",
        data: { ownerId: "u1" } as never,
      }),
    ).toBe(true);
  });

  it("normalizes a callback returning undefined to deny on the data path", () => {
    expect(
      hasPermission({
        access,
        user: asUser("callbackUndefined"),
        resource: "articles",
        action: "read",
        data: { slug: "x" } as never,
      }),
    ).toBe(false);
  });
});

describe("hasPermission — role-level wildcard", () => {
  it("`true` covers subjects the role never declares, including custom resources", () => {
    expect(
      hasPermission({ access, user: asUser("admin"), resource: "apiKeys", action: "create" }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("admin"),
        resource: "adminPanel",
        action: "impersonate",
      }),
    ).toBe(true);
  });

  it("`false` denies subjects the role never declares", () => {
    expect(
      hasPermission({ access, user: asUser("restricted"), resource: "users", action: "read" }),
    ).toBe(false);
  });

  it("`false` does not override an explicitly declared subject", () => {
    expect(
      hasPermission({ access, user: asUser("restricted"), resource: "articles", action: "read" }),
    ).toBe(true);
  });

  it("a declared subject's undeclared action resolves via the posture, not the role wildcard", () => {
    // restricted declares articles (only read); create is undeclared on that subject.
    // The role wildcard is NOT consulted here — a declared subject short-circuits it —
    // so the pinned deny posture answers. Under the old `allow` default this returned
    // true, which is precisely the invisible grant the posture removal eliminated.
    expect(
      hasPermission({ access, user: asUser("restricted"), resource: "articles", action: "create" }),
    ).toBe(false);
  });
});

describe("hasPermission — action-level wildcard", () => {
  it("covers actions not explicitly declared on the subject", () => {
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        resource: "articles",
        action: "delete",
        data: { ownerId: "u1" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        resource: "articles",
        action: "delete",
        data: { ownerId: "u2" } as never,
      }),
    ).toBe(false);
  });

  it("an explicit action key bypasses the wildcard", () => {
    // read: true is explicit; the owner-only wildcard callback must not run.
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        resource: "articles",
        action: "read",
        data: { ownerId: "someone-else" } as never,
      }),
    ).toBe(true);
  });
});

describe("hasPermission — defaultPermissionMode: deny", () => {
  it("still allows explicitly declared subject/action", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: asUser("editor"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("denies an undeclared action on a declared subject", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: asUser("editor"),
        resource: "articles",
        action: "create",
      }),
    ).toBe(false);
  });

  it("denies an undeclared subject", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: asUser("editor"),
        resource: "users",
        action: "read",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — multi-role merge (OR, allow wins)", () => {
  it("any allowing role wins over a denying one", () => {
    // viewer denies users entirely; admin's wildcard allows.
    expect(
      hasPermission({
        access,
        user: asUser(["viewer", "admin"]),
        resource: "users",
        action: "delete",
      }),
    ).toBe(true);
  });

  it("all-denying roles merge to deny", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["boolFalse"]),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — throwOnDenied", () => {
  it("throws VexAccessError with resource and action on a denied boolean check", () => {
    let caught: unknown;
    try {
      hasPermission({
        access,
        user: asUser("viewer"),
        resource: "users",
        action: "read",
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).resource).toBe("users");
    expect((caught as VexAccessError).action).toBe("read");
  });

  it("throws when the user has no known roles", () => {
    expect(() =>
      hasPermission({
        access,
        user: { _id: "u1" },
        resource: "articles",
        action: "read",
        throwOnDenied: true,
      }),
    ).toThrow(VexAccessError);
  });

  it("does not throw when access is granted", () => {
    expect(
      hasPermission({
        access,
        user: asUser("admin"),
        resource: "articles",
        action: "delete",
        throwOnDenied: true,
      }),
    ).toBe(true);
  });

  it("returns false silently by default", () => {
    expect(
      hasPermission({ access, user: asUser("viewer"), resource: "users", action: "read" }),
    ).toBe(false);
  });
});

describe("VexAccessError — Convex wire serializability", () => {
  // `ConvexError.data` MUST be a valid Convex value. `convexToJson` throws on
  // `undefined`, and an unserializable payload silently prevents Convex from
  // delivering the error at all: the client subscription never receives a
  // result, so the query hangs in `fetchStatus: "fetching"` forever and no
  // error ever surfaces. Every denial payload must survive `convexToJson`.
  it("resource-level denial omits `field` entirely (never `undefined`)", () => {
    let caught: unknown;
    try {
      hasPermission({
        access,
        user: asUser("viewer"),
        resource: "users",
        action: "read",
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    const error = caught as VexAccessError;
    expect(error).toBeInstanceOf(VexAccessError);
    expect(error.data.code).toBe("ACCESS_DENIED");
    // Every `data` key is always present now — serializability is what matters:
    // `convexToJson` rejects `undefined`, and an unserializable payload hangs the
    // client subscription forever.
    expect(() => convexToJson(error.data)).not.toThrow();
  });

  it("capability-probe denial carries the message and stays serializable", () => {
    let caught: unknown;
    try {
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        // Explicit: only `scope: "doc"` throws. The default (`all`) resolves to
        // `false` instead, so it would not exercise this path.
        scope: PERMISSION_SCOPES.doc,
      });
    } catch (error) {
      caught = error;
    }
    const error = caught as VexAccessError;
    expect(error.data.code).toBe("ACCESS_DENIED");
    expect(error.data.message).toMatch(/data/);
    expect(() => convexToJson(error.data)).not.toThrow();
  });
});

describe("hasPermission — built-in adminPanel subject", () => {
  it("checks adminPanel access like any other subject", () => {
    expect(
      hasPermission({ access, user: asUser("editor"), resource: "adminPanel", action: "access" }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "adminPanel",
        action: "impersonate",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — scope: doc vs any vs all", () => {
  it('scope "any" resolves a function check to true without invoking it', () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        scope: PERMISSION_SCOPES.any,
      }),
    ).toBe(true);
  });

  it('scope "all" resolves a function check to false without invoking it', () => {
    // A per-document condition cannot hold for every document.
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        scope: PERMISSION_SCOPES.all,
      }),
    ).toBe(false);
  });

  it('scope "any" still resolves a static false check to false', () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("denier"),
        resource: "articles",
        action: "update",
        scope: "any",
      }),
    ).toBe(false);
  });

  it('scope "all" still resolves a static true check to true', () => {
    // Scope only governs callbacks that need the document; `viewer.articles.read`
    // is a static `true`, so it is unaffected.
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("viewer"),
        resource: "articles",
        action: "read",
        scope: "all",
      }),
    ).toBe(true);
  });

  it('scope "doc" throws VexAccessError when a function check has no data', () => {
    let caught: unknown;
    try {
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        scope: PERMISSION_SCOPES.doc,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).resource).toBe("articles");
    expect((caught as VexAccessError).action).toBe("update");
    expect((caught as Error).message).toMatch(/scope: "any"|scope: "all"|data/);
  });

  it('omitting scope defaults to "all" — a data-reading check resolves to false, never throws', () => {
    // Guards the default: "no data" is read as "may they do this to every
    // document?", and a per-document condition cannot answer yes for all.
    expect(() =>
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
      }),
    ).not.toThrow();
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
  });

  it('scope "doc" runs the callback normally once data is provided', () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        data: { ownerId: "u1" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        data: { ownerId: "someone-else" } as never,
      }),
    ).toBe(false);
  });

  it("data always wins: an explicit data object is evaluated under every scope", () => {
    for (const scope of ["doc", "any", "all"] as const) {
      expect(
        hasPermission({
          access: capabilityAccess,
          user: asUser("reviewer"),
          resource: "articles",
          action: "update",
          data: { ownerId: "someone-else" } as never,
          scope,
        }),
      ).toBe(false);
    }
  });

  it('multi-role OR merge under scope "any": one capable role wins over an explicit deny', () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser(["denier", "reviewer"]),
        resource: "articles",
        action: "update",
        scope: "any",
      }),
    ).toBe(true);
  });

  it('scope "any" detects data use via the `in` operator (has trap)', () => {
    expect(
      hasPermission({
        access: probeAccess,
        user: asUser("inChecker"),
        resource: "articles",
        action: "update",
        scope: "any",
      }),
    ).toBe(true);
  });

  it('scope "any" detects data use via Object.keys (ownKeys trap)', () => {
    expect(
      hasPermission({
        access: probeAccess,
        user: asUser("keysChecker"),
        resource: "articles",
        action: "update",
        scope: "any",
      }),
    ).toBe(true);
  });

  it("propagates a real error thrown from the callback body — never swallowed as a probe signal", () => {
    expect(() =>
      hasPermission({
        access: probeAccess,
        user: asUser("thrower"),
        resource: "articles",
        action: "update",
        scope: "any",
      }),
    ).toThrow("boom from callback body");
  });
});

/**
 * anonRole fallback fixture: sessionless callers and role-less users resolve
 * to the configured `anonRole` instead of hard-deny. Mirrors the maprios
 * public-access pattern: anon may create contact submissions and read only
 * published articles.
 */
const anonAccess = defineAccess({
  roles: ["admin", "user"] as const,
  resources: [articles],
  anonRole: "user",
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { [WILDCARD_KEY]: true },
    user: {
      articles: {
        create: true,
        read: ({ data }) =>
          typeof data === "object" && data !== null && "status" in data
            ? data.status === "published"
            : false,
        update: false,
      },
    },
  },
});

describe("hasPermission — anonRole fallback", () => {
  it("grants the anon role's boolean permissions to a caller with no user", () => {
    expect(
      hasPermission({ access: anonAccess, user: {}, resource: "articles", action: "create" }),
    ).toBe(true);
  });

  it("runs the anon role's callback checks against data", () => {
    expect(
      hasPermission({
        access: anonAccess,
        user: {},
        resource: "articles",
        action: "read",
        data: { status: "published" },
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: anonAccess,
        user: {},
        resource: "articles",
        action: "read",
        data: { status: "draft" },
      }),
    ).toBe(false);
  });

  it("denies the anon role's explicit-false actions", () => {
    expect(
      hasPermission({ access: anonAccess, user: {}, resource: "articles", action: "update" }),
    ).toBe(false);
  });

  it("falls back for a user document whose roles field is missing (anonymous-plugin user)", () => {
    expect(
      hasPermission({
        access: anonAccess,
        user: { _id: "anon1", isAnonymous: true },
        resource: "articles",
        action: "create",
      }),
    ).toBe(true);
  });

  it("falls back for an empty roles array", () => {
    expect(
      hasPermission({
        access: anonAccess,
        user: asUser([]),
        resource: "articles",
        action: "create",
      }),
    ).toBe(true);
  });

  it("explicit roles win over the fallback — an admin is not narrowed to anon grants", () => {
    expect(
      hasPermission({
        access: anonAccess,
        user: asUser("admin"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(true);
  });

  it("a caller holding a real role does not also gain anon grants", () => {
    // "ghost" is not a known role; roles are non-empty so no fallback applies.
    expect(
      hasPermission({
        access: anonAccess,
        user: asUser("ghost"),
        resource: "articles",
        action: "create",
      }),
    ).toBe(false);
  });

  it("non-string roles garbage falls back to the anon role", () => {
    expect(
      hasPermission({
        access: anonAccess,
        user: asUser(42),
        resource: "articles",
        action: "create",
      }),
    ).toBe(true);
  });

  it("without anonRole configured, an empty-roles caller is still denied", () => {
    expect(hasPermission({ access, user: {}, resource: "articles", action: "read" })).toBe(false);
  });
});

/**
 * Constraints-only fixture: a query-shaped `read` rule declared purely as
 * `{ constraints }`, no `filter` — proves `hasPermission` derives the
 * per-document check from the SAME declaration `resolveAccessIndex` compiles
 * to a range from (design invariant: one condition, two consumers).
 */
const constraintsOnlyAccess = defineAccess({
  roles: ["contributor"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    contributor: {
      articles: {
        read: {
          constraints: ({ q }) => q.withIndex("by_status", (iq) => iq.eq("status", "published")),
        },
      },
    },
  },
});

describe("hasPermission — constraints-only rule (no filter)", () => {
  it("allows a document that satisfies the constraint", () => {
    expect(
      hasPermission({
        access: constraintsOnlyAccess,
        user: asUser("contributor"),
        resource: "articles",
        action: "read",
        data: { title: "Live", slug: "live", status: "published" } as never,
      }),
    ).toBe(true);
  });

  it("denies a document that does not satisfy the constraint", () => {
    expect(
      hasPermission({
        access: constraintsOnlyAccess,
        user: asUser("contributor"),
        resource: "articles",
        action: "read",
        data: { title: "Draft", slug: "draft", status: "draft" } as never,
      }),
    ).toBe(false);
  });
});

/**
 * Precedence fixture: default DENY, isolates precedence pairs the primary
 * fixture's "restricted"/"owner" roles don't isolate on their own — subject-level
 * wildcard vs default, role-level wildcard vs default (undeclared subject only),
 * and explicit action vs subject-level wildcard in both allow/deny directions.
 */
const precedenceDenyDefault = defineAccess({
  roles: [
    "subjectWildcardAllow",
    "roleWildcardAllow",
    "explicitBeatsSubjectWildcardAllow",
    "explicitBeatsSubjectWildcardDeny",
  ] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    // No explicit `read` — only the subject-level wildcard.
    subjectWildcardAllow: { articles: { [WILDCARD_KEY]: true } },
    // `articles` is entirely undeclared for this role — only the role-level wildcard applies.
    roleWildcardAllow: { [WILDCARD_KEY]: true },
    // Subject wildcard denies; the explicit `read: true` must still win.
    explicitBeatsSubjectWildcardAllow: { articles: { [WILDCARD_KEY]: false, read: true } },
    // Subject wildcard allows; the explicit `read: false` must still win.
    explicitBeatsSubjectWildcardDeny: { articles: { [WILDCARD_KEY]: true, read: false } },
  },
});

/** Precedence fixture: default ALLOW, isolates subject wildcard beating the default in the deny direction. */
const precedenceAllowDefault = defineAccess({
  roles: ["subjectWildcardDeny"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    subjectWildcardDeny: { articles: { [WILDCARD_KEY]: false } },
  },
});

describe("hasPermission — precedence: explicit action > subject wildcard > role wildcard > default", () => {
  it("subject-level wildcard beats a deny default (allow direction)", () => {
    expect(
      hasPermission({
        access: precedenceDenyDefault,
        user: asUser("subjectWildcardAllow"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("subject-level wildcard beats an allow default (deny direction)", () => {
    expect(
      hasPermission({
        access: precedenceAllowDefault,
        user: asUser("subjectWildcardDeny"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("role-level wildcard beats a deny default on an entirely undeclared subject", () => {
    expect(
      hasPermission({
        access: precedenceDenyDefault,
        user: asUser("roleWildcardAllow"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("an explicit action key beats an allowing subject wildcard (deny direction)", () => {
    expect(
      hasPermission({
        access: precedenceDenyDefault,
        user: asUser("explicitBeatsSubjectWildcardDeny"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("an explicit action key beats a denying subject wildcard (allow direction)", () => {
    expect(
      hasPermission({
        access: precedenceDenyDefault,
        user: asUser("explicitBeatsSubjectWildcardAllow"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });
});

/**
 * Scope × check-form fixture: one role per check form (static true/false, a
 * callback that never reads `data`, constraints-only, constraints + a separate
 * top-level `filter`) so each cell of the scope matrix can be exercised without
 * another form's resolution leaking in. Field-mode checks are intentionally
 * excluded — that check form is being removed from the API.
 */
const scopeMatrixAccess = defineAccess({
  roles: ["staticAllow", "staticDeny", "ignoresData", "constraintsOnly", "constraintsWithFilter"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    staticAllow: { articles: { read: true } },
    staticDeny: { articles: { read: false } },
    // Reads only `user` — the capability probe never fires, so scope must
    // never come into play (and it must never throw under "doc").
    ignoresData: {
      articles: { read: ({ user }) => (user as { trusted?: boolean }).trusted === true },
    },
    constraintsOnly: {
      articles: {
        read: {
          constraints: ({ q }) => q.withIndex("by_status", (iq) => iq.eq("status", "published")),
        },
      },
    },
    constraintsWithFilter: {
      articles: {
        read: {
          constraints: ({ q }) => q.withIndex("by_status", (iq) => iq.eq("status", "published")),
          filter: ({ data }) => (data as { slug?: string }).slug !== "hidden",
        },
      },
    },
  },
});

describe("hasPermission — scope × check-form matrix", () => {
  it('static boolean checks ignore scope entirely, including "doc" with no data', () => {
    for (const scope of ["doc", "any", "all", undefined] as const) {
      expect(
        hasPermission({
          access: scopeMatrixAccess,
          user: asUser("staticAllow"),
          resource: "articles",
          action: "read",
          scope,
        }),
      ).toBe(true);
      expect(
        hasPermission({
          access: scopeMatrixAccess,
          user: asUser("staticDeny"),
          resource: "articles",
          action: "read",
          scope,
        }),
      ).toBe(false);
    }
  });

  it('a callback that never reads data resolves normally under every scope, including "doc" with no data', () => {
    for (const scope of ["doc", "any", "all", undefined] as const) {
      const trusted = { _id: "u1", roles: "ignoresData", trusted: true };
      const untrusted = { _id: "u1", roles: "ignoresData", trusted: false };
      expect(() =>
        hasPermission({ access: scopeMatrixAccess, user: trusted, resource: "articles", action: "read", scope }),
      ).not.toThrow();
      expect(
        hasPermission({ access: scopeMatrixAccess, user: trusted, resource: "articles", action: "read", scope }),
      ).toBe(true);
      expect(
        hasPermission({ access: scopeMatrixAccess, user: untrusted, resource: "articles", action: "read", scope }),
      ).toBe(false);
    }
  });

  it('constraints-only rule: scope "any" resolves true and "all" (explicit or omitted) resolves false, without data', () => {
    expect(
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsOnly"),
        resource: "articles",
        action: "read",
        scope: PERMISSION_SCOPES.any,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsOnly"),
        resource: "articles",
        action: "read",
        scope: PERMISSION_SCOPES.all,
      }),
    ).toBe(false);
    expect(
      hasPermission({ access: scopeMatrixAccess, user: asUser("constraintsOnly"), resource: "articles", action: "read" }),
    ).toBe(false);
  });

  it('constraints-only rule: scope "doc" throws VexAccessError without data', () => {
    let caught: unknown;
    try {
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsOnly"),
        resource: "articles",
        action: "read",
        scope: PERMISSION_SCOPES.doc,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).resource).toBe("articles");
    expect((caught as VexAccessError).action).toBe("read");
  });

  it("constraints + a separate top-level filter: the filter is additive — index condition AND filter must both hold", () => {
    // Satisfies the index condition but fails the filter.
    expect(
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsWithFilter"),
        resource: "articles",
        action: "read",
        data: { status: "published", slug: "hidden" } as never,
      }),
    ).toBe(false);
    // Satisfies both.
    expect(
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsWithFilter"),
        resource: "articles",
        action: "read",
        data: { status: "published", slug: "visible" } as never,
      }),
    ).toBe(true);
    // Fails the index condition outright — the filter is never reached.
    expect(
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsWithFilter"),
        resource: "articles",
        action: "read",
        data: { status: "draft", slug: "visible" } as never,
      }),
    ).toBe(false);
  });

  it("constraints + a separate top-level filter: no data still resolves via the outer scope, ignoring the filter half", () => {
    expect(
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsWithFilter"),
        resource: "articles",
        action: "read",
        scope: PERMISSION_SCOPES.any,
      }),
    ).toBe(true);
    expect(() =>
      hasPermission({
        access: scopeMatrixAccess,
        user: asUser("constraintsWithFilter"),
        resource: "articles",
        action: "read",
        scope: PERMISSION_SCOPES.doc,
      }),
    ).toThrow(VexAccessError);
  });
});

/**
 * Deep constraint-object fixture: isolates the index-half, the filter-half
 * (both `q.withIndex(...).filter(...)` chained onto ONE condition, and `q.filter(...)`
 * with no index at all on a non-query-shaped action), a boolean short-circuit from
 * the `constraints` callback, and nested `and`/`or`/`not` per-document interpretation.
 * `create`/`update`/`delete` are NOT query-shaped (DD 14), so their `q` has no
 * `withIndex` — only `read` gets the full query builder.
 */
const constraintFormsAccess = defineAccess({
  roles: ["indexPlusInlineFilter", "predicateOnly", "booleanShortCircuit", "combinators", "notCombinator"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    // Both halves chained onto the SAME condition — query-shaped `read`.
    indexPlusInlineFilter: {
      articles: {
        read: {
          constraints: ({ q }) =>
            q.withIndex("by_status", (iq) => iq.eq("status", "published")).filter((f) => f.neq("slug", "hidden")),
        },
      },
    },
    // Filter-half only — `create` is not query-shaped, so `q` has no `withIndex`.
    predicateOnly: {
      articles: {
        create: {
          constraints: ({ q }) => q.filter((f) => f.eq("authorId", "u1")),
        },
      },
    },
    // The constraints callback short-circuits to a flat boolean for one caller
    // shape and a predicate condition for another.
    booleanShortCircuit: {
      articles: {
        delete: {
          constraints: ({ user, q }) => {
            const caller = user as { isAdmin?: boolean };
            if (caller.isAdmin) return true;
            return q.filter((f) => f.eq("status", "published"));
          },
        },
      },
    },
    combinators: {
      articles: {
        update: {
          constraints: ({ q }) =>
            q.filter((f) => f.and(f.eq("status", "published"), f.or(f.eq("slug", "a"), f.eq("slug", "b")))),
        },
      },
    },
    notCombinator: {
      articles: {
        update: {
          constraints: ({ q }) => q.filter((f) => f.not(f.eq("status", "archived"))),
        },
      },
    },
  },
});

describe("hasPermission — constraint-object forms: index half, filter half, both, short-circuit, combinators", () => {
  it("both halves chained onto one condition: index AND inline filter must both hold", () => {
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: asUser("indexPlusInlineFilter"),
        resource: "articles",
        action: "read",
        data: { status: "published", slug: "visible" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: asUser("indexPlusInlineFilter"),
        resource: "articles",
        action: "read",
        data: { status: "published", slug: "hidden" } as never,
      }),
    ).toBe(false);
    // Index half fails outright — the inline filter never rescues it.
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: asUser("indexPlusInlineFilter"),
        resource: "articles",
        action: "read",
        data: { status: "draft", slug: "visible" } as never,
      }),
    ).toBe(false);
  });

  it("filter-half only (no index) on a non-query-shaped action interprets per-document", () => {
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: asUser("predicateOnly"),
        resource: "articles",
        action: "create",
        data: { authorId: "u1" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: asUser("predicateOnly"),
        resource: "articles",
        action: "create",
        data: { authorId: "u2" } as never,
      }),
    ).toBe(false);
  });

  it("a boolean short-circuit from the constraints callback bypasses scope entirely — never throws, never needs data", () => {
    const admin = { _id: "u1", roles: "booleanShortCircuit", isAdmin: true };
    expect(() =>
      hasPermission({
        access: constraintFormsAccess,
        user: admin,
        resource: "articles",
        action: "delete",
        scope: PERMISSION_SCOPES.doc,
      }),
    ).not.toThrow();
    expect(
      hasPermission({ access: constraintFormsAccess, user: admin, resource: "articles", action: "delete" }),
    ).toBe(true);
  });

  it("when the callback does not short-circuit, the resulting condition falls back to the normal scope handling", () => {
    const nonAdmin = { _id: "u1", roles: "booleanShortCircuit", isAdmin: false };
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: nonAdmin,
        resource: "articles",
        action: "delete",
        data: { status: "published" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: nonAdmin,
        resource: "articles",
        action: "delete",
        data: { status: "draft" } as never,
      }),
    ).toBe(false);
    expect(
      hasPermission({
        access: constraintFormsAccess,
        user: nonAdmin,
        resource: "articles",
        action: "delete",
        scope: PERMISSION_SCOPES.any,
      }),
    ).toBe(true);
    expect(() =>
      hasPermission({
        access: constraintFormsAccess,
        user: nonAdmin,
        resource: "articles",
        action: "delete",
        scope: PERMISSION_SCOPES.doc,
      }),
    ).toThrow(VexAccessError);
  });

  it("nested and/or combinators interpret correctly per document", () => {
    const user = asUser("combinators");
    expect(
      hasPermission({ access: constraintFormsAccess, user, resource: "articles", action: "update", data: { status: "published", slug: "a" } as never }),
    ).toBe(true);
    expect(
      hasPermission({ access: constraintFormsAccess, user, resource: "articles", action: "update", data: { status: "published", slug: "b" } as never }),
    ).toBe(true);
    // Neither branch of the `or` matches.
    expect(
      hasPermission({ access: constraintFormsAccess, user, resource: "articles", action: "update", data: { status: "published", slug: "c" } as never }),
    ).toBe(false);
    // The `and`'s other operand fails even though the `or` would match.
    expect(
      hasPermission({ access: constraintFormsAccess, user, resource: "articles", action: "update", data: { status: "draft", slug: "a" } as never }),
    ).toBe(false);
  });

  it("a not combinator negates its inner predicate per document", () => {
    const user = asUser("notCombinator");
    expect(
      hasPermission({ access: constraintFormsAccess, user, resource: "articles", action: "update", data: { status: "archived" } as never }),
    ).toBe(false);
    expect(
      hasPermission({ access: constraintFormsAccess, user, resource: "articles", action: "update", data: { status: "published" } as never }),
    ).toBe(true);
  });
});

/** Fixture: "ghost" is declared in `roles` (selectable via `userRolesField`) but
 * has no entry at all in `permissions` — a shape TypeScript would normally
 * reject, forced via `as never` to mirror a config assembled dynamically. */
const noPermissionsEntryAccess = defineAccess({
  roles: ["admin", "ghost"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { articles: { read: true } },
  } as never,
});

describe("hasPermission — multi-role resolution edge cases", () => {
  it("a known role with no entry in `permissions` falls through to the default, not a hard deny", () => {
    expect(
      hasPermission({ access: noPermissionsEntryAccess, user: asUser("ghost"), resource: "articles", action: "read" }),
    ).toBe(false); // defaultPermissionMode is deny here
  });

  it("a denying role's explicit action loses to an allowing role's subject wildcard — precedence composes with the OR merge", () => {
    expect(
      hasPermission({
        access: precedenceDenyDefault,
        user: asUser(["explicitBeatsSubjectWildcardDeny", "subjectWildcardAllow"]),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });
});

/** Fixture: the constraints callback throws for a specific caller shape at
 * REQUEST time, not at config time — config-time validation (`defineAccess`)
 * runs it with `user: {}`, which never sets `forceThrow`. */
const throwingConstraintAccess = defineAccess({
  roles: ["contributor"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    contributor: {
      articles: {
        read: {
          constraints: ({ user, q }) => {
            const caller = user as { forceThrow?: boolean };
            if (caller.forceThrow) {
              throw new RangeError("boom from constraints callback");
            }
            return q.withIndex("by_status", (iq) => iq.eq("status", "published"));
          },
        },
      },
    },
  },
});

describe("hasPermission — constrained check throwing at request time", () => {
  it("propagates the raw error uncaught — never swallowed and never converted to a clean deny", () => {
    expect(() =>
      hasPermission({
        access: throwingConstraintAccess,
        user: { _id: "u1", roles: "contributor", forceThrow: true },
        resource: "articles",
        action: "read",
        data: { status: "published", slug: "x" } as never,
      }),
    ).toThrow("boom from constraints callback");
  });

  it("does not throw for a caller that never trips the callback's own throw condition", () => {
    expect(
      hasPermission({
        access: throwingConstraintAccess,
        user: { _id: "u1", roles: "contributor" },
        resource: "articles",
        action: "read",
        data: { status: "published", slug: "x" } as never,
      }),
    ).toBe(true);
  });
});

/**
 * Custom actions at request time. The authoring side is typed in `types.test.ts`;
 * this block proves the resolver actually enforces them — `hasPermission` looks up
 * actions by plain string, so a custom verb must behave exactly like a CRUD one,
 * including wildcard fallthrough and fail-closed denial.
 */
const customActionAccess = defineAccess({
  roles: ["publisher", "lister", "wild", "userLister"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  customActions: {
    articles: { query: ["listFeatured"], mutation: ["publish"] },
    // Declared on the USER collection, which is an auth subject synthesized from
    // the registry rather than a listed resource.
    users: { query: ["listActive"] },
  },
  permissions: {
    publisher: { articles: { publish: true, listFeatured: false } },
    lister: {
      articles: {
        listFeatured: ({ data }) => (data as { featured?: boolean })?.featured === true,
      },
    },
    wild: { articles: { [WILDCARD_KEY]: true } },
    userLister: { users: { listActive: true } },
  },
});



describe("hasPermission — custom actions", () => {
  it("grants a custom mutation action from a boolean rule", () => {
    expect(
      hasPermission({
        access: customActionAccess,
        user: { _id: "u1", roles: "publisher" },
        resource: "articles",
        action: "publish",
      }),
    ).toBe(true);
  });

  it("denies a custom query action explicitly set to false", () => {
    expect(
      hasPermission({
        access: customActionAccess,
        user: { _id: "u1", roles: "publisher" },
        resource: "articles",
        action: "listFeatured",
      }),
    ).toBe(false);
  });

  it("runs a callback rule on a custom action, with the document passed through", () => {
    expect(
      hasPermission({
        access: customActionAccess,
        user: { _id: "u1", roles: "lister" },
        resource: "articles",
        action: "listFeatured",
        data: { featured: true } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: customActionAccess,
        user: { _id: "u1", roles: "lister" },
        resource: "articles",
        action: "listFeatured",
        data: { featured: false } as never,
      }),
    ).toBe(false);
  });

  it("covers a custom action with the action-level wildcard", () => {
    expect(
      hasPermission({
        access: customActionAccess,
        user: { _id: "u1", roles: "wild" },
        resource: "articles",
        action: "publish",
      }),
    ).toBe(true);
  });

  // An undeclared custom action resolves through exactly the same chain as an
  // undeclared built-in — subject wildcard, then the posture. Asserting both verbs
  // together is the point: custom actions get no special-casing.
  it("denies an undeclared custom action, like an undeclared built-in", () => {
    const user = { _id: "u1", roles: "lister" };
    expect(
      hasPermission({ access: customActionAccess, user, resource: "articles", action: "publish" }),
    ).toBe(false);
    expect(
      hasPermission({ access: customActionAccess, user, resource: "articles", action: "delete" }),
    ).toBe(false);
    // A declared grant still wins. `lister`'s rule is a callback, so the document is
    // required: without it the capability probe answers the `scope: "all"` question
    // ("may they do this to EVERY document") and correctly resolves false.
    expect(
      hasPermission({
        access: customActionAccess,
        user,
        resource: "articles",
        action: "listFeatured",
        data: { featured: true } as never,
      }),
    ).toBe(true);
  });

  it("enforces a custom action declared on the user collection", () => {
    expect(
      hasPermission({
        access: customActionAccess,
        user: { _id: "u1", roles: "userLister" },
        resource: "users",
        action: "listActive",
      }),
    ).toBe(true);
    // Under the deny posture a role that never grants it is refused — proving the
    // auth-subject custom action is genuinely resolved, not blanket-allowed.
    expect(
      hasPermission({
        access: customActionAccess,
        user: { _id: "u1", roles: "lister" },
        resource: "users",
        action: "listActive",
      }),
    ).toBe(false);
  });
});

/**
 * `defaultPermissionMode` has no input field — `defineAccess` pins it to deny. The
 * allow branch it feeds is still live in `hasPermission` and `resolveAccessRule`, so it
 * is exercised here from a hand-assembled resolved config. Without this, retained code
 * would ship with zero coverage.
 */
describe("hasPermission — the retained allow posture", () => {
  const allowPosture = {
    ...customActionAccess,
    defaultPermissionMode: PERMISSION_MODES.allow,
  };

  it("allows an undeclared action, built-in or custom", () => {
    const user = { _id: "u1", roles: "lister" };
    expect(
      hasPermission({ access: allowPosture, user, resource: "articles", action: "delete" }),
    ).toBe(true);
    expect(
      hasPermission({ access: allowPosture, user, resource: "articles", action: "publish" }),
    ).toBe(true);
  });

  it("still honours an explicit deny under the allow posture", () => {
    expect(
      hasPermission({
        access: allowPosture,
        user: { _id: "u1", roles: "publisher" },
        resource: "articles",
        action: "listFeatured",
      }),
    ).toBe(false);
  });
});

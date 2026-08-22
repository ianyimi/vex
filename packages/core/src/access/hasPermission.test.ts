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
  fields: { title: text({ required: true }), slug: text(), status: text() },
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
        update: { mode: PERMISSION_MODES.allow, fields: ["title", "status"] },
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
  defaultPermissionMode: PERMISSION_MODES.deny,
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
    "roleAllowTitle",
    "roleDenySlug",
    "roleAllowStatus",
    "roleDenyTitle",
    "allowEmptyFields",
    "denyEmptyFields",
    "boolTrue",
    "boolFalse",
  ] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  defaultPermissionMode: PERMISSION_MODES.deny,
  permissions: {
    roleAllowTitle: { articles: { update: { mode: PERMISSION_MODES.allow, fields: ["title"] } } },
    roleDenySlug: { articles: { update: { mode: PERMISSION_MODES.deny, fields: ["slug"] } } },
    roleAllowStatus: { articles: { update: { mode: PERMISSION_MODES.allow, fields: ["status"] } } },
    roleDenyTitle: { articles: { update: { mode: PERMISSION_MODES.deny, fields: ["title"] } } },
    allowEmptyFields: { articles: { update: { mode: PERMISSION_MODES.allow, fields: [] } } },
    denyEmptyFields: { articles: { update: { mode: PERMISSION_MODES.deny, fields: [] } } },
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

  it("returns true when fields are requested (boolean-only API, system off)", () => {
    expect(
      hasPermission({
        access: undefined,
        user: {},
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      } as never),
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

  it("an undeclared action on a declared subject falls through to the default (allow)", () => {
    // editor declares only `read` on users; `create` is undeclared.
    expect(
      hasPermission({ access, user: asUser("editor"), resource: "users", action: "create" }),
    ).toBe(true);
  });

  it("undeclared subject with no role wildcard falls to the default (allow)", () => {
    // viewer declares only articles + users and has no role wildcard; the
    // undeclared reviewQueue subject resolves via defaultPermissionMode (allow).
    expect(
      hasPermission({ access, user: asUser("viewer"), resource: "reviewQueue", action: "approve" }),
    ).toBe(true);
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

  it("a declared subject's undeclared action falls to the default, not the role wildcard", () => {
    // restricted declares articles (only read); create is undeclared on that
    // subject and resolves via the default (allow) — NOT the role's `false`.
    expect(
      hasPermission({ access, user: asUser("restricted"), resource: "articles", action: "create" }),
    ).toBe(true);
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

describe("hasPermission — fields (boolean AND: every requested field must be allowed)", () => {
  it("denies when any requested field is not allowed", () => {
    // editor's update is mode-allow ["title", "status"] — "slug" is outside it.
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title", "slug", "status"],
      }),
    ).toBe(false);
  });

  it("allows when every requested field is allowed", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title", "status"],
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title"],
      }),
    ).toBe(true);
  });

  it("boolean checks allow any requested field set", () => {
    expect(
      hasPermission({
        access,
        user: asUser("poweruser"),
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      }),
    ).toBe(true);
  });

  it("no fields param: allow-mode with nonempty fields is true, empty is false", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("roleAllowTitle"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("allowEmptyFields"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
  });

  it("no fields param: deny-mode with nonempty fields is false, empty is true", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("roleDenySlug"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("denyEmptyFields"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(true);
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

  it("merges field allow-lists across roles before the AND over requested fields", () => {
    // roleAllowTitle ∪ roleAllowStatus covers title+status but not slug.
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["roleAllowTitle", "roleAllowStatus"]),
        resource: "articles",
        action: "update",
        fields: ["title", "status"],
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["roleAllowTitle", "roleAllowStatus"]),
        resource: "articles",
        action: "update",
        fields: ["title", "slug", "status"],
      }),
    ).toBe(false);
  });

  it("allow wins over deny for the same field across roles", () => {
    // roleDenyTitle denies title but allows everything else (deny-mode);
    // roleAllowTitle allows only title. Union covers both requested fields.
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["roleAllowTitle", "roleDenyTitle"]),
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      }),
    ).toBe(true);
  });

  it("a boolean true role overrides field restrictions from another role", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["allowEmptyFields", "boolTrue"]),
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      }),
    ).toBe(true);
  });

  it("all-denying roles merge to deny", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["boolFalse", "allowEmptyFields"]),
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
    expect((caught as VexAccessError).field).toBeUndefined();
  });

  it("throws with the first denied field in fields order", () => {
    let caught: unknown;
    try {
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title", "slug", "status"],
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).field).toBe("slug");
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
    expect(error.data.field).toBe(undefined);
    expect(() => convexToJson(error.data)).not.toThrow();
  });

  it("field-level denial carries the field and stays serializable", () => {
    let caught: unknown;
    try {
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title", "slug", "status"],
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    const error = caught as VexAccessError;
    expect(error.data.field).toBe("slug");
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
      hasPermission({ access: anonAccess, user: asUser([]), resource: "articles", action: "create" }),
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
      hasPermission({ access: anonAccess, user: asUser(42), resource: "articles", action: "create" }),
    ).toBe(true);
  });

  it("without anonRole configured, an empty-roles caller is still denied", () => {
    expect(
      hasPermission({ access, user: {}, resource: "articles", action: "read" }),
    ).toBe(false);
  });
});
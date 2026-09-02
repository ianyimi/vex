import { describe, expect, it, vi } from "vitest";
import { defineCollection, defineConfig, defineGlobal, text } from "../index";
import { PERMISSION_MODES, WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { VexAccessConfigError } from "./types";

/**
 * Builds an access config AND runs it through `defineConfig`, which is where
 * constraint validation lives.
 *
 * `defineAccess` no longer validates constraints — it cannot, because the complete
 * index truth only exists after `defineConfig` merges auth-adapter, user, media, and
 * internal collections. Tests that assert a rule is accepted or rejected therefore
 * have to load the config, not just define the access block. Registering the same
 * resources the access config names is what lets `defineConfig` resolve them.
 *
 * @param props - The `defineAccess` input.
 * @returns The resolved access config.
 */
function loadAccess<T>(build: () => T): T {
  const access = build();
  // Read the resources off the RESOLVED config rather than re-listing them.
  //
  // Two shapes here are load-bearing. The THUNK means `defineAccess` receives the
  // object literal directly, preserving `const` inference for slugs, indexes and
  // callback value types — taking `Parameters<typeof defineAccess>[0]` instead
  // resolves the generics to their defaults and collapses constraint values to
  // `never`. And `T` is captured from the thunk rather than written as
  // `ReturnType<typeof defineAccess>`, which would do the same to the phantom
  // `SubjectMap` and make every concrete config unassignable (`VexAccessConfig` is
  // invariant in it).
  const resources =
    (access as { resources?: readonly { slug: string }[] }).resources ?? [];
  defineConfig({
    // `labels` is the discriminator: collections declare it, globals never do.
    collections: resources.filter((r) => "labels" in r) as never,
    globals: resources.filter((r) => !("labels" in r)) as never,
    access: access as never,
  });
  return access;
}

function withNodeEnv<T>(env: string, run: () => T): T {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  try {
    return run();
  } finally {
    process.env.NODE_ENV = original;
  }
}

const posts = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }) },
});

// `roles` / `accountRoles` are text fields — defineAccess validates that
// `userRolesField` exists on the user collection and is a text/array field.
const users = defineCollection({
  slug: "users",
  fields: {
    name: text({ required: true }),
    roles: text(),
    accountRoles: text(),
  },
});

/** Resource with a declared single-field index — for constraint-validation wiring tests. */
const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true, index: "by_title" }) },
});

/** Global resource with a declared index, proving constraint validation covers globals too. */
const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: { supportEmail: text({ required: true, index: "by_support_email" }) },
});

/**
 * Named unsafe views of the `q`/`ix` builders — for tests that deliberately
 * probe a rule which "reached past its types" (a wrong index name, a field
 * the builder's type would reject). Cast to these, once, into a named const
 * at each call site rather than inline into a member access.
 */
interface UnsafeIndexBuilder {
  withIndex: (name: string, range: (ix: unknown) => unknown) => unknown;
}
interface UnsafeConstraintChain {
  eq: (field: string, value: unknown) => unknown;
}

/** Shared valid base — spread into calls, override per test. */
const baseInput = {
  roles: ["admin"] as const,
  resources: [users],
  userCollectionSlug: "users",
  userRolesField: "roles",
} as const;

describe("defineAccess — runtime passthrough", () => {
  it("passes the permissions matrix through unchanged", () => {
    const permissions = {
      admin: { [WILDCARD_KEY]: true },
      editor: {
        posts: { create: true, read: true, update: true, delete: false },
      },
    };
    const access = defineAccess({
      ...baseInput,
      roles: ["admin", "editor"] as const,
      resources: [posts, users],
      permissions,
    });
    expect(access.roles).toEqual(["admin", "editor"]);
    expect(access.userCollectionSlug).toBe("users");
    expect(access.userRolesField).toBe("roles");
    expect(access.permissions).toEqual(permissions);
    expect(access.orgCollectionSlug).toBeUndefined();
  });

  it("throws when userCollectionSlug is empty", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        userCollectionSlug: "",
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("stores the org collection slug when provided", () => {
    const access = defineAccess({
      ...baseInput,
      orgCollectionSlug: "organizations",
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.orgCollectionSlug).toBe("organizations");
  });
});

describe("defineAccess — undeclared-permission posture", () => {
  it("pins the posture to deny", () => {
    const access = defineAccess({
      ...baseInput,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.defaultPermissionMode).toBe(PERMISSION_MODES.deny);
  });

  it("exposes no input field to change it", () => {
    defineAccess({
      ...baseInput,
      // @ts-expect-error — the knob is gone. An allow posture is a role-level
      // `"*": true`, which is per-role and greppable; the global default was neither.
      defaultPermissionMode: PERMISSION_MODES.allow,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
  });
});

describe("defineAccess — userRolesField", () => {
  it("stores the userRolesField on the resolved config", () => {
    const access = defineAccess({
      ...baseInput,
      userRolesField: "accountRoles",
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.userRolesField).toBe("accountRoles");
  });

  it("rejects an empty userRolesField with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        userRolesField: "",
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — anonRole", () => {
  it("stores anonRole on the resolved config", () => {
    const access = defineAccess({
      ...baseInput,
      roles: ["admin", "user"] as const,
      anonRole: "user",
      permissions: { admin: { [WILDCARD_KEY]: true }, user: {} },
    });
    expect(access.anonRole).toBe("user");
  });

  it("leaves anonRole undefined when omitted", () => {
    const access = defineAccess({
      ...baseInput,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.anonRole).toBeUndefined();
  });

  it("rejects an empty anonRole with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        anonRole: "" as never,
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — customResources", () => {
  it("does not warn when referencing a declared custom resource", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        customResources: { apiKeys: { actions: ["create", "revoke"] } },
        permissions: { admin: { apiKeys: { create: true } } },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("rejects an empty actions array with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        customResources: { apiKeys: { actions: [] } },
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("rejects a customResources key that collides with a resource slug", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        customResources: { users: { actions: ["create"] } },
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — dev-mode warnings", () => {
  it("warns when a permission role key is not in roles", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { [WILDCARD_KEY]: true },
          superuser: { [WILDCARD_KEY]: true },
        } as never,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("superuser"));
    warnSpy.mockRestore();
  });

  it("warns when a permission subject key is unknown", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: { admin: { nonexistent: true } } as never,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonexistent"),
    );
    warnSpy.mockRestore();
  });

  it("does not warn on the reserved adminPanel or wildcard subject keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: {
            adminPanel: { access: true, impersonate: false },
            [WILDCARD_KEY]: true,
          },
        },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns exactly once when orgCollectionSlug is empty", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        roles: ["admin", "editor"] as const,
        orgCollectionSlug: "",
        permissions: {
          admin: { [WILDCARD_KEY]: true },
          editor: { [WILDCARD_KEY]: true },
        },
      });
    });
    const orgWarnings = warnSpy.mock.calls.filter(([msg]) =>
      String(msg).includes("orgCollectionSlug"),
    );
    expect(orgWarnings).toHaveLength(1); // once total — not once per role
    warnSpy.mockRestore();
  });

  it("does not warn in production even for unknown roles or subjects", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("production", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { nonexistent: true },
          superuser: { [WILDCARD_KEY]: true },
        } as never,
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("defineAccess — type-level", () => {
  it("rejects an unknown role key in permissions", () => {
    defineAccess({
      ...baseInput,
      roles: ["admin"] as const,
      resources: [posts, users],
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — "superuser" is not in `roles`
        superuser: { [WILDCARD_KEY]: true },
      },
    });
  });

  it("rejects an unknown action for a resource subject", () => {
    defineAccess({
      ...baseInput,
      resources: [posts, users],
      permissions: {
        admin: {
          // @ts-expect-error — "publish" requires versions.drafts on the resource
          posts: { publish: true },
        },
      },
    });
  });

  it("rejects a non-boolean role-level wildcard", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        // @ts-expect-error — role-level "*" is boolean-only (RolePermissions, types.ts)
        admin: { [WILDCARD_KEY]: { access: true } },
      },
    });
  });
});

describe("defineAccess — constrained action-level wildcard", () => {
  it("accepts a constraint on the wildcard", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [posts, users],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              posts: {
                "*": {
                  constraints: ({ q }) => q.filter((f) => f.eq("title", "x")),
                },
              },
            },
          },
        }),
      ),
    ).not.toThrow();
  });

  it("surfaces a throwing wildcard constraint as a config error, like an explicit action", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [posts, users],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              posts: {
                "*": {
                  constraints: () => {
                    throw new Error("boom");
                  },
                },
              },
            },
          },
        }),
      ),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — constraint validation wiring (module load)", () => {
  it("validates the index half even when the rule also chains .filter() — both halves are independent", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: {
                read: {
                  constraints: ({ q }) =>
                    q
                      .withIndex("by_title" as never, (ix) =>
                        ix.eq("title" as never, "x" as never),
                      )
                      .filter((f) => f.eq("title" as never, "x" as never)),
                },
              },
            },
          },
        }),
      ),
    ).not.toThrow();
  });

  it("throws for a bad index half even though the same rule also chains a valid .filter()", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: {
                read: {
                  constraints: ({ q }) =>
                    q
                      .withIndex(
                        "by_title" as never,
                        ((ix: unknown) => {
                          const unsafeIx = ix as UnsafeConstraintChain;
                          return unsafeIx.eq("nonexistentField", "x");
                        }) as never,
                      )
                      .filter((f) => f.eq("title" as never, "x" as never)),
                },
              },
            },
          },
        }),
      ),
    ).toThrow(/nonexistentField.*not an in-order prefix of index "by_title"/s);
  });

  it("a constraints callback that returns `true` short-circuits with nothing to validate", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: { articles: { read: { constraints: () => true } } },
          },
        }),
      ),
    ).not.toThrow();
  });

  it("a constraints callback that returns `false` short-circuits with nothing to validate", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: { articles: { read: { constraints: () => false } } },
          },
        }),
      ),
    ).not.toThrow();
  });

  it("surfaces a throwing constraints callback on an explicit (non-wildcard) action as a config error naming role, resource, and action", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: {
                read: {
                  constraints: () => {
                    throw new Error("boom");
                  },
                },
              },
            },
          },
        }),
      ),
    ).toThrow(
      'role "contributor" on articles.read: the constraints callback threw',
    );
  });

  it("q.withIndex is reachable — and still validated — from a non-query action's constraints callback at module-load time; DD 14's gating is compile-time only", () => {
    // `AccessPredicateBuilder` (the TYPE a non-query action's `q` gets) has no
    // `withIndex`. But `defineAccess` resolves every rule's callback with the
    // SAME `createAccessQueryBuilder()` regardless of the action it guards —
    // config.ts's validation loop never branches on QUERY_ACTIONS — so at
    // RUNTIME `withIndex` is present and fully functional even on `create`.
    // The cast below is exactly what "reached past its types" looks like.
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: {
                create: {
                  constraints: ((props: { q: unknown }) => {
                    const unsafeQ = props.q as UnsafeIndexBuilder;
                    return unsafeQ.withIndex("by_title", (ix) => {
                      const unsafeIx = ix as UnsafeConstraintChain;
                      return unsafeIx.eq("title", "x");
                    });
                  }) as never,
                },
              },
            },
          },
        }),
      ),
    ).not.toThrow();
  });

  it("validates the index NAME, not just that the fields match some declared index", () => {
    // `articles` declares exactly one index, "by_title" -> ["title"]. This
    // rule constrains "title" (a real indexed field) but names a completely
    // different, undeclared index. `defineAccess` never reads
    // `condition.index.name` when calling `validateAccessConstraints`
    // (config.ts), and `validateAccessConstraints` itself only ever inspects
    // the FIELD tuples in `indexFields`, never the map's keys — so a
    // misspelled or entirely fictitious index name is silently accepted as
    // long as some real declared index happens to share its field order. The
    // correct behaviour is a config error naming the resource and action.
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: {
                read: {
                  constraints: ({ q }) => {
                    const unsafeQ = q as UnsafeIndexBuilder;
                    return unsafeQ.withIndex(
                      "this_index_does_not_exist",
                      (ix) => {
                        const unsafeIx = ix as UnsafeConstraintChain;
                        return unsafeIx.eq("title", "x");
                      },
                    ) as never;
                  },
                },
              },
            },
          },
        }),
      ),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — a constraints callback must return a recorded condition, not an arbitrary value", () => {
  it("rejects a bare object masquerading as a condition, rather than reading it as 'excludes nothing'", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: { read: { constraints: (() => ({})) as never } },
            },
          },
        }),
      ),
    ).toThrow(VexAccessConfigError);
  });

  it("rejects a constraints callback that returns undefined, with a config error not a bare TypeError", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: { read: { constraints: (() => undefined) as never } },
            },
          },
        }),
      ),
    ).toThrow(VexAccessConfigError);
  });

  it("rejects a constraints callback that returns a primitive", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [articles],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              articles: { read: { constraints: (() => 42) as never } },
            },
          },
        }),
      ),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — role-level wildcard shape is enforced only by TypeScript", () => {
  it("does not reject a non-boolean role-level wildcard at runtime — same compile-time-only pattern as DD 14's withIndex gating", () => {
    // `permissions[role]["*"]` is walked by the SAME loop as every subject
    // key; since `"*"` never matches a real resource slug
    // (`resourcesBySlug.get("*")` is `undefined`), the loop's
    // `if (resource === undefined) continue` skips it unconditionally — even
    // a throwing constraints callback placed here would not be caught. Only
    // `RolePermissions`'s type ("Role-level wildcard: … Boolean only",
    // types.ts) stops this at authoring time.
    expect(() =>
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { [WILDCARD_KEY]: { access: true } } as never,
        },
      }),
    ).not.toThrow();
  });
});

describe("defineAccess — adminPanel (built-in custom subject)", () => {
  it("accepts its declared actions without a validation error", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { adminPanel: { access: true, impersonate: false } },
        },
      }),
    ).not.toThrow();
  });

  it.skip(
    "AMBIGUOUS: an action outside {access, impersonate} is only rejected by TypeScript, not at " +
      "runtime — same as every other subject in this matrix (custom-resource and resource action " +
      "names are never cross-checked against their declared action list at defineAccess time " +
      "either), so this may be by design rather than an adminPanel-specific gap.",
    () => {
      expect(() =>
        defineAccess({
          ...baseInput,
          permissions: {
            admin: { adminPanel: { superAdmin: true } as never },
          },
        }),
      ).toThrow(VexAccessConfigError);
    },
  );
});

describe("defineAccess — degenerate configs", () => {
  it("accepts an empty resources array", () => {
    expect(() =>
      defineAccess({
        roles: ["admin"] as const,
        resources: [],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).not.toThrow();
  });

  it("does not throw for a permissions entry keyed to a role absent from `roles` (dev warning only)", () => {
    expect(() =>
      withNodeEnv("development", () =>
        defineAccess({
          ...baseInput,
          permissions: {
            admin: { [WILDCARD_KEY]: true },
            superuser: { [WILDCARD_KEY]: true },
          } as never,
        }),
      ),
    ).not.toThrow();
  });

  it("does not throw for a permissions subject key naming no declared resource (dev warning only)", () => {
    expect(() =>
      withNodeEnv("development", () =>
        defineAccess({
          ...baseInput,
          permissions: { admin: { nonexistent: true } } as never,
        }),
      ),
    ).not.toThrow();
  });

  it("enabled: false does not short-circuit hard configuration validation — a colliding customResources key still throws", () => {
    // `enabled` (types.ts) documents itself as "turn access control on or
    // off" — a RUNTIME posture read by `hasPermission`, not a build-time
    // switch. `defineAccess` never branches on `props.enabled` before
    // validating, so a broken config is still caught even while access
    // control is temporarily disabled — exactly what you want, since an
    // invisible landmine would otherwise wait for the flag to flip back.
    expect(() =>
      defineAccess({
        ...baseInput,
        enabled: false,
        customResources: { users: { actions: ["create"] } },
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("duplicate action keys in a permissions literal resolve via ordinary JS object semantics (last write wins), before defineAccess ever runs", () => {
    // Spread order, not `defineAccess`, decides which declaration survives —
    // by the time `props.permissions` reaches this function the object
    // literal is already merged. This documents that reality rather than any
    // defineAccess behaviour: it has no visibility into whether a key was
    // declared once or many times upstream.
    const access = defineAccess({
      ...baseInput,
      permissions: {
        admin: { users: { ...{ read: true }, ...{ read: false } } },
      },
    });
    const admin = access.permissions.admin as unknown as {
      users: { read: boolean };
    };
    expect(admin.users.read).toBe(false);
  });
});

describe("defineAccess — globals as resources", () => {
  it("validates constraints for a global resource's declared index exactly like a collection", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [siteSettings],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              siteSettings: {
                read: {
                  constraints: ({ q }) =>
                    q.withIndex("by_support_email" as never, (ix) =>
                      ix.eq("supportEmail" as never, "x" as never),
                    ),
                },
              },
            },
          },
        }),
      ),
    ).not.toThrow();
  });

  it("throws when a global rule's constraint fields are not a prefix of any of its declared indexes", () => {
    expect(() =>
      loadAccess(() =>
        defineAccess({
          roles: ["contributor"] as const,
          resources: [siteSettings],
          userCollectionSlug: "users",
          userRolesField: "roles",
          permissions: {
            contributor: {
              siteSettings: {
                read: {
                  constraints: ({ q }) => {
                    const unsafeQ = q as UnsafeIndexBuilder;
                    return unsafeQ.withIndex("by_support_email", (ix) => {
                      const unsafeIx = ix as UnsafeConstraintChain;
                      return unsafeIx.eq("nonexistentField", "x");
                    }) as never;
                  },
                },
              },
            },
          },
        }),
      ),
    ).toThrow(
      /nonexistentField.*not an in-order prefix of index "by_support_email"/,
    );
  });
});

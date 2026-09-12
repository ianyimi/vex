import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import { text } from "../../fields";
import { defineGlobal } from "../../globals/config";
import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { VexAccessError } from "../../access";
import { upsertGlobal } from "./upsert.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

/** Shape of a raw `vex_globals` DB row, for storage-layer assertions. */
interface GlobalRow {
  slug: string;
  data: Record<string, unknown>;
}

const siteSettingsGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: { siteName: text({ label: "Site Name", required: true }) },
});

// upsertGlobal resolves the GlobalConfig from `config.globals` by slug and
// reads `config.access` (undefined here → RBAC off).
const fixtureConfig = { globals: [siteSettingsGlobal], access: undefined } as unknown as VexConfig;

/**
 * The `convexTest` harness bound to THIS schema.
 *
 * `ReturnType<typeof convexTest>` instantiates the `Schema` parameter at its
 * constraint, producing a harness whose `run` callback expects a different ctx
 * than the one the real `convexTest(schema, modules)` call produces — so a
 * helper annotated that way rejects the same callback the inline tests pass.
 */
type Harness = ReturnType<typeof convexTest<(typeof schema)["tables"]>>;

describe("updateGlobal (server)", () => {
  it("inserts a new row when the global has never been saved", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "My Site" },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].data.siteName).toBe("My Site");
    expect(rows[0].slug).toBe("siteSettings"); // DB stores slug, not _slug
  });

  it("patches the existing row on subsequent saves", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "Old" },
      });
    });
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "New" },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].data.siteName).toBe("New");
  });

  it("strips system keys from flat input before writing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // Simulate GlobalEditView sending a full flat document
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: {
          _id: "fake",
          _creationTime: 0,
          _slug: "siteSettings",
          siteName: "Clean",
        },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows[0].data._id).toBeUndefined();
    expect(rows[0].data._slug).toBeUndefined();
    expect(rows[0].data.siteName).toBe("Clean");
  });

  it("throws ConvexError on validation failure", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          slug: "siteSettings",
          data: { siteName: 999 }, // wrong type
          config: fixtureConfig,
        });
      }),
    ).rejects.toThrow();
  });
});

describe("upsertGlobal (server) — updatedAt", () => {
  // Pins the deliberate gap as a checked contract rather than a silent one.
  // `vex_globals` is a single `{ slug, data }` table shared by every registered
  // global — there is no per-global `defineTable` generated from its fields, so
  // there is no column to stamp. Stashing the value inside the `data` blob is
  // not equivalent: `STRIPPED_KEYS` and each global's Zod input schema would
  // both have to learn about a field no `GlobalConfigInput` declares.
  it("never writes an updatedAt key — globals cannot carry one", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        config: fixtureConfig,
        ctx,
        data: { siteName: "My Site" },
        slug: "siteSettings",
      });
    });
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    const stored = rows[0].data;
    expect(stored).toBeTypeOf("object");
    expect(Object.keys(stored as object)).not.toContain("updatedAt");
  });
});

/**
 * Access coverage for `upsertGlobal`.
 *
 * Every case above runs with `access: undefined` (RBAC off), which is exactly
 * why none of them caught `upsertGlobal` authorizing a WRITE against the
 * caller's `read` grant: the branch was never executed. These cases pin the
 * verb the mutation checks, which is the only thing standing between a
 * read-only role and overwriting a global.
 */
describe("upsertGlobal (server) — access", () => {
  /**
   * Minimal resolved access config. `defineAccess` is not used here: it types
   * `permissions` against the generated subject registry, which this package's
   * test fixtures do not populate, and the runtime shape is what `hasPermission`
   * reads.
   */
  function buildConfig(permissions: Record<string, unknown>): VexConfig {
    return {
      globals: [siteSettingsGlobal],
      access: {
        enabled: true,
        roles: ["admin", "reader"],
        anonRole: "reader",
        userCollectionSlug: "users",
        userRolesField: "roles",
        defaultPermissionMode: "deny",
        resources: [siteSettingsGlobal],
        permissions,
      },
    } as unknown as VexConfig;
  }

  /** Seeds the `siteSettings` row so the next save is an `update`, not a `create`. */
  async function seed(t: Harness): Promise<void> {
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "Old" } });
    });
  }

  async function storedName(t: Harness): Promise<unknown> {
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    return rows[0]?.data.siteName;
  }

  /**
   * A two-field global for the field-permission tests below, kept separate
   * from `siteSettingsGlobal` (whose only field is required by every case
   * above) so `adminTheme` can be required here without touching those
   * callers.
   */
  const themeGlobal = defineGlobal({
    slug: "siteSettings",
    label: "Site Settings",
    fields: {
      siteName: text({ label: "Site Name", required: true }),
      adminTheme: text({ label: "Admin Theme", required: true }),
    },
  });

  function buildThemeConfig(permissions: Record<string, unknown>): VexConfig {
    return {
      globals: [themeGlobal],
      access: {
        enabled: true,
        roles: ["admin", "reader"],
        anonRole: "reader",
        userCollectionSlug: "users",
        userRolesField: "roles",
        defaultPermissionMode: "deny",
        resources: [themeGlobal],
        permissions,
      },
    } as unknown as VexConfig;
  }

  /** Seeds a `siteSettings` row with both theme fields set. */
  async function seedTheme(t: Harness): Promise<void> {
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "Old", adminTheme: "light" },
      });
    });
  }

  /** The full stored `data` blob, for assertions that touch more than `siteName`. */
  async function storedRow(t: Harness): Promise<Record<string, unknown> | undefined> {
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    return rows[0]?.data;
  }

  /**
   * A two-required-field global for the merge tests, run with RBAC off since
   * they only exercise the merge-then-validate write path.
   */
  const mergeGlobal = defineGlobal({
    slug: "siteSettings",
    label: "Site Settings",
    fields: {
      siteName: text({ label: "Site Name", required: true }),
      description: text({ label: "Description", required: true }),
    },
  });
  const mergeConfig = { globals: [mergeGlobal], access: undefined } as unknown as VexConfig;

  it("denies an existing-row save to a role holding only read", async () => {
    const config = buildConfig({ reader: { siteSettings: { "*": false, read: true } } });
    const t = convexTest(schema, modules);
    await seed(t);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: "Defaced" },
          auth: { user: { roles: ["reader"] } },
        });
      }),
    ).rejects.toThrow(VexAccessError);
    expect(await storedName(t)).toBe("Old");
  });

  it("denies a first save to a role holding only read", async () => {
    const config = buildConfig({ reader: { siteSettings: { "*": false, read: true } } });
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: "Injected" },
          auth: { user: { roles: ["reader"] } },
        });
      }),
    ).rejects.toThrow(VexAccessError);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(0);
  });

  it("denies an anonymous caller resolved to a read-only anonRole", async () => {
    const config = buildConfig({ reader: { siteSettings: { "*": false, read: true } } });
    const t = convexTest(schema, modules);
    await seed(t);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        // No `auth` at all — `anonRole: "reader"` is what this resolves to.
        await upsertGlobal({ ctx, config, slug: "siteSettings", data: { siteName: "Anon" } });
      }),
    ).rejects.toThrow(VexAccessError);
    expect(await storedName(t)).toBe("Old");
  });

  it("authorizes an existing-row save as update, not create", async () => {
    // `update` granted, `create` denied: the save must go through.
    const config = buildConfig({
      reader: { siteSettings: { "*": false, read: true, update: true, create: false } },
    });
    const t = convexTest(schema, modules);
    await seed(t);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "New" },
        auth: { user: { roles: ["reader"] } },
      });
    });
    expect(await storedName(t)).toBe("New");
  });

  it("authorizes a first save as create, not update", async () => {
    // The mirror image: `create` granted, `update` denied, no row yet.
    const config = buildConfig({
      reader: { siteSettings: { "*": false, read: true, create: true, update: false } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "First" },
        auth: { user: { roles: ["reader"] } },
      });
    });
    expect(await storedName(t)).toBe("First");
  });

  it("denies a first save to a role holding update but not create", async () => {
    const config = buildConfig({
      reader: { siteSettings: { "*": false, read: true, update: true, create: false } },
    });
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: "First" },
          auth: { user: { roles: ["reader"] } },
        });
      }),
    ).rejects.toThrow(VexAccessError);
  });

  it("evaluates an update rule against the STORED flat document, not the payload", async () => {
    // The rule allows the write only while the stored name is "Old". A payload
    // that sets `siteName: "Old"` must NOT satisfy it — `data` is the stored
    // document. `data.siteName` (not `data.data.siteName`) is the flat shape
    // every global rule is written against.
    const config = buildConfig({
      reader: {
        siteSettings: {
          "*": false,
          read: true,
          update: ({ data }: { data?: Record<string, unknown> }) => data?.siteName === "Old",
        },
      },
    });
    const t = convexTest(schema, modules);
    await seed(t);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "Renamed" },
        auth: { user: { roles: ["reader"] } },
      });
    });
    expect(await storedName(t)).toBe("Renamed");

    // Stored name is now "Renamed", so the same rule denies the next save even
    // though the payload claims "Old".
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: "Old" },
          auth: { user: { roles: ["reader"] } },
        });
      }),
    ).rejects.toThrow(VexAccessError);
    expect(await storedName(t)).toBe("Renamed");
  });

  it("rejects a denied caller before validating the payload", async () => {
    // `siteName: 999` is a Zod violation AND the caller is denied. The denial
    // must win, so an unauthorized caller learns nothing about the schema.
    const config = buildConfig({ reader: { siteSettings: { "*": false, read: true } } });
    const t = convexTest(schema, modules);
    await seed(t);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: 999 },
          auth: { user: { roles: ["reader"] } },
        });
      }),
    ).rejects.toThrow(VexAccessError);
  });

  it("allows a role with the resource wildcard", async () => {
    const config = buildConfig({ admin: { "*": true } });
    const t = convexTest(schema, modules);
    await seed(t);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "Admin Save" },
        auth: { user: { roles: ["admin"] } },
      });
    });
    expect(await storedName(t)).toBe("Admin Save");
  });

  it("bypasses the check entirely under access.bypass", async () => {
    const config = buildConfig({ reader: { siteSettings: { "*": false, read: true } } });
    const t = convexTest(schema, modules);
    await seed(t);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "Seeded" },
        auth: { user: { roles: ["reader"] } },
        access: { bypass: true },
      });
    });
    expect(await storedName(t)).toBe("Seeded");
  });

  it("allows a save that changes only the permitted field", async () => {
    // The exact www scenario: a full-document payload changing only `adminTheme`.
    const config = buildThemeConfig({
      reader: {
        siteSettings: { "*": false, read: true, update: () => ({ "*": false, adminTheme: true }) },
      },
    });
    const t = convexTest(schema, modules);
    await seedTheme(t);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "Old", adminTheme: "dark" },
        auth: { user: { roles: ["reader"] } },
      });
    });
    expect(await storedRow(t)).toEqual({ siteName: "Old", adminTheme: "dark" });
  });

  it("rejects a save that changes a denied field", async () => {
    const config = buildThemeConfig({
      reader: {
        siteSettings: { "*": false, read: true, update: () => ({ "*": false, adminTheme: true }) },
      },
    });
    const t = convexTest(schema, modules);
    await seedTheme(t);
    let caught: unknown;
    try {
      await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: "New", adminTheme: "light" },
          auth: { user: { roles: ["reader"] } },
        });
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).field).toBe("siteName");
  });

  it("leaves the stored row untouched when a field denial rejects the write", async () => {
    const config = buildThemeConfig({
      reader: {
        siteSettings: { "*": false, read: true, update: () => ({ "*": false, adminTheme: true }) },
      },
    });
    const t = convexTest(schema, modules);
    await seedTheme(t);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: "New", adminTheme: "light" },
          auth: { user: { roles: ["reader"] } },
        });
      }),
    ).rejects.toThrow(VexAccessError);
    expect(await storedRow(t)).toEqual({ siteName: "Old", adminTheme: "light" });
  });

  it("authorizes the first save as create, so an update-only map cannot initialize", async () => {
    const config = buildThemeConfig({
      reader: {
        siteSettings: {
          "*": false,
          read: true,
          create: false,
          update: () => ({ "*": false, adminTheme: true }),
        },
      },
    });
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config,
          slug: "siteSettings",
          data: { siteName: "First", adminTheme: "dark" },
          auth: { user: { roles: ["reader"] } },
        });
      }),
    ).rejects.toThrow(VexAccessError);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(0);
  });

  it("merges a partial payload into the stored blob", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "Site", description: "d" },
      });
    });
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config: mergeConfig,
        slug: "siteSettings",
        data: { siteName: "New" },
      });
    });
    expect(await storedRow(t)).toEqual({ siteName: "New", description: "d" });
  });

  it("still rejects a partial payload that leaves the global invalid", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "Old" } });
    });
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          config: mergeConfig,
          slug: "siteSettings",
          data: { siteName: "New" },
        });
      }),
    ).rejects.toThrow();
    expect(await storedRow(t)).toEqual({ siteName: "Old" });
  });
});

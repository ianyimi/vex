import { describe, expect, it } from "vitest";
import {
  ADMIN_FIELDS,
  afterChangeHook,
  array,
  beforeChangeHook,
  blocks,
  checkbox,
  collapsible,
  color,
  commitTs,
  date,
  defineBlock,
  defineCollection,
  defineConfig,
  defineGlobal,
  defineServerConfig,
  email,
  globalBeforeChangeHook,
  group,
  json,
  number,
  relationship,
  richtext,
  row,
  select,
  tabs,
  text,
  textarea,
  ui,
  upload,
  url,
  type MediaCollectionConfig,
  type VexAuthAdapter,
  type VexConfig,
  type VexStorageAdapter,
} from "@vexcms/core";
import { anonymizeConfig } from "./anonymizeConfig";
import { buildTelemetryEvent } from "./recordTelemetryEvent";
import type { AnonymizedConfig, TelemetrySettings } from "./types";

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, acc));
  } else if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStrings(item, acc));
  }
  return acc;
}

/** Depth of the deepest object/array nesting in `value` — a leaf primitive is depth 0. */
function jsonDepth(value: unknown): number {
  if (value === null || typeof value !== "object") {
    return 0;
  }
  const children = Array.isArray(value) ? value : Object.values(value);
  if (children.length === 0) {
    return 1;
  }
  return 1 + Math.max(...children.map((child) => jsonDepth(child)));
}

const GENERATED_PATH_PATTERN = /^(c|g|m|k)\d+(\.(f\d+|t\d+|b\d+|i))*$/;
const ALLOWED_FIELD_TYPES = new Set(Object.values(ADMIN_FIELDS).map((entry) => entry.type as string));
const ALLOWED_ENUM_VALUES = new Set([
  "dropdown",
  "radio",
  "hex",
  "rgb",
  "hsl",
  "oklch",
  "main",
  "sidebar",
  "left",
  "right",
  "center",
  "presigned-url",
  "save",
  "publish",
  "all",
  "relative",
  "datetime",
  "none",
  "betterAuth",
  "custom",
  "collection",
  "global",
  "media",
]);

describe("anonymizeConfig — exact shape", () => {
  it("matches the full expected payload for a minimal config", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        title: text({ required: true, min: 3, max: 100 }),
        featured: checkbox({ defaultValue: true }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const expected: AnonymizedConfig = {
      collectionCount: 1,
      globalCount: 0,
      mediaCollectionCount: 0,
      blockCount: 0,
      fieldCount: 2,
      resources: [
        {
          path: "c1",
          kind: "collection",
          drafts: false,
          livePreview: false,
          indexCount: 0,
          timestamps: false,
          savedViewCount: 0,
          defaultSortIsCustom: false,
          bulkDelete: true,
          hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 0, afterDelete: 0 },
        },
      ],
      blocks: [],
      fields: [
        {
          path: "c1.f1",
          type: "text",
          required: true,
          hidden: false,
          readOnly: false,
          position: "main",
          cellAlignment: "left",
          hasValidate: false,
          hasIndex: false,
          hasMask: false,
          min: 3,
          max: 100,
          hasSearchIndex: false,
          enableSorting: false,
          enableHiding: true,
        },
        {
          path: "c1.f2",
          type: "checkbox",
          required: false,
          hidden: false,
          readOnly: false,
          position: "main",
          cellAlignment: "left",
          hasValidate: false,
          hasIndex: false,
          enableSorting: false,
          enableHiding: true,
          defaultValue: true,
        },
      ],
      features: {
        drafts: false,
        livePreview: false,
        conditions: false,
        slots: false,
        inputMasks: false,
        localization: false,
        auth: false,
        authAdapter: "none",
        access: {
          enabled: false,
          roleCount: 0,
          ruleCount: 0,
          fieldPermissionRuleCount: 0,
          queryConstraintRuleCount: 0,
          callbackRuleCount: 0,
          customActionCount: 0,
          customResourceCount: 0,
          organizations: false,
        },
        hookCount: 0,
      },
      storageAdapterKinds: [],
    };

    expect(anonymizeConfig({ config })).toEqual(expected);
  });
});

describe("anonymizeConfig — unknown keys", () => {
  it("never includes a field's framework-injected meta", () => {
    const collection = defineCollection({
      slug: "unknownKeyCollection",
      timestamps: false,
      fields: { headline: text({ required: true }) },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    expect(Object.keys(output.fields[0]!)).not.toContain("meta");
    expect(JSON.stringify(output)).not.toContain("unknownKeyCollection");
  });
});

describe("anonymizeConfig — injected updatedAt", () => {
  it("a collection without timestamps: false gets timestamps: true, no updatedAt-derived field, and an unchanged fieldCount", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true, min: 3, max: 100 }),
        featured: checkbox({ defaultValue: true }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    expect(output.resources[0]!.timestamps).toBe(true);
    expect(output.fields).toHaveLength(2);
    expect(output.fieldCount).toBe(2);
    expect(output.fields.some((field) => field.type === "commitTs")).toBe(false);
  });

  it("a user-declared commitTs field survives with its own on/format, not mistaken for the injected updatedAt", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        title: text({ required: true }),
        publishedCommitTs: commitTs({ on: "publish", admin: { format: "relative" } }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });
    const commitTsField = output.fields.find((field) => field.type === "commitTs")!;

    expect(commitTsField).toBeDefined();
    expect(commitTsField.on).toBe("publish");
    expect(commitTsField.format).toBe("relative");
    expect(output.fieldCount).toBe(2);
  });
});

describe("anonymizeConfig — lifecycle hooks", () => {
  it("counts declared hooks per resource and sums them into features.hookCount", () => {
    const collection = defineCollection({
      slug: "hookedPosts",
      timestamps: false,
      fields: { title: text({ required: true }) },
      hooks: {
        beforeChange: beforeChangeHook("hookedPosts", async ({ doc }) => doc),
        afterChange: afterChangeHook("hookedPosts", () => {}),
      },
    });
    const global = defineGlobal({
      slug: "hookedSettings",
      label: "Hooked Settings",
      fields: { tagline: text() },
      hooks: {
        beforeChange: globalBeforeChangeHook("hookedSettings", async ({ doc }) => doc),
      },
    });
    const config = defineServerConfig({
      config: defineConfig({ collections: [collection], globals: [global] }),
    });

    const output = anonymizeConfig({ config });
    const collectionResource = output.resources.find((resource) => resource.kind === "collection")!;
    const globalResource = output.resources.find((resource) => resource.kind === "global")!;

    expect(collectionResource.hookCounts).toEqual({
      beforeChange: 1,
      beforeDelete: 0,
      afterChange: 1,
      afterDelete: 0,
    });
    expect(globalResource.hookCounts).toEqual({
      beforeChange: 1,
      beforeDelete: 0,
      afterChange: 0,
      afterDelete: 0,
    });
    expect(output.features.hookCount).toBe(3);
  });
});

describe("anonymizeConfig — access detail", () => {
  it("classifies every rule and counts custom actions/resources exactly", () => {
    const collection = defineCollection({
      slug: "docs",
      timestamps: false,
      fields: { title: text({ required: true }) },
    });
    const config: VexConfig = {
      ...defineServerConfig({ config: defineConfig({ collections: [collection] }) }),
      access: {
        enabled: true,
        roles: ["admin", "editor"],
        resources: [collection],
        customActions: { docs: { query: ["search"], mutation: ["archive", "restore"] } },
        defaultPermissionMode: "deny",
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: undefined,
        organizations: false,
        permissions: {
          admin: {
            docs: {
              read: true,
              create: () => true,
              update: { where: { field: "title", op: "neq", value: "" } },
              delete: { title: true, body: false },
            },
            apiKeys: { create: true },
          },
        },
      } as unknown as VexConfig["access"],
    };

    const output = anonymizeConfig({ config });

    expect(output.features.access).toEqual({
      enabled: true,
      roleCount: 2,
      ruleCount: 5,
      fieldPermissionRuleCount: 1,
      queryConstraintRuleCount: 1,
      callbackRuleCount: 1,
      customActionCount: 3,
      customResourceCount: 1,
      organizations: false,
    });
  });
});

describe("anonymizeConfig — block definitions", () => {
  it("one block placed in two collections registers one definition with both placement paths, fields walked once", () => {
    const sharedBlock = defineBlock({ slug: "shared", label: "Shared", fields: { heading: text() } });
    const collectionA = defineCollection({
      slug: "collectionA",
      timestamps: false,
      fields: { sections: blocks({ blocks: [sharedBlock] }) },
    });
    const collectionB = defineCollection({
      slug: "collectionB",
      timestamps: false,
      fields: { sections: blocks({ blocks: [sharedBlock] }) },
    });
    const config = defineServerConfig({
      config: defineConfig({ collections: [collectionA, collectionB] }),
    });

    const output = anonymizeConfig({ config });

    expect(output.blocks).toHaveLength(1);
    expect(output.blockCount).toBe(1);
    const definition = output.blocks[0]!;
    expect(definition.id).toBe("k1");
    expect(definition.paths).toEqual(["c1.f1.b1", "c2.f1.b1"]);
    expect(output.fields.filter((field) => field.path.startsWith("k1."))).toHaveLength(1);
    expect(output.fields.find((field) => field.path === "k1.f1" && field.type === "text")).toBeDefined();
  });

  it("a blocks field nested inside a block definition paths its placement under the parent definition", () => {
    const innerBlock = defineBlock({ slug: "inner", label: "Inner", fields: { note: text() } });
    const outerBlock = defineBlock({
      slug: "outer",
      label: "Outer",
      fields: {
        title: text(),
        summary: text(),
        nested: blocks({ blocks: [innerBlock] }),
      },
    });
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: { sections: blocks({ blocks: [outerBlock] }) },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    const outerDefinition = output.blocks.find((block) => block.paths.includes("c1.f1.b1"))!;
    expect(outerDefinition.id).toBe("k1");
    const innerDefinition = output.blocks.find((block) => block.paths.includes("k1.f3.b1"))!;
    expect(innerDefinition.id).toBe("k2");
    expect(output.fields.find((field) => field.path === "k2.f1" && field.type === "text")).toBeDefined();
  });

  it("a block placed inside an array row's group paths at <array>.i.<fieldIndex>.b1", () => {
    const widgetBlock = defineBlock({ slug: "widget", label: "Widget", fields: { label: text() } });
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        rows: array({
          items: group({
            fields: {
              heading: text(),
              sections: blocks({ blocks: [widgetBlock] }),
            },
          }),
        }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    expect(output.blocks).toHaveLength(1);
    expect(output.blocks[0]!.paths).toEqual(["c1.f1.i.f2.b1"]);
  });
});

describe("anonymizeConfig — array and tabs paths", () => {
  it("an array of a primitive field paths items at .i; an array of a group paths items at .i and its children at .i.fN", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        tags: array({ items: text(), min: 0, max: 10 }),
        rows: array({ items: group({ fields: { label: text(), value: text() } }) }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    const primitiveItem = output.fields.find((field) => field.path === "c1.f1.i")!;
    expect(primitiveItem).toBeDefined();
    expect(primitiveItem.type).toBe("text");
    const groupItem = output.fields.find((field) => field.path === "c1.f2.i")!;
    expect(groupItem).toBeDefined();
    expect(groupItem.type).toBe("group");
    expect(output.fields.find((field) => field.path === "c1.f2.i.f1")).toBeDefined();
    expect(output.fields.find((field) => field.path === "c1.f2.i.f2")).toBeDefined();
  });

  it("fields inside a tabs field's nth tab path at .tN.fN", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        info: tabs({
          tabs: [
            { label: "Content", fields: { summary: textarea() } },
            { label: "SEO", name: "seoTab", fields: { keywords: text() } },
          ],
        }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    expect(output.fields.find((field) => field.path === "c1.f1.t1.f1" && field.type === "textarea")).toBeDefined();
    expect(output.fields.find((field) => field.path === "c1.f1.t2.f1" && field.type === "text")).toBeDefined();
  });
});

describe("anonymizeConfig — depth budget", () => {
  it("keeps the full built event's max JSON nesting depth within budget for a deliberately deep config (blocks in tabs in arrays in groups)", () => {
    const deepBlock = defineBlock({ slug: "deepBlock", label: "Deep Block", fields: { value: text() } });
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        deep: array({
          items: group({
            fields: {
              sections: tabs({
                tabs: [
                  {
                    label: "Blocks tab",
                    fields: {
                      widgets: blocks({ blocks: [deepBlock] }),
                    },
                  },
                ],
              }),
            },
          }),
        }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });
    const anonymized = anonymizeConfig({ config });
    const settings: TelemetrySettings = { machineId: "machine-1", salt: "salt-1" };
    const event = buildTelemetryEvent({
      event: "dev",
      projectDir: "/tmp/deep-config-project",
      settings,
      outcome: { status: "ok" },
      config: anonymized,
    });

    expect(jsonDepth(event)).toBeLessThanOrEqual(8);
  });
});

describe("anonymizeConfig — leak test", () => {
  const CLIENTS_SLUG = "secretProjectClients";
  const POSTS_SLUG = "secretProjectPosts";
  const SETTINGS_SLUG = "secretCompanySettings";
  const ASSETS_SLUG = "secretCompanyAssets";

  const SECRETS = [
    CLIENTS_SLUG,
    POSTS_SLUG,
    SETTINGS_SLUG,
    ASSETS_SLUG,
    "secretSavedViewName",
    "secret-view-where-value",
    "Codename Phoenix",
    "classifiedTierAlpha",
    "Internal only — do not share externally",
    "https://secret-internal.example.com/launch-codes",
    "secretLaunchBlock",
    "Secret Launch Block",
    "secretBoardMember",
    "secretStorageAdapterXYZ",
    "do-not-leak-this-mask-999",
    "secret-mask",
    "Meta title secret",
    "SEO Codename Phoenix",
    "Launch heading",
    "Confidential Advanced Settings",
    "Internal tag",
    "Alt text (secret keywords)",
  ];

  const clientsCollection = defineCollection({
    slug: CLIENTS_SLUG,
    fields: { name: text({ required: true, label: "Codename Phoenix" }) },
    admin: {
      views: [
        {
          viewId: "secretView",
          name: "secretSavedViewName",
          state: { where: { field: "name", op: "eq", value: "secret-view-where-value" } },
        },
      ],
    },
  });

  const postsCollection = defineCollection({
    slug: POSTS_SLUG,
    timestamps: false,
    admin: { useAsTitle: "title" },
    fields: {
      title: text({
        required: true,
        label: "Internal only — do not share externally",
        min: 3,
        max: 100,
        searchIndex: { name: "search_title", filterFields: [] },
        admin: { mask: "do-not-leak-this-mask-999", condition: () => true },
      }),
      contactEmail: email({ admin: { mask: "secret-mask" } }),
      bio: textarea({ rows: 6 }),
      website: url({ defaultValue: "https://secret-internal.example.com/launch-codes" }),
      brandColor: color({ format: "oklch", themeColors: true }),
      priority: number({ min: 0, max: 10, step: 1 }),
      featured: checkbox({ defaultValue: true }),
      publishedAt: date({ time: { use12HourFormat: false } }),
      tier: select({
        hasMany: true,
        options: [
          { label: "Codename Phoenix Tier", value: "classifiedTierAlpha" },
          { label: "Public", value: "public" },
        ],
        admin: { display: "radio", searchable: true },
      }),
      client: relationship({ collection: { slug: CLIENTS_SLUG }, hasMany: false }),
      tags: array({ items: text({ label: "Internal tag" }), min: 1, max: 5 }),
      seo: group({
        label: "SEO Codename Phoenix",
        admin: { defaultCollapsed: true },
        fields: { metaTitle: text({ label: "Meta title secret" }) },
      }),
      sections: blocks({
        admin: { defaultCollapsed: true },
        blocks: [
          defineBlock({
            slug: "secretLaunchBlock",
            label: "Secret Launch Block",
            fields: { heading: text({ label: "Launch heading" }) },
          }),
        ],
      }),
      heroImage: upload({ to: ASSETS_SLUG, accept: "image/*" }),
      body: richtext({ mediaCollectionSlug: ASSETS_SLUG }),
      settingsBlob: json(),
      info: tabs({
        tabs: [
          { label: "Content", fields: { summary: textarea() } },
          { label: "SEO", name: "seoTab", fields: { keywords: text() } },
        ],
      }),
      layout: row({ fields: { left: text(), right: text() } }),
      advanced: collapsible({
        label: "Confidential Advanced Settings",
        admin: { defaultCollapsed: true },
        fields: { note: text() },
      }),
      customWidget: ui({ admin: { components: { Field: () => null, Cell: () => null } } }),
    },
  });

  const settingsGlobal = defineGlobal({
    slug: SETTINGS_SLUG,
    label: "Secret Company Settings",
    fields: { tagline: text({ label: "Secret tagline" }) },
  });

  const assetsMediaCollection = {
    ...defineCollection({
      slug: ASSETS_SLUG,
      timestamps: false,
      fields: {
        alt: text({ required: true, label: "Alt text (secret keywords)" }),
        filename: text({ required: true }),
      },
      meta: { storageAdapter: "secretStorageAdapterXYZ" },
    }),
  } as unknown as MediaCollectionConfig;

  const storageAdapter = {
    name: "secretStorageAdapterXYZ",
    type: "presigned-url",
    mediaCollections: [assetsMediaCollection],
    admin: { softDelete: false },
    generateUploadUrl: async () => ({ url: "" }),
    createMediaDocument: async () => "",
    deleteMedia: async () => true,
    getUrl: async () => ({ url: "" }),
    uploadFile: async () => ({ storageId: "" }),
  } as unknown as VexStorageAdapter;

  const authAdapter = {
    name: "secretAuthAdapterName",
    collections: [],
    userCollection: CLIENTS_SLUG,
  } as unknown as VexAuthAdapter;

  const config: VexConfig = {
    ...defineServerConfig({
      config: defineConfig({
        collections: [clientsCollection, postsCollection],
        globals: [settingsGlobal],
        mediaCollections: [assetsMediaCollection],
      }),
      server: { auth: { adapter: authAdapter }, storage: { adapters: [storageAdapter] } },
    }),
    access: {
      enabled: true,
      roles: ["admin", "secretBoardMember"],
      resources: [],
      customActions: undefined,
      defaultPermissionMode: "deny",
      userCollectionSlug: CLIENTS_SLUG,
      userRolesField: "roles",
      orgCollectionSlug: undefined,
      permissions: {},
    } as unknown as VexConfig["access"],
  };

  it("maps relationship and upload targets to the generated resource paths", () => {
    const output = anonymizeConfig({ config });
    const relationshipField = output.fields.find((field) => field.type === "relationship")!;
    const uploadField = output.fields.find((field) => field.type === "upload")!;

    expect(relationshipField.target).toBe("c1");
    expect(uploadField.target).toBe("m1");
  });

  it("never includes a collection, field, block, or role name — every string is a generated path or an allowlisted literal", () => {
    const output = anonymizeConfig({ config });
    const serialized = JSON.stringify(output);

    for (const secret of SECRETS) {
      expect(serialized).not.toContain(secret);
    }

    const strings = collectStrings(output);
    for (const value of strings) {
      const allowed =
        GENERATED_PATH_PATTERN.test(value) || ALLOWED_FIELD_TYPES.has(value) || ALLOWED_ENUM_VALUES.has(value);
      expect(allowed).toBe(true);
    }
  });
});

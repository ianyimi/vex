import { describe, expect, it } from "vitest";

import type { AdminField, DateField, NumberField } from "../fields";
import { defineCollection, number, text } from "../index";
import { beforeChangeHook } from "./hooks";

describe("defineCollection — updatedAt injection", () => {
  it("injects an optional updatedAt date field by default", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const field = posts.fields.updatedAt as DateField | undefined;
    expect(field).toBeDefined();
    expect(field?.type).toBe("date");
    expect(field?.required).toBe(false);
  });

  it("marks the injected field read-only so the form cannot edit it", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.fields.updatedAt?.admin.readOnly).toBe(true);
    expect(posts.fields.updatedAt?.admin.position).toBe("sidebar");
  });

  it("resolves the injected field's time config with seconds visible", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect((posts.fields.updatedAt as DateField | undefined)?.time).toEqual({
      hidden: false,
      use12HourFormat: true,
      timePicker: { hour: true, minute: true, second: true },
    });
  });

  it("omits updatedAt when timestamps: false", () => {
    const log = defineCollection({
      slug: "log",
      fields: { message: text({ required: true }) },
      timestamps: false,
    });
    expect(log.fields.updatedAt).toBeUndefined();
  });

  it("injects into a collection declaring no fields at all", () => {
    const empty = defineCollection({ slug: "empty", fields: {} });
    expect(empty.fields.updatedAt).toBeDefined();
  });

  it("stamps the injected field's meta.collectionSlug like every other field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.fields.updatedAt?.meta).toMatchObject({ collectionSlug: "posts" });
  });

  it("throws at runtime when a user field is literally named updatedAt", () => {
    const fields: Record<string, AdminField> = { updatedAt: text({ label: "Updated At" }) };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(/reserved/);
  });

  it("never mutates the caller's fields object, so one input can be reused", () => {
    const fields = { title: text({ required: true }) };
    defineCollection({ slug: "posts", fields });
    expect("updatedAt" in fields).toBe(false);
    // A second call against the same input must behave identically, not throw
    // a reserved-key error from the first call's injection.
    expect(defineCollection({ slug: "pages", fields }).fields.updatedAt).toBeDefined();
  });
});

describe("defineCollection — versions defaults", () => {
  it("defaults versions.drafts to false, versions.autosave to disabled, and versions.cascadeDelete to true when versions is omitted", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.versions).toEqual({
      drafts: false,
      defaultStatus: "draft",
      autosave: { enabled: false, debounceMs: 1000 },
      cascadeDelete: true,
    });
  });

  it("resolves versions.drafts: true when declared, defaulting autosave to disabled and cascadeDelete to true", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true },
    });
    expect(posts.versions).toEqual({
      drafts: true,
      defaultStatus: "draft",
      autosave: { enabled: false, debounceMs: 1000 },
      cascadeDelete: true,
    });
  });

  it("enables autosave alongside drafts, defaulting debounceMs when omitted", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, autosave: { enabled: true } },
    });
    expect(posts.versions).toEqual({
      drafts: true,
      defaultStatus: "draft",
      autosave: { enabled: true, debounceMs: 1000 },
      cascadeDelete: true,
    });
  });

  it("honors an explicit autosave.debounceMs override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, autosave: { enabled: true, debounceMs: 250 } },
    });
    expect(posts.versions.autosave).toEqual({ enabled: true, debounceMs: 250 });
  });

  it("honors an explicit cascadeDelete: false override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, cascadeDelete: false },
    });
    expect(posts.versions).toEqual({
      drafts: true,
      defaultStatus: "draft",
      autosave: { enabled: false, debounceMs: 1000 },
      cascadeDelete: false,
    });
  });

  it("honors an explicit defaultStatus: 'published' override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, defaultStatus: "published" },
    });
    expect(posts.versions.defaultStatus).toBe("published");
  });
});

describe("defineCollection — reserved versioning field keys", () => {
  it("throws at runtime when a user field is literally named vex_status", () => {
    const fields: Record<string, AdminField> = {
      vex_status: text({ label: "Status" }),
    };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(/reserved/);
  });

  it("throws at runtime when a user field is literally named vex_publishedAt", () => {
    const fields: Record<string, AdminField> = {
      vex_publishedAt: text({ label: "Published At" }),
    };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(/reserved/);
  });

  it("throws at runtime when a user field is literally named vex_publishedId", () => {
    const fields: Record<string, AdminField> = {
      vex_publishedId: text({ label: "Published Id" }),
    };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(/reserved/);
  });

  it("is a compile-time error to declare a field literally named vex_status", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        // @ts-expect-error — vex_status is reserved; defineCollection injects it
        fields: { vex_status: text({ label: "Status" }) },
      }),
    ).toThrow(/reserved/);
  });
});

describe("defineCollection — auth-owned collections are skipped", () => {
  // `betterAuthAdapter` marks every auth table except `user` with
  // `meta.protected`. vexcms's `create`/`update` never write those rows, so a
  // column here would appear in the schema and generated types for a value
  // nothing ever populates.
  it("does not inject into a meta.protected collection", () => {
    const jwks = defineCollection({
      slug: "jwks",
      fields: { publicKey: text({ required: true }) },
      meta: { protected: true },
    });
    expect(jwks.fields.updatedAt).toBeUndefined();
  });

  it("still injects into an unprotected collection with other meta", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      meta: { icon: "File" },
    });
    expect(posts.fields.updatedAt).toBeDefined();
  });
});

describe("defineCollection — an already-declared updatedAt is left alone", () => {
  // Mirrors how `betterAuthAdapter` calls `defineCollection`: a `fields` object
  // typed as a widened `Record<string, AdminField>` (not a field literal),
  // already carrying its OWN locked `updatedAt` from the auth table's real
  // schema attribute. Injecting over it would clobber a field the external
  // system owns.
  const lockedUpdatedAt = number({
    admin: { readOnly: true },
    meta: { locked: true },
    required: false,
  });
  const authFields: Record<string, AdminField> = {
    email: text({ required: true }),
    updatedAt: lockedUpdatedAt,
  };

  it("preserves the declared field's own settings rather than replacing it", () => {
    const user = defineCollection({ slug: "user", fields: authFields });
    const updatedAt = user.fields.updatedAt as NumberField | undefined;
    // Fields are cloned by meta stamping, so this asserts the surviving
    // contract rather than reference identity: `locked` is what keeps the
    // write paths from stamping over the auth adapter's value.
    expect(updatedAt?.meta).toMatchObject({ collectionSlug: "user", locked: true });
    expect(updatedAt?.defaultValue).toBe(lockedUpdatedAt.defaultValue);
  });

  it("does not throw for the widened-Record caller shape", () => {
    expect(() => defineCollection({ slug: "user", fields: authFields })).not.toThrow();
  });
});

describe("defineCollection — label derivation (CORE-LABEL-1)", () => {
  // `singular` is derived by singularizing the slug before title-casing it;
  // `plural` is just the title-cased slug itself, since slugs are plural by
  // convention. `it.each` pins the exact strings so a regression back to
  // title-casing the raw slug for `singular` (dropping "Posts" instead of
  // "Post"), or reintroducing `plural()` at this call site (compounding
  // "Posts" into "Postses"), fails loudly.
  it.each([
    // regular
    ["posts", "Post", "Posts"],
    ["pages", "Page", "Pages"],
    // irregular
    ["people", "Person", "People"],
    ["children", "Child", "Children"],
    ["shelves", "Shelf", "Shelves"],
    // uncountable
    ["media", "Media", "Media"],
    ["news", "News", "News"],
    ["series", "Series", "Series"],
  ])("derives labels for slug %j when labels are omitted", (slug, singular, plural) => {
    const collection = defineCollection({ slug, fields: { title: text({ required: true }) } });
    expect(collection.labels).toEqual({ singular, plural });
  });

  it("passes explicitly-provided labels through verbatim, untouched by derivation", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      labels: { singular: "Article", plural: "Articles" },
    });
    expect(collection.labels).toEqual({ singular: "Article", plural: "Articles" });
  });

  it("derives the omitted half when only one of singular/plural is provided", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      labels: { singular: "Article" },
    });
    expect(collection.labels).toEqual({ singular: "Article", plural: "Posts" });
  });
});

describe("defineCollection — hooks", () => {
  it("defaults hooks to an empty object", () => {
    const posts = defineCollection({ slug: "posts", fields: { title: text() } });
    expect(posts.hooks).toEqual({});
  });

  it("passes through provided hooks unchanged", () => {
    const beforeChange = beforeChangeHook("posts", ({ doc }) => doc);
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text() },
      hooks: { beforeChange },
    });
    expect(posts.hooks.beforeChange).toBe(beforeChange);
  });
});

describe("defineCollection — draftStatus validation", () => {
  it("throws when a collection-level index declares draftStatus without versions.drafts: true", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        indexes: [{ name: "by_title", fields: ["title"], draftStatus: true } as never],
      }),
    ).toThrow(/draftStatus/);
  });

  it("throws when a field's indexDraftStatus is set without versions.drafts: true", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { slug: text({ required: true, index: "by_slug", indexDraftStatus: true }) },
      }),
    ).toThrow(/declares indexDraftStatus but versions\.drafts is not true/);
  });

  it("throws when indexDraftStatus is set on a field with no index and no relationship auto-index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true, indexDraftStatus: true }) },
        versions: { drafts: true },
      }),
    ).toThrow(/no index to narrow/);
  });

  it("allows draftStatus on a collection-level index when versions.drafts: true", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true },
      indexes: [{ name: "by_title", fields: ["title"], draftStatus: "both" }],
    });
    expect(posts.indexes?.[0]).toMatchObject({ name: "by_title", draftStatus: "both" });
  });

  it("allows indexDraftStatus on a field's own index when versions.drafts: true", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { slug: text({ required: true, index: "by_slug", indexDraftStatus: true }) },
      versions: { drafts: true },
    });
    expect(posts.fields.slug?.indexDraftStatus).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import type { AdminField } from "../fields";
import { defineCollection, number, text } from "../index";

describe("defineCollection — updatedAt injection", () => {
  it("injects an optional updatedAt number field by default", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const field = posts.fields.updatedAt;
    expect(field).toBeDefined();
    expect(field?.type).toBe("number");
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
    // Fields are cloned by meta stamping, so this asserts the surviving
    // contract rather than reference identity: `locked` is what keeps the
    // write paths from stamping over the auth adapter's value.
    expect(user.fields.updatedAt?.meta).toMatchObject({ collectionSlug: "user", locked: true });
    expect(user.fields.updatedAt?.defaultValue).toBe(lockedUpdatedAt.defaultValue);
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

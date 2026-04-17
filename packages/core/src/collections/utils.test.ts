import { describe, it, expect } from "vitest";
import {
  text,
  number,
  checkbox,
  date,
  select,
  defineCollection,
} from "../index";
import { getCollectionDefaultValues, getCollectionInputSchema } from "./utils";

const SELECT_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const ALL_FIELDS_COLLECTION = defineCollection({
  slug: "all_fields",
  fields: {
    title: text({ required: true }),
    score: number({ required: false }),
    published: checkbox({ required: false }),
    publishedAt: date({ required: false }),
    status: select({
      required: false,
      hasMany: false,
      options: SELECT_OPTIONS,
    }),
    tags: select({
      required: false,
      hasMany: true,
      options: [
        { label: "News", value: "news" },
        { label: "Tutorial", value: "tutorial" },
      ],
    }),
  },
});

// ─── getCollectionDefaultValues ───────────────────────────────────────────────

describe("getCollectionDefaultValues", () => {
  it("returns field defaults for a text collection in create mode", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        slug: text({ required: true, defaultValue: "" }),
      },
    });
    const defaults = getCollectionDefaultValues({ collection });
    expect(defaults).toEqual({ title: "", slug: "" });
  });

  it("returns 0 as default for number fields", () => {
    const collection = defineCollection({
      slug: "products",
      fields: { price: number({ required: true }) },
    });
    const defaults = getCollectionDefaultValues({ collection });
    expect(defaults.price).toBe(0);
  });

  it("returns false as default for checkbox fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { published: checkbox() },
    });
    const defaults = getCollectionDefaultValues({ collection });
    expect(defaults.published).toBe(false);
  });

  it("returns undefined as default for date fields", () => {
    const collection = defineCollection({
      slug: "events",
      fields: { startsAt: date({ required: false }) },
    });
    const defaults = getCollectionDefaultValues({ collection });
    expect(defaults.startsAt).toBeUndefined();
  });

  it("returns [] as default for select fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { status: select({ options: SELECT_OPTIONS }) },
    });
    const defaults = getCollectionDefaultValues({ collection });
    expect(defaults.status).toEqual([]);
  });

  it("uses document values in edit mode", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        score: number({ required: false }),
        published: checkbox(),
      },
    });
    const document = {
      _id: "doc1" as any,
      _creationTime: 0,
      title: "Hello World",
      score: 42,
      published: true,
    };
    const defaults = getCollectionDefaultValues({ collection, document });
    expect(defaults.title).toBe("Hello World");
    expect(defaults.score).toBe(42);
    expect(defaults.published).toBe(true);
  });

  it("falls back to field default when document key is missing", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        score: number({ required: false }),
      },
    });
    const document = {
      _id: "doc1" as any,
      _creationTime: 0,
      title: "Hello",
      // score is missing
    };
    const defaults = getCollectionDefaultValues({ collection, document });
    expect(defaults.title).toBe("Hello");
    expect(defaults.score).toBe(0); // falls back to field default
  });

  // ─── comprehensive ─────────────────────────────────────────────────────────

  it("comprehensive: returns correct defaults for every field type", () => {
    const defaults = getCollectionDefaultValues({
      collection: ALL_FIELDS_COLLECTION,
    });

    expect(defaults.title).toBe(""); // text default
    expect(defaults.score).toBe(0); // number default
    expect(defaults.published).toBe(false); // checkbox default
    expect(defaults.publishedAt).toBeUndefined(); // date default
    expect(defaults.status).toEqual([]); // select default
    expect(defaults.tags).toEqual([]); // select default
  });

  it("comprehensive: uses document values for every field type in edit mode", () => {
    const document = {
      _id: "doc1" as any,
      _creationTime: 0,
      title: "My Post",
      score: 99,
      published: true,
      publishedAt: 1700000000000,
      status: ["published"],
      tags: ["news", "tutorial"],
    };
    const defaults = getCollectionDefaultValues({
      collection: ALL_FIELDS_COLLECTION,
      document,
    });

    expect(defaults.title).toBe("My Post");
    expect(defaults.score).toBe(99);
    expect(defaults.published).toBe(true);
    expect(defaults.publishedAt).toBe(1700000000000);
    expect(defaults.status).toEqual(["published"]);
    expect(defaults.tags).toEqual(["news", "tutorial"]);
  });
});

// ─── getCollectionInputSchema ─────────────────────────────────────────────────

describe("getCollectionInputSchema", () => {
  it("builds a Zod object schema with one key per field", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        slug: text({ required: true, min: { value: 3 } }),
        excerpt: text({ required: false }),
      },
    });
    const schema = getCollectionInputSchema({ collection });
    const result = schema.safeParse({ title: "Hello", slug: "hello", excerpt: "" });
    expect(result.success).toBe(true);
  });

  it("validates required text fields — rejects empty string", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const schema = getCollectionInputSchema({ collection });
    expect(schema.safeParse({ title: "" }).success).toBe(false);
    expect(schema.safeParse({ title: "Hello" }).success).toBe(true);
  });

  it("validates required number fields — accepts 0", () => {
    const collection = defineCollection({
      slug: "products",
      fields: { price: number({ required: true }) },
    });
    const schema = getCollectionInputSchema({ collection });
    expect(schema.safeParse({ price: 0 }).success).toBe(true);
    expect(schema.safeParse({ price: 9.99 }).success).toBe(true);
    expect(schema.safeParse({ price: "bad" }).success).toBe(false);
  });

  it("validates checkbox fields — accepts true and false", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { published: checkbox({ required: true }) },
    });
    const schema = getCollectionInputSchema({ collection });
    expect(schema.safeParse({ published: true }).success).toBe(true);
    expect(schema.safeParse({ published: false }).success).toBe(true);
    expect(schema.safeParse({ published: "yes" }).success).toBe(false);
  });

  it("validates date fields — accepts number timestamps, rejects strings", () => {
    const collection = defineCollection({
      slug: "events",
      fields: { startsAt: date({ required: true }) },
    });
    const schema = getCollectionInputSchema({ collection });
    expect(schema.safeParse({ startsAt: Date.now() }).success).toBe(true);
    expect(schema.safeParse({ startsAt: "2024-01-01" }).success).toBe(false);
  });

  it("validates select fields — accepts valid option arrays", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        status: select({
          required: false,
          hasMany: false,
          options: SELECT_OPTIONS,
        }),
      },
    });
    const schema = getCollectionInputSchema({ collection });
    expect(schema.safeParse({ status: ["draft"] }).success).toBe(true);
    expect(schema.safeParse({ status: ["unknown"] }).success).toBe(false);
    expect(schema.safeParse({ status: ["draft", "published"] }).success).toBe(
      false,
    ); // hasMany: false
  });

  it("returns defaults for optional fields when values are omitted", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: false, defaultValue: "" }),
        score: number({ required: false }),
        published: checkbox({ required: false }),
        status: select({ required: false, options: SELECT_OPTIONS }),
      },
    });
    const schema = getCollectionInputSchema({ collection });
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("");
      expect(result.data.score).toBe(0);
      expect(result.data.published).toBe(false);
      expect(result.data.status).toEqual([]);
    }
  });

  // ─── comprehensive ─────────────────────────────────────────────────────────

  it("comprehensive: validates a collection with every field type", () => {
    const schema = getCollectionInputSchema({
      collection: ALL_FIELDS_COLLECTION,
    });

    // Valid document — all fields present with correct types
    const validResult = schema.safeParse({
      title: "My Post",
      score: 42,
      published: true,
      publishedAt: 1700000000000,
      status: ["draft"],
      tags: ["news", "tutorial"],
    });
    expect(validResult.success).toBe(true);

    // Missing optional fields — should use defaults
    const minimalResult = schema.safeParse({ title: "Hello" });
    expect(minimalResult.success).toBe(true);
    if (minimalResult.success) {
      expect(minimalResult.data.score).toBe(0);
      expect(minimalResult.data.published).toBe(false);
      expect(minimalResult.data.status).toEqual([]);
      expect(minimalResult.data.tags).toEqual([]);
    }

    // Wrong types — should fail
    expect(
      schema.safeParse({ title: 123, score: "bad", published: "yes" }).success,
    ).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  url,
  text,
  number,
  checkbox,
  date,
  select,
  group,
  array,
  defineCollection,
} from "../index";
import { getFieldsDefaultValues, getFieldsInputSchema } from "../fields";

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

// ─── getFieldsDefaultValues ───────────────────────────────────────────────

describe("getFieldsDefaultValues", () => {
  it("returns field defaults for a text collection in create mode", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        slug: text({ required: true }),
      },
    });
    const defaults = getFieldsDefaultValues({ fields: collection.fields });
    // `updatedAt` is injected by `defineCollection`, and is deliberately
    // `undefined` rather than `0` on create — an unsaved document has no
    // update time.
    expect(defaults).toEqual({ title: "", slug: "", updatedAt: undefined });
  });

  it("uses the stored updatedAt when editing an existing document", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const defaults = getFieldsDefaultValues({
      fields: collection.fields,
      document: { _creationTime: 1, _id: "d1", title: "Hello", updatedAt: 1234 },
    });
    expect(defaults.updatedAt).toBe(1234);
  });

  it("omits updatedAt entirely for a collection that opted out", () => {
    const collection = defineCollection({
      slug: "log",
      fields: { message: text({ required: true }) },
      timestamps: false,
    });
    expect(getFieldsDefaultValues({ fields: collection.fields })).toEqual({ message: "" });
  });

  it("returns 0 as default for number fields", () => {
    const collection = defineCollection({
      slug: "products",
      fields: { price: number({ required: true }) },
    });
    const defaults = getFieldsDefaultValues({ fields: collection.fields });
    expect(defaults.price).toBe(0);
  });

  it("returns false as default for checkbox fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { published: checkbox() },
    });
    const defaults = getFieldsDefaultValues({ fields: collection.fields });
    expect(defaults.published).toBe(false);
  });

  it("returns undefined as default for date fields", () => {
    const collection = defineCollection({
      slug: "events",
      fields: { startsAt: date({ required: false }) },
    });
    const defaults = getFieldsDefaultValues({ fields: collection.fields });
    expect(defaults.startsAt).toBeUndefined();
  });

  it("returns [] as default for select fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { status: select({ options: SELECT_OPTIONS }) },
    });
    const defaults = getFieldsDefaultValues({ fields: collection.fields });
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
      _id: "doc1",
      _creationTime: 0,
      title: "Hello World",
      score: 42,
      published: true,
    };
    const defaults = getFieldsDefaultValues({ fields: collection.fields, document });
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
      _id: "doc1",
      _creationTime: 0,
      title: "Hello",
      // score is missing
    };
    const defaults = getFieldsDefaultValues({ fields: collection.fields, document });
    expect(defaults.title).toBe("Hello");
    expect(defaults.score).toBe(0); // falls back to field default
  });

  // ─── comprehensive ─────────────────────────────────────────────────────────

  it("comprehensive: returns correct defaults for every field type", () => {
    const defaults = getFieldsDefaultValues({
      fields: ALL_FIELDS_COLLECTION.fields,
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
      _id: "doc1",
      _creationTime: 0,
      title: "My Post",
      score: 99,
      published: true,
      publishedAt: 1700000000000,
      status: ["published"],
      tags: ["news", "tutorial"],
    };
    const defaults = getFieldsDefaultValues({
      fields: ALL_FIELDS_COLLECTION.fields,
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

// ─── getFieldsInputSchema ─────────────────────────────────────────────────

describe("getFieldsInputSchema", () => {
  it("builds a Zod object schema with one key per field", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: url({ required: true }),
        slug: url({ required: true }),
        excerpt: url({ required: false }),
      },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields });
    const result = schema.safeParse({
      title: "https://example.com",
      slug: "https://slug.example.com",
      excerpt: "https://excerpt.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("validates required url fields — rejects invalid URLs", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: url({ required: true }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields });
    expect(schema.safeParse({ title: "" }).success).toBe(false);
    expect(schema.safeParse({ title: "https://example.com" }).success).toBe(
      true,
    );
  });

  it("validates required number fields — accepts 0", () => {
    const collection = defineCollection({
      slug: "products",
      fields: { price: number({ required: true }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields });
    expect(schema.safeParse({ price: 0 }).success).toBe(true);
    expect(schema.safeParse({ price: 9.99 }).success).toBe(true);
    expect(schema.safeParse({ price: "bad" }).success).toBe(false);
  });

  it("validates checkbox fields — accepts true and false", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { published: checkbox({ required: true }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields });
    expect(schema.safeParse({ published: true }).success).toBe(true);
    expect(schema.safeParse({ published: false }).success).toBe(true);
    expect(schema.safeParse({ published: "yes" }).success).toBe(false);
  });

  it("validates date fields — accepts number timestamps, rejects strings", () => {
    const collection = defineCollection({
      slug: "events",
      fields: { startsAt: date({ required: true }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields });
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
    const schema = getFieldsInputSchema({ fields: collection.fields });
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
    const schema = getFieldsInputSchema({ fields: collection.fields });
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
    const schema = getFieldsInputSchema({
      fields: ALL_FIELDS_COLLECTION.fields,
    });

    // Valid document — all fields present with correct types
    const validResult = schema.safeParse({
      title: "https://example.com",
      score: 42,
      published: true,
      publishedAt: 1700000000000,
      status: ["draft"],
      tags: ["news", "tutorial"],
    });
    expect(validResult.success).toBe(true);

    // Missing optional fields — should use defaults
    const minimalResult = schema.safeParse({ title: "https://example.com" });
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

  it("partial mode: an absent required field passes", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }), slug: text({ min: { value: 3 } }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, partial: true });
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("partial mode: a present field still runs its full validator chain", () => {
    const collection = defineCollection({ slug: "posts", fields: { slug: text({ min: { value: 3 } }) } });
    const schema = getFieldsInputSchema({ fields: collection.fields, partial: true });
    expect(schema.safeParse({ slug: "ab" }).success).toBe(false);
    expect(schema.safeParse({ slug: "abc" }).success).toBe(true);
  });

  it("non-partial mode is unchanged: an absent required field fails", () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text({ required: true }) } });
    const schema = getFieldsInputSchema({ fields: collection.fields });
    expect(schema.safeParse({}).success).toBe(false);
  });
});

// ─── getFieldsInputSchema: ignoreRequired ──────────────────────────────────

describe("getFieldsInputSchema — ignoreRequired (draft-lenient mode)", () => {
  it("accepts an empty required text field", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, ignoreRequired: true });
    expect(schema.safeParse({ title: "" }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("accepts an empty required select field", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { status: select({ required: true, options: SELECT_OPTIONS }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, ignoreRequired: true });
    expect(schema.safeParse({ status: [] }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("accepts a required text field left empty inside a group", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        seo: group({ fields: { title: text({ required: true }) } }),
      },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, ignoreRequired: true });
    expect(schema.safeParse({ seo: { title: "" } }).success).toBe(true);
  });

  it("accepts a required text field left empty inside an array item", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        links: array({ items: text({ required: true }) }),
      },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, ignoreRequired: true });
    expect(schema.safeParse({ links: [""] }).success).toBe(true);
  });

  it("still rejects a wrong type", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }), score: number({ required: true }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, ignoreRequired: true });
    expect(schema.safeParse({ title: 123, score: 1 }).success).toBe(false);
    expect(schema.safeParse({ title: "ok", score: "bad" }).success).toBe(false);
  });

  it("still rejects a non-empty value violating max", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true, max: { value: 3 } }) },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, ignoreRequired: true });
    expect(schema.safeParse({ title: "too long" }).success).toBe(false);
    expect(schema.safeParse({ title: "" }).success).toBe(true);
  });
});

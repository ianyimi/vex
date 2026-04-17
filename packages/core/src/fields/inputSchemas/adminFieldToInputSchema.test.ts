import { describe, it, expect } from "vitest";
import {
  text,
  number,
  checkbox,
  date,
  select,
  defineCollection,
} from "../../index";
import { adminFieldToInputSchema } from "./index";

const SELECT_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

// ─── text ────────────────────────────────────────────────────────────────────

describe("adminFieldToInputSchema — text", () => {
  it("dispatches to text: accepts strings, rejects wrong types", () => {
    const schema = adminFieldToInputSchema({ field: text({ required: true }) });
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("required text rejects empty string", () => {
    const schema = adminFieldToInputSchema({ field: text({ required: true }) });
    expect(schema.safeParse("").success).toBe(false);
  });

  it("optional text accepts undefined and returns default", () => {
    const schema = adminFieldToInputSchema({
      field: text({ required: false, defaultValue: "" }),
    });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("");
  });
});

// ─── number ──────────────────────────────────────────────────────────────────

describe("adminFieldToInputSchema — number", () => {
  it("dispatches to number: accepts numbers, rejects strings", () => {
    const schema = adminFieldToInputSchema({
      field: number({ required: true }),
    });
    expect(schema.safeParse(42).success).toBe(true);
    expect(schema.safeParse("42").success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("required number accepts 0 (zero is a valid required value)", () => {
    const schema = adminFieldToInputSchema({
      field: number({ required: true }),
    });
    expect(schema.safeParse(0).success).toBe(true);
  });

  it("optional number accepts undefined and returns default 0", () => {
    const schema = adminFieldToInputSchema({
      field: number({ required: false }),
    });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0);
  });
});

// ─── checkbox ────────────────────────────────────────────────────────────────

describe("adminFieldToInputSchema — checkbox", () => {
  it("dispatches to checkbox: accepts booleans, rejects strings and numbers", () => {
    const schema = adminFieldToInputSchema({ field: checkbox() });
    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);
    expect(schema.safeParse("true").success).toBe(false);
    expect(schema.safeParse(1).success).toBe(false);
  });

  it("optional checkbox accepts undefined and returns default false", () => {
    const schema = adminFieldToInputSchema({ field: checkbox() });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(false);
  });
});

// ─── date ────────────────────────────────────────────────────────────────────

describe("adminFieldToInputSchema — date", () => {
  it("dispatches to date: accepts numbers (Unix ms timestamps), rejects strings", () => {
    const schema = adminFieldToInputSchema({
      field: date({ required: true }),
    });
    expect(schema.safeParse(Date.now()).success).toBe(true);
    expect(schema.safeParse(0).success).toBe(true);
    expect(schema.safeParse("2024-01-01").success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("optional date accepts undefined", () => {
    const schema = adminFieldToInputSchema({
      field: date({ required: false }),
    });
    expect(schema.safeParse(undefined).success).toBe(true);
  });
});

// ─── select ──────────────────────────────────────────────────────────────────

describe("adminFieldToInputSchema — select", () => {
  it("dispatches to select: accepts valid option arrays, rejects strings", () => {
    const schema = adminFieldToInputSchema({
      field: select({ required: true, hasMany: true, options: SELECT_OPTIONS }),
    });
    expect(schema.safeParse(["draft"]).success).toBe(true);
    expect(schema.safeParse(["draft", "published"]).success).toBe(true);
    expect(schema.safeParse("draft").success).toBe(false);
    expect(schema.safeParse(["unknown"]).success).toBe(false);
  });

  it("optional select accepts undefined and returns default []", () => {
    const schema = adminFieldToInputSchema({
      field: select({ required: false, options: SELECT_OPTIONS }),
    });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("hasMany false limits to one item", () => {
    const schema = adminFieldToInputSchema({
      field: select({ hasMany: false, options: SELECT_OPTIONS }),
    });
    expect(schema.safeParse(["draft"]).success).toBe(true);
    expect(schema.safeParse(["draft", "published"]).success).toBe(false);
  });
});

// ─── comprehensive ───────────────────────────────────────────────────────────

describe("adminFieldToInputSchema — comprehensive (all field types)", () => {
  it("dispatches correctly for every field type and validates a full collection", () => {
    const collection = defineCollection({
      slug: "all_fields",
      fields: {
        title: text({ required: true }),
        score: number({ required: true }),
        published: checkbox({ required: true }),
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

    for (const [, field] of Object.entries(collection.fields)) {
      // Every field type must produce a valid schema without throwing
      expect(() => adminFieldToInputSchema({ field })).not.toThrow();
    }

    const schemas = Object.fromEntries(
      Object.entries(collection.fields).map(([key, field]) => [
        key,
        adminFieldToInputSchema({ field }),
      ]),
    );

    // text: required, string
    expect(schemas.title.safeParse("Hello").success).toBe(true);
    expect(schemas.title.safeParse("").success).toBe(false);

    // number: required, 0 is valid
    expect(schemas.score.safeParse(0).success).toBe(true);
    expect(schemas.score.safeParse("bad").success).toBe(false);

    // checkbox: required, accepts boolean
    expect(schemas.published.safeParse(true).success).toBe(true);
    expect(schemas.published.safeParse("yes").success).toBe(false);

    // date: optional timestamp
    expect(schemas.publishedAt.safeParse(Date.now()).success).toBe(true);
    expect(schemas.publishedAt.safeParse(undefined).success).toBe(true);

    // select: optional single-select
    expect(schemas.status.safeParse(["draft"]).success).toBe(true);
    expect(schemas.status.safeParse(["draft", "published"]).success).toBe(
      false,
    ); // hasMany: false

    // tags: optional multi-select
    expect(schemas.tags.safeParse(["news", "tutorial"]).success).toBe(true);
    expect(schemas.tags.safeParse(undefined).success).toBe(true);
  });
});

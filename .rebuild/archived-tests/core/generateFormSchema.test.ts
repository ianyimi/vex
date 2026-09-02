import { describe, it, expect } from "vitest";
import { generateFormSchema, fieldMetaToZod } from "./generateFormSchema";
import { text, number, checkbox, select, date, imageUrl, upload } from "../fields";
import { defineBlock } from "../blocks/defineBlock";
import { blocks } from "../fields/blocks";

describe("fieldMetaToZod", () => {
  it("generates z.string() for text field", () => {
    const field = text({ required: true });
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
  });

  it("applies minLength/maxLength for text field", () => {
    const field = text({ minLength: 2, maxLength: 5 });
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse("a").success).toBe(false);
    expect(schema.safeParse("ab").success).toBe(true);
    expect(schema.safeParse("abcde").success).toBe(true);
    expect(schema.safeParse("abcdef").success).toBe(false);
  });

  it("generates z.number() for number field", () => {
    const field = number();
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse(42).success).toBe(true);
    expect(schema.safeParse("42").success).toBe(false);
  });

  it("applies min/max for number field", () => {
    const field = number({ min: 0, max: 100 });
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse(-1).success).toBe(false);
    expect(schema.safeParse(0).success).toBe(true);
    expect(schema.safeParse(100).success).toBe(true);
    expect(schema.safeParse(101).success).toBe(false);
  });

  it("generates z.boolean() for checkbox field", () => {
    const field = checkbox();
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);
    expect(schema.safeParse("true").success).toBe(false);
  });

  it("generates z.enum() for select field", () => {
    const field = select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse("draft").success).toBe(true);
    expect(schema.safeParse("published").success).toBe(true);
    expect(schema.safeParse("invalid").success).toBe(false);
  });

  it("generates z.array(z.enum()) for hasMany select field", () => {
    const field = select({
      options: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
      hasMany: true,
    });
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse(["a", "b"]).success).toBe(true);
    expect(schema.safeParse(["a", "invalid"]).success).toBe(false);
    expect(schema.safeParse("a").success).toBe(false);
  });

  it("generates z.number() for date field (epoch ms)", () => {
    const field = date();
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse(Date.now()).success).toBe(true);
    expect(schema.safeParse("2024-01-01").success).toBe(false);
  });

  it("generates z.string().url() or empty for imageUrl field", () => {
    const field = imageUrl();
    const schema = fieldMetaToZod({ field });
    expect(schema.safeParse("https://example.com/img.png").success).toBe(true);
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
  });

  it("generates z.string() for upload field", () => {
    const schema = generateFormSchema({
      fields: { cover: upload({ to: "images", required: true }) },
    });
    expect(schema.safeParse({ cover: "abc123" }).success).toBe(true);
  });

  it("generates z.array(z.string()) for hasMany upload field", () => {
    const schema = generateFormSchema({
      fields: {
        gallery: upload({ to: "images", hasMany: true, required: true }),
      },
    });
    expect(schema.safeParse({ gallery: ["abc123", "def456"] }).success).toBe(
      true,
    );
  });
});

describe("generateFormSchema", () => {
  it("returns an empty object schema for empty fields", () => {
    const schema = generateFormSchema({ fields: {} });
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("generates a schema with required and optional fields", () => {
    const schema = generateFormSchema({
      fields: {
        title: text({ required: true }),
        subtitle: text(),
      },
    });
    expect(schema.safeParse({ title: "Hello" }).success).toBe(true);
    expect(schema.safeParse({ title: "Hello", subtitle: "World" }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ subtitle: "World" }).success).toBe(false);
  });

  it("excludes hidden fields from the schema", () => {
    const schema = generateFormSchema({
      fields: {
        visible: text({ required: true }),
        hidden: text({ required: true, admin: { hidden: true } }),
      },
    });
    expect(schema.safeParse({ visible: "ok" }).success).toBe(true);
    expect("hidden" in schema.shape).toBe(false);
  });

  it("matches test-app articles collection shape", () => {
    const schema = generateFormSchema({
      fields: {
        name: text({ label: "Name", required: true }),
        slug: text({ label: "Slug", required: true }),
        index: number({ defaultValue: 0, label: "Index" }),
      },
    });
    expect(
      schema.safeParse({ name: "Hello", slug: "hello", index: 5 }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ name: "Hello", slug: "hello" }).success,
    ).toBe(true);
    expect(schema.safeParse({ slug: "hello" }).success).toBe(false);
  });

  it("matches test-app posts collection shape", () => {
    const schema = generateFormSchema({
      fields: {
        title: text({ required: true, maxLength: 200 }),
        subtitle: text({ required: true, maxLength: 200 }),
        slug: text({ required: true }),
        featured: checkbox({ defaultValue: false }),
        status: select({
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Archived", value: "archived" },
          ],
          required: true,
        }),
      },
    });
    expect(
      schema.safeParse({
        title: "Post",
        subtitle: "Sub",
        slug: "post",
        status: "draft",
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        title: "Post",
        subtitle: "Sub",
        slug: "post",
        featured: true,
        status: "published",
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        title: "Post",
        subtitle: "Sub",
        slug: "post",
        status: "invalid",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        title: "a".repeat(201),
        subtitle: "Sub",
        slug: "post",
        status: "draft",
      }).success,
    ).toBe(false);
  });
});

describe("fieldMetaToZod — blocks", () => {
  const heroBlock = defineBlock({
    slug: "hero",
    label: "Hero",
    fields: {
      heading: text({ required: true, defaultValue: "" }),
      subheading: text(),
    },
  });

  const ctaBlock = defineBlock({
    slug: "cta",
    label: "CTA",
    fields: { label: text({ required: true, defaultValue: "" }) },
  });

  it("validates a correct block instance", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock, ctaBlock] }),
    });

    const result = schema.safeParse([
      { blockType: "hero", _key: "abc", heading: "Welcome", subheading: "Hi" },
      { blockType: "cta", _key: "def", label: "Click me" },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects block with wrong blockType", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock] }),
    });

    const result = schema.safeParse([
      { blockType: "unknown", _key: "abc", heading: "Hi" },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects block missing required field", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock] }),
    });

    const result = schema.safeParse([
      { blockType: "hero", _key: "abc" }, // missing required "heading"
    ]);

    expect(result.success).toBe(false);
  });

  it("accepts empty array", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock] }),
    });

    const result = schema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("enforces min/max constraints", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock], min: 1, max: 3 }),
    });

    expect(schema.safeParse([]).success).toBe(false); // below min
    expect(
      schema.safeParse([
        { blockType: "hero", _key: "a", heading: "1" },
        { blockType: "hero", _key: "b", heading: "2" },
        { blockType: "hero", _key: "c", heading: "3" },
        { blockType: "hero", _key: "d", heading: "4" },
      ]).success,
    ).toBe(false); // above max
  });

  it("validates block with no fields (divider)", () => {
    const divider = defineBlock({
      slug: "divider",
      label: "Divider",
      fields: {},
    });
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [divider] }),
    });

    const result = schema.safeParse([{ blockType: "divider", _key: "abc" }]);
    expect(result.success).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { generateFormSchema, fieldMetaToZod } from "./generateFormSchema";
import { text, number, checkbox, select, date, imageUrl } from "../fields";

describe("fieldMetaToZod", () => {
  it("generates z.string() for text field", () => {
    const field = text({ required: true });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
  });

  it("applies minLength/maxLength for text field", () => {
    const field = text({ minLength: 2, maxLength: 5 });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse("a").success).toBe(false);
    expect(schema.safeParse("ab").success).toBe(true);
    expect(schema.safeParse("abcde").success).toBe(true);
    expect(schema.safeParse("abcdef").success).toBe(false);
  });

  it("generates z.number() for number field", () => {
    const field = number();
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(42).success).toBe(true);
    expect(schema.safeParse("42").success).toBe(false);
  });

  it("applies min/max for number field", () => {
    const field = number({ min: 0, max: 100 });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(-1).success).toBe(false);
    expect(schema.safeParse(0).success).toBe(true);
    expect(schema.safeParse(100).success).toBe(true);
    expect(schema.safeParse(101).success).toBe(false);
  });

  it("generates z.boolean() for checkbox field", () => {
    const field = checkbox();
    const schema = fieldMetaToZod({ meta: field._meta });
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
    const schema = fieldMetaToZod({ meta: field._meta });
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
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(["a", "b"]).success).toBe(true);
    expect(schema.safeParse(["a", "invalid"]).success).toBe(false);
    expect(schema.safeParse("a").success).toBe(false);
  });

  it("generates z.number() for date field (epoch ms)", () => {
    const field = date();
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(Date.now()).success).toBe(true);
    expect(schema.safeParse("2024-01-01").success).toBe(false);
  });

  it("generates z.string().url() or empty for imageUrl field", () => {
    const field = imageUrl();
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse("https://example.com/img.png").success).toBe(true);
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
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

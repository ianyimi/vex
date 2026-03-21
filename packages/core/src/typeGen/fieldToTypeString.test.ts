import { describe, it, expect } from "vitest";
import { fieldToTypeString } from "./fieldToTypeString";
import { text, number, checkbox, select, date, imageUrl, json, array, relationship, upload, richtext } from "../fields";
import { blocks } from "../fields/blocks";
import { defineBlock } from "../blocks/defineBlock";

describe("fieldToTypeString", () => {
  it("text → string", () => {
    expect(fieldToTypeString({ field: text() })).toBe("string");
  });

  it("number → number", () => {
    expect(fieldToTypeString({ field: number() })).toBe("number");
  });

  it("checkbox → boolean", () => {
    expect(fieldToTypeString({ field: checkbox() })).toBe("boolean");
  });

  it("date → number", () => {
    expect(fieldToTypeString({ field: date() })).toBe("number");
  });

  it("imageUrl → string", () => {
    expect(fieldToTypeString({ field: imageUrl() })).toBe("string");
  });

  it("json → Record<string, unknown>", () => {
    expect(fieldToTypeString({ field: json() })).toBe("Record<string, unknown>");
  });

  it("richtext → RichTextDocument", () => {
    expect(fieldToTypeString({ field: richtext() })).toBe("RichTextDocument");
  });

  it("select single → literal union", () => {
    expect(
      fieldToTypeString({
        field: select({
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      }),
    ).toBe("'draft' | 'published'");
  });

  it("select hasMany → array of literal union", () => {
    expect(
      fieldToTypeString({
        field: select({
          options: [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
          ],
          hasMany: true,
        }),
      }),
    ).toBe("('a' | 'b')[]");
  });

  it("select with no options → string", () => {
    expect(fieldToTypeString({ field: select({ options: [] }) })).toBe("string");
  });

  it("relationship single → Id<'slug'>", () => {
    expect(fieldToTypeString({ field: relationship({ to: "authors" }) })).toBe("Id<'authors'>");
  });

  it("relationship hasMany → Id<'slug'>[]", () => {
    expect(fieldToTypeString({ field: relationship({ to: "tags", hasMany: true }) })).toBe("Id<'tags'>[]");
  });

  it("upload single → Id<'slug'>", () => {
    expect(fieldToTypeString({ field: upload({ to: "media" }) })).toBe("Id<'media'>");
  });

  it("upload hasMany → Id<'slug'>[]", () => {
    expect(fieldToTypeString({ field: upload({ to: "media", hasMany: true }) })).toBe("Id<'media'>[]");
  });

  it("array of text → string[]", () => {
    expect(fieldToTypeString({ field: array({ field: text() }) })).toBe("string[]");
  });

  it("array of select → (union)[]", () => {
    expect(
      fieldToTypeString({
        field: array({
          field: select({
            options: [
              { label: "A", value: "a" },
              { label: "B", value: "b" },
            ],
          }),
        }),
      }),
    ).toBe("('a' | 'b')[]");
  });

  it("blocks → union of interface names[]", () => {
    const hero = defineBlock({ slug: "hero", label: "Hero", fields: {} });
    const cta = defineBlock({ slug: "cta", label: "CTA", fields: {} });
    const nameMap = new Map([["hero", "HeroBlock"], ["cta", "CtaBlock"]]);

    expect(
      fieldToTypeString({
        field: blocks({ blocks: [hero, cta] }),
        blockInterfaceNames: nameMap,
      }),
    ).toBe("(HeroBlock | CtaBlock)[]");
  });

  it("blocks single type → no parens", () => {
    const hero = defineBlock({ slug: "hero", label: "Hero", fields: {} });
    const nameMap = new Map([["hero", "HeroBlock"]]);

    expect(
      fieldToTypeString({
        field: blocks({ blocks: [hero] }),
        blockInterfaceNames: nameMap,
      }),
    ).toBe("HeroBlock[]");
  });
});

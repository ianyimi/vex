import { describe, it, expect } from "vitest";
import { cloneDocumentForDuplicate } from "./cloneDocumentForDuplicate";
import { text, group, array, blocks, tabs, defineBlock } from "../fields";
import type { AdminField } from "../fields";

const itemBlock = defineBlock({
  slug: "item",
  label: "Item",
  fields: { label: text() },
});

const galleryBlock = defineBlock({
  slug: "gallery",
  label: "Gallery",
  fields: {
    items: blocks({ label: "Items", blocks: [itemBlock] }),
  },
});

describe("cloneDocumentForDuplicate", () => {
  it("strips _id, _creationTime and updatedAt, keeping every other field as-is", () => {
    const fields: Record<string, AdminField> = { title: text(), slug: text() };
    const document = {
      _id: "doc1",
      _creationTime: 1700000000000,
      updatedAt: 1700000000000,
      title: "Hello",
      slug: "hello",
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned).toEqual({ title: "Hello", slug: "hello" });
  });

  it("strips every VERSION_SYSTEM_FIELDS member from a versioned collection's document", () => {
    const fields: Record<string, AdminField> = { title: text() };
    const document = {
      _id: "doc1",
      _creationTime: 1700000000000,
      vex_status: "published",
      vex_publishedAt: 1700000000000,
      vex_publishedId: "doc1",
      vex_activeVersion: 3,
      title: "Hello",
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned).toEqual({ title: "Hello" });
  });

  it("regenerates a top-level blocks() field's item ids", () => {
    const fields: Record<string, AdminField> = {
      body: blocks({ label: "Body", blocks: [itemBlock] }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      body: [
        { id: "b1", blockType: "item", label: "A" },
        { id: "b2", blockType: "item", label: "B" },
      ],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const body = cloned.body as { id: string; blockType: string; label: string }[];
    expect(body).toHaveLength(2);
    expect(body[0]?.id).not.toBe("b1");
    expect(body[0]?.label).toBe("A");
    expect(body[1]?.id).not.toBe("b2");
    expect(body[1]?.label).toBe("B");
  });

  it("regenerates ids on a block nested inside another block's own blocks() field", () => {
    const fields: Record<string, AdminField> = {
      body: blocks({ label: "Body", blocks: [galleryBlock] }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      body: [
        {
          id: "g1",
          blockType: "gallery",
          items: [{ id: "i1", blockType: "item", label: "Inner" }],
        },
      ],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const body = cloned.body as { id: string; items: { id: string; label: string }[] }[];
    expect(body[0]?.id).not.toBe("g1");
    expect(body[0]?.items[0]?.id).not.toBe("i1");
    expect(body[0]?.items[0]?.label).toBe("Inner");
  });

  it("regenerates block ids nested inside a group() field", () => {
    const fields: Record<string, AdminField> = {
      hero: group({
        label: "Hero",
        fields: { content: blocks({ label: "Content", blocks: [itemBlock] }) },
      }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      hero: { content: [{ id: "c1", blockType: "item", label: "Hi" }] },
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const hero = cloned.hero as { content: { id: string; label: string }[] };
    expect(hero.content[0]?.id).not.toBe("c1");
    expect(hero.content[0]?.label).toBe("Hi");
  });

  it("regenerates block ids nested inside an array() field's items", () => {
    const fields: Record<string, AdminField> = {
      sections: array({
        label: "Sections",
        items: group({ label: "Section", fields: { content: blocks({ label: "Content", blocks: [itemBlock] }) } }),
      }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      sections: [{ content: [{ id: "s1", blockType: "item", label: "First" }] }],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const sections = cloned.sections as { content: { id: string; label: string }[] }[];
    expect(sections[0]?.content[0]?.id).not.toBe("s1");
    expect(sections[0]?.content[0]?.label).toBe("First");
  });

  it("regenerates block ids nested inside a named tab, which getDataFields flattens to a group-shaped field", () => {
    const fields: Record<string, AdminField> = {
      info: tabs({
        tabs: [
          { label: "Content", fields: { title: text() } },
          { label: "SEO", name: "seo", fields: { gallery: blocks({ label: "Gallery", blocks: [itemBlock] }) } },
        ],
      }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      title: "Hello",
      seo: { gallery: [{ id: "t1", blockType: "item", label: "Tab item" }] },
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned.title).toBe("Hello");
    const seo = cloned.seo as { gallery: { id: string; label: string }[] };
    expect(seo.gallery[0]?.id).not.toBe("t1");
    expect(seo.gallery[0]?.label).toBe("Tab item");
  });

  it("leaves an unrecognised nested blockType's id untouched", () => {
    const fields: Record<string, AdminField> = {
      body: blocks({ label: "Body", blocks: [itemBlock] }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      body: [{ id: "u1", blockType: "not-registered", label: "A" }],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const body = cloned.body as { id: string }[];
    expect(body[0]?.id).toBe("u1");
  });

  it("leaves a plain array() of text items unchanged beyond the framework-field strip", () => {
    const fields: Record<string, AdminField> = {
      tags: array({ label: "Tags", items: text() }),
    };
    const document = { _id: "doc1", _creationTime: 1, tags: ["a", "b"] };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned.tags).toEqual(["a", "b"]);
  });
});

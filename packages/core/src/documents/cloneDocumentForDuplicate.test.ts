import { describe, it, expect } from "vitest";
import { cloneDocumentForDuplicate, nextDuplicateTitle, resolveDuplicateTitle } from "./cloneDocumentForDuplicate";
import { text, group, array, blocks, tabs, defineBlock, commitTs, keyValue } from "../fields";
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
    const fields: Record<string, AdminField> = { title: text(), slug: text(), updatedAt: commitTs() };
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

  it("regenerates block ids nested inside a keyValue() field's value", () => {
    const fields: Record<string, AdminField> = {
      content: keyValue({
        value: blocks({ blocks: [itemBlock] }),
      }),
    };
    const document = {
      content: { featured: [{ id: "orig", blockType: "item", label: "a" }] },
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const content = cloned.content as Record<string, { id: string }[]>;
    expect(content.featured![0]!.id).not.toBe("orig");
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

  it("renames the useAsTitle field, appending (2) to a plain title", () => {
    const fields: Record<string, AdminField> = { title: text() };
    const document = { _id: "doc1", _creationTime: 1, title: "Browser Test 11/22" };
    const cloned = cloneDocumentForDuplicate({ fields, document, useAsTitle: "title" });
    expect(cloned.title).toBe("Browser Test 11/22 (2)");
  });

  it("renames the useAsTitle field, incrementing an existing (x) suffix", () => {
    const fields: Record<string, AdminField> = { title: text() };
    const document = { _id: "doc1", _creationTime: 1, title: "Browser Test 11/22 (2)" };
    const cloned = cloneDocumentForDuplicate({ fields, document, useAsTitle: "title" });
    expect(cloned.title).toBe("Browser Test 11/22 (3)");
  });

  it("skips the rename when useAsTitle is a Convex system field", () => {
    const fields: Record<string, AdminField> = { title: text() };
    const document = { _id: "doc1", _creationTime: 1, title: "Hello" };
    const cloned = cloneDocumentForDuplicate({ fields, document, useAsTitle: "_id" });
    expect(cloned.title).toBe("Hello");
    expect(cloned._id).toBeUndefined();
  });

  it("skips the rename when useAsTitle's value is not a non-empty string", () => {
    const fields: Record<string, AdminField> = { title: text() };
    const emptyDocument = { _id: "doc1", _creationTime: 1, title: "" };
    expect(cloneDocumentForDuplicate({ fields, document: emptyDocument, useAsTitle: "title" }).title).toBe("");

    const numericFields: Record<string, AdminField> = { rank: text() };
    const numericDocument = { _id: "doc1", _creationTime: 1, rank: 3 };
    expect(
      cloneDocumentForDuplicate({ fields: numericFields, document: numericDocument, useAsTitle: "rank" }).rank,
    ).toBe(3);
  });

  it("leaves the clone untouched when useAsTitle is omitted", () => {
    const fields: Record<string, AdminField> = { title: text() };
    const document = { _id: "doc1", _creationTime: 1, title: "Hello" };
    expect(cloneDocumentForDuplicate({ fields, document }).title).toBe("Hello");
  });
});

describe("nextDuplicateTitle", () => {
  it("appends (2) to a plain title", () => {
    expect(nextDuplicateTitle("Name")).toBe("Name (2)");
  });

  it("increments an existing (x) suffix", () => {
    expect(nextDuplicateTitle("Name (2)")).toBe("Name (3)");
    expect(nextDuplicateTitle("Name (9)")).toBe("Name (10)");
  });

  it("increments a number past Number.MAX_SAFE_INTEGER exactly, via BigInt", () => {
    expect(nextDuplicateTitle("Name (9007199254740993)")).toBe("Name (9007199254740994)");
  });
});

describe("resolveDuplicateTitle", () => {
  it("returns the current title for a renameable field", () => {
    expect(resolveDuplicateTitle({ useAsTitle: "title", document: { title: "Hello" } })).toBe("Hello");
  });

  it("returns undefined for a Convex system field", () => {
    expect(resolveDuplicateTitle({ useAsTitle: "_id", document: { _id: "doc1" } })).toBeUndefined();
  });

  it("returns undefined when useAsTitle is omitted", () => {
    expect(resolveDuplicateTitle({ useAsTitle: undefined, document: { title: "Hello" } })).toBeUndefined();
  });

  it("returns undefined for an empty or non-string value", () => {
    expect(resolveDuplicateTitle({ useAsTitle: "title", document: { title: "" } })).toBeUndefined();
    expect(resolveDuplicateTitle({ useAsTitle: "rank", document: { rank: 3 } })).toBeUndefined();
  });
});

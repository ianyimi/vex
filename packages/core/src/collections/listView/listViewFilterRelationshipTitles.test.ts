import { describe, expect, it } from "vitest";
import { defineCollection, relationship, text, upload } from "../../index";
import { collectListViewFilterRelationshipValues } from "./listViewFilterRelationshipTitles";

const collection = defineCollection({
  slug: "collect_relationship_filter_test",
  fields: {
    title: text({ required: false }),
    author: relationship({ collection: { slug: "authors" }, required: false }),
    tags: relationship({ collection: { slug: "tags" }, hasMany: true, required: false }),
    cover: upload({ to: "images", required: false }),
  },
  admin: {
    view: { searchFields: [], pageSizeOptions: [10, 25, 50], pageSize: 10 },
  },
});

describe("collectListViewFilterRelationshipValues", () => {
  it("returns an empty array when where is undefined", () => {
    expect(collectListViewFilterRelationshipValues({ where: undefined, collection })).toEqual([]);
  });

  it("collects a relationship leaf's id with its target collection", () => {
    const where = { field: "author", op: "eq", value: "author_1" } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([
      { fieldKey: "author", targetCollection: "authors", id: "author_1" },
    ]);
  });

  it("collects an upload leaf's id with its target media collection (`to`, not `collection.slug`)", () => {
    const where = { field: "cover", op: "neq", value: "media_1" } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([
      { fieldKey: "cover", targetCollection: "images", id: "media_1" },
    ]);
  });

  it("skips a non-relationship/upload leaf", () => {
    const where = { field: "title", op: "eq", value: "hello" } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([]);
  });

  it("skips isEmpty/isNotEmpty leaves — compiled on the wire as eq/neq with value: undefined (no concrete id)", () => {
    const where = { field: "author", op: "eq", value: undefined } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([]);
  });

  it("skips a leaf whose value isn't a plain string (e.g. an array)", () => {
    const where = { field: "tags", op: "eq", value: ["tag_1", "tag_2"] } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([]);
  });

  it("skips a leaf naming an unrecognized field key", () => {
    const where = { field: "not_a_real_field", op: "eq", value: "x" } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([]);
  });

  it("walks and/or/not nesting, collecting every relationship/upload leaf found", () => {
    const where = {
      or: [
        { and: [{ field: "author", op: "eq", value: "author_1" }, { field: "title", op: "eq", value: "hi" }] },
        { not: { field: "cover", op: "eq", value: "media_2" } },
      ],
    } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([
      { fieldKey: "author", targetCollection: "authors", id: "author_1" },
      { fieldKey: "cover", targetCollection: "images", id: "media_2" },
    ]);
  });

  it("produces one entry per occurrence when the same field is filtered twice (caller dedupes)", () => {
    const where = {
      or: [
        { field: "author", op: "eq", value: "author_1" },
        { field: "author", op: "eq", value: "author_1" },
      ],
    } as const;

    expect(collectListViewFilterRelationshipValues({ where, collection })).toEqual([
      { fieldKey: "author", targetCollection: "authors", id: "author_1" },
      { fieldKey: "author", targetCollection: "authors", id: "author_1" },
    ]);
  });
});

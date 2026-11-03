import { describe, expect, it } from "vitest";
import { checkbox, defineCollection, text } from "../../index";
import { buildListViewFindQueryArgs, buildListViewSearchQueryArgs } from "./listViewQueryArgs";

const collection = defineCollection({
  slug: "posts",
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
    featured: checkbox(),
  },
});

describe("buildListViewFindQueryArgs", () => {
  it("builds a find-mode call carrying the given where/sort/drafts/depth", () => {
    const where = { field: "featured", op: "eq", value: true } as const;
    const sort = { field: "title", order: "asc" } as const;
    expect(buildListViewFindQueryArgs({ collection, where, sort, drafts: true, depth: 1, numItems: 10 })).toEqual({
      collection: "posts",
      where,
      sort,
      drafts: true,
      depth: 1,
      paginationOpts: { numItems: 10, totalDocs: true, cursor: null },
    });
  });

  it("resolves a builder-callback where to a plain node", () => {
    const result = buildListViewFindQueryArgs({ collection, where: (q) => q.eq("featured", true), numItems: 10 });
    expect(result.where).toEqual({ field: "featured", op: "eq", value: true });
  });

  it("omits where/sort/drafts/depth when none are given", () => {
    expect(buildListViewFindQueryArgs({ collection, numItems: 10 })).toEqual({
      collection: "posts",
      where: undefined,
      sort: undefined,
      drafts: undefined,
      depth: undefined,
      paginationOpts: { numItems: 10, totalDocs: true, cursor: null },
    });
  });

  it("forwards an explicit cursor instead of defaulting to null", () => {
    expect(buildListViewFindQueryArgs({ collection, numItems: 10, cursor: "abc" }).paginationOpts.cursor).toBe("abc");
  });
});

describe("buildListViewSearchQueryArgs", () => {
  it("resolves searchField to its declared searchIndex name", () => {
    expect(buildListViewSearchQueryArgs({ collection, search: "hello", searchField: "title", numItems: 10 })).toEqual({
      collection: "posts",
      searchIndexName: "search_title",
      searchField: "title",
      query: "hello",
      where: undefined,
      drafts: undefined,
      paginationOpts: { numItems: 10, cursor: null },
    });
  });

  it("throws when searchField names a field with no declared searchIndex", () => {
    expect(() =>
      buildListViewSearchQueryArgs({ collection, search: "hello", searchField: "featured", numItems: 10 }),
    ).toThrow('field "featured" has no declared searchIndex');
  });

  it("throws when searchField names an unknown field", () => {
    expect(() =>
      buildListViewSearchQueryArgs({ collection, search: "hello", searchField: "ghost", numItems: 10 }),
    ).toThrow('field "ghost" has no declared searchIndex');
  });
});

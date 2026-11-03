import { describe, expect, it } from "vitest";

import { text } from "../../fields";
import { defineCollection } from "../config";
import { VexConfigError } from "../../errors";

describe("validateSavedListViewConfig — searchFields", () => {
  it("accepts a searchFields entry whose field declares its own searchIndex", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: {
          title: text({ required: true, searchIndex: { name: "search_title", filterFields: [] } }),
        },
        admin: { view: { searchFields: ["title"] } },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the view, field, and searchIndex to add when a searchFields entry has none", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: { view: { searchFields: ["title"] } },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "default" declares searchFields naming "title", which has no ' +
          'searchIndex. Add searchIndex: { name: "search_title", filterFields: [] } to the "title" field.',
      ),
    );
  });

  it("throws VexConfigError naming the OFFENDING PRESET view when its own searchFields override has none (Decision 45 — admin.views entries accept the same settings as admin.view)", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          views: [{ viewId: "bad", name: "Bad", state: { searchFields: ["title"] } }],
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "bad" declares searchFields naming "title", which has no ' +
          'searchIndex. Add searchIndex: { name: "search_title", filterFields: [] } to the "title" field.',
      ),
    );
  });
});

describe("validateSavedListViewConfig — sort", () => {
  it("accepts the default admin.view.sort.field of _creationTime with no index", () => {
    expect(() =>
      defineCollection({ slug: "posts", fields: { title: text({ required: true }) } }),
    ).not.toThrow();
  });

  it("accepts an admin.view.sort.field that leads a declared index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true, index: "by_title" }) },
        admin: { view: { sort: { field: "title", order: "asc" } } },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the field and index to declare when admin.view.sort.field leads no index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: { view: { sort: { field: "title", order: "asc" } } },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "default" sorts by field "title", which leads no ' +
          'declared index. Add index: "by_title" to the "title" field, or a ' +
          'collection-level indexes entry starting with "title".',
      ),
    );
  });

  it("throws VexConfigError when an admin.enableSorting field leads no index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { author: text({ required: true, admin: { enableSorting: true } }) },
      }),
    ).toThrow(VexConfigError);
  });

  it("accepts an admin.enableSorting field that leads a declared index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { author: text({ required: true, index: "by_author", admin: { enableSorting: true } }) },
      }),
    ).not.toThrow();
  });
});

describe("validateSavedListViewConfig — admin.view.searchField", () => {
  it("accepts an admin.view.searchField that is one of admin.view.searchFields's declared entries", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true, searchIndex: { name: "search_title", filterFields: [] } }) },
        admin: { view: { searchFields: ["title"], searchField: "title" } },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the view and the declared entries when admin.view.searchField is not declared on admin.view.searchFields", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: {
          title: text({ required: true, searchIndex: { name: "search_title", filterFields: [] } }),
          body: text({ required: true, searchIndex: { name: "search_body", filterFields: [] } }),
        },
        admin: { view: { searchFields: ["title"], searchField: "body" } },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "default" searches field "body", which is not one ' +
          "of this view's own declared searchFields (\"title\").",
      ),
    );
  });

  it("validates a preset view's own searchField against ITS OWN searchFields, not admin.view's (Decision 45 two-tier fallback)", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: {
          title: text({ required: true, searchIndex: { name: "search_title", filterFields: [] } }),
          body: text({ required: true, searchIndex: { name: "search_body", filterFields: [] } }),
        },
        admin: {
          view: { searchFields: ["title"] },
          views: [
            { viewId: "by-body", name: "By body", state: { searchFields: ["body"], searchField: "body" } },
          ],
        },
      }),
    ).not.toThrow();
  });
});

describe("validateSavedListViewConfig — admin.views (Decision 45/48)", () => {
  it("accepts a preset admin.views entry alongside the default view", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: { views: [{ viewId: "featured", name: "Featured", state: {} }] },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError when an admin.views entry reuses the reserved \"default\" id", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: { views: [{ viewId: "default", name: "Duplicate", state: {} }] },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": more than one view has viewId "default". View ids must be ' +
          'unique within a collection (the default view\'s id "default" is reserved — an ' +
          "admin.views entry can't reuse it).",
      ),
    );
  });

  it("throws VexConfigError when two admin.views entries share a viewId", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          views: [
            { viewId: "dup", name: "One", state: {} },
            { viewId: "dup", name: "Two", state: {} },
          ],
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": more than one view has viewId "dup". View ids must be ' +
          'unique within a collection (the default view\'s id "default" is reserved — an ' +
          "admin.views entry can't reuse it).",
      ),
    );
  });

  it("throws VexConfigError when an admin.views entry's where names an unknown field", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          views: [{ viewId: "bad", name: "Bad", state: { where: { field: "nope", op: "eq", value: 1 } } }],
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "bad" has a where clause naming unknown field "nope". ' +
          "Views can only filter on this collection's own fields or \"_creationTime\".",
      ),
    );
  });

  it("throws VexConfigError when an admin.views entry's columns name an unknown field (bare-slug entry)", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          views: [{ viewId: "bad", name: "Bad", state: { columns: ["nope" as "title"] } }],
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "bad" has an unknown column "nope". Columns must ' +
          "name one of this collection's own fields.",
      ),
    );
  });

  it("throws VexConfigError when an admin.views entry's columns name an unknown field (object-shaped entry, Decision 48)", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          views: [{ viewId: "bad", name: "Bad", state: { columns: [{ field: "nope" as "title", width: 200 }] } }],
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "bad" has an unknown column "nope". Columns must ' +
          "name one of this collection's own fields.",
      ),
    );
  });

  it("throws VexConfigError when a column entry names the reserved selection-column id \"select\" (Decision 48)", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          views: [{ viewId: "bad", name: "Bad", state: { columns: ["select" as "title"] } }],
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "bad" has a column entry naming "select", which is ' +
          "reserved for the always-first, always-left-pinned selection checkbox column.",
      ),
    );
  });

  it("throws VexConfigError when a view-level column entry sets enableSorting: true on a field that leads no index (Decision 48)", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          views: [
            { viewId: "bad", name: "Bad", state: { columns: [{ field: "title", enableSorting: true }] } },
          ],
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": view "bad" sets enableSorting: true on column "title", but it ' +
          'leads no declared index. Add index: "by_title" to the "title" field, or a ' +
          'collection-level indexes entry starting with "title".',
      ),
    );
  });

  it("accepts a view-level column entry setting enableSorting: true on a field that leads a declared index, even when the field's own admin.enableSorting is false (Decision 48 — views always win)", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true, index: "by_title" }) },
        admin: {
          views: [
            { viewId: "ok", name: "Ok", state: { columns: [{ field: "title", enableSorting: true }] } },
          ],
        },
      }),
    ).not.toThrow();
  });
});

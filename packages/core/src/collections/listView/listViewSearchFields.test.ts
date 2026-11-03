import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../../index";
import type { ResolvedFieldPermissions } from "../../access";
import { readableListViewSearchFields, resolveListViewSearchField } from "./listViewSearchFields";

const collection = defineCollection({
  slug: "search_resolve_test",
  fields: {
    contactEmail: text({ required: false, searchIndex: { name: "search_contact_email", filterFields: [] } }),
    title: text({ required: false, searchIndex: { name: "search_title", filterFields: [] } }),
    bio: text({ required: false, searchIndex: { name: "search_bio", filterFields: [] } }),
    rating: text({ required: false }),
  },
  admin: { view: { searchFields: ["contactEmail", "title", "bio"] } },
});

const noSearchFieldCollection = defineCollection({
  slug: "search_resolve_test_none",
  fields: { title: text({ required: false }) },
});

const allReadable: ResolvedFieldPermissions = { wildcard: true, fields: {} };
const onlyTitleReadable: ResolvedFieldPermissions = {
  wildcard: false,
  fields: { title: true },
};
const nothingReadable: ResolvedFieldPermissions = { wildcard: false, fields: {} };

describe("resolveListViewSearchField", () => {
  // Case 1: `q` without `qf` → the first declared searchField entry.
  it("defaults to the first readable searchField entry when qf is undefined", () => {
    expect(
      resolveListViewSearchField({ collection, qf: undefined, fieldPermissions: allReadable }),
    ).toBe("contactEmail");
  });

  it("returns qf unchanged when it names a readable searchField entry", () => {
    expect(resolveListViewSearchField({ collection, qf: "title", fieldPermissions: allReadable })).toBe(
      "title",
    );
  });

  // Case 2: `qf` not in searchField (e.g. "rating" or "nope") → dropped, falls back to the default.
  it("falls back to the first readable entry when qf names a field outside searchField", () => {
    expect(resolveListViewSearchField({ collection, qf: "rating", fieldPermissions: allReadable })).toBe(
      "contactEmail",
    );
    expect(resolveListViewSearchField({ collection, qf: "nope", fieldPermissions: allReadable })).toBe(
      "contactEmail",
    );
  });

  // Case 3: `qf` naming a field the user can't read → dropped, falls back to the first READABLE
  // searchField entry (not necessarily the first declared one).
  it("falls back to the first readable entry when qf names an unreadable field", () => {
    expect(resolveListViewSearchField({ collection, qf: "contactEmail", fieldPermissions: onlyTitleReadable })).toBe(
      "title",
    );
  });

  // Case 3 (continued): if NO searchField entry is readable, search is unavailable entirely.
  it("returns undefined when no searchField entry is readable, regardless of qf", () => {
    expect(resolveListViewSearchField({ collection, qf: "title", fieldPermissions: nothingReadable })).toBeUndefined();
    expect(resolveListViewSearchField({ collection, qf: undefined, fieldPermissions: nothingReadable })).toBeUndefined();
  });

  // Case 4: a collection with no `searchFields` at all → always undefined, never throws.
  it("returns undefined for a collection with no admin.view.state.searchFields", () => {
    expect(
      resolveListViewSearchField({
        collection: noSearchFieldCollection,
        qf: undefined,
        fieldPermissions: allReadable,
      }),
    ).toBeUndefined();
  });
});

describe("readableListViewSearchFields", () => {
  it("returns every declared entry when everything is readable", () => {
    expect(readableListViewSearchFields({ collection, fieldPermissions: allReadable })).toEqual([
      "contactEmail",
      "title",
      "bio",
    ]);
  });

  it("filters to only the readable entries, preserving declared order", () => {
    expect(readableListViewSearchFields({ collection, fieldPermissions: onlyTitleReadable })).toEqual([
      "title",
    ]);
  });

  it("returns an empty array when nothing is readable", () => {
    expect(readableListViewSearchFields({ collection, fieldPermissions: nothingReadable })).toEqual([]);
  });

  it("returns an empty array for a collection with no admin.view.state.searchFields", () => {
    expect(
      readableListViewSearchFields({ collection: noSearchFieldCollection, fieldPermissions: allReadable }),
    ).toEqual([]);
  });
});

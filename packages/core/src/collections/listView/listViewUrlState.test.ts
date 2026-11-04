import { describe, expect, it } from "vitest";
import { checkbox, date, defineCollection, number, relationship, select, text } from "../../index";
import { parseListViewUrlState, serializeListViewUrlState } from "./listViewUrlState";

const collection = defineCollection({
  slug: "url_params_test",
  fields: {
    title: text({ required: false, searchIndex: { name: "search_title", filterFields: [] } }),
    rating: number({ required: false }),
    featured: checkbox({ required: false }),
    publishedAt: date({ required: false }),
    source: select({ required: false, options: [{ label: "G2", value: "g2" }, { label: "Site", value: "site" }] }),
    company: relationship({ collection: { slug: "companies" }, required: false }),
  },
  admin: {
    view: { searchFields: ["title"], pageSizeOptions: [10, 25, 50], pageSize: 10 },
  },
});

function parse(query: string) {
  return parseListViewUrlState({ searchParams: new URLSearchParams(query), collection });
}

describe("parseListViewUrlState", () => {
  it("defaults every field for an empty query", () => {
    expect(parse("")).toEqual({
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view: undefined,
      peek: undefined,
      cols: undefined,
    });
  });

  it("parses an explicit empty q (present but empty value) as \"\", distinct from absent — the clear sentinel", () => {
    expect(parse("?q=").q).toBe("");
  });

  it("parses an explicit empty filter (present but empty value) as null, distinct from absent — the clear sentinel", () => {
    expect(parse("?filter=").filter).toBeNull();
  });

  it("parses q and a non-default qf", () => {
    expect(parse("?q=ma&qf=title").q).toBe("ma");
    // title IS the default (searchField[0]) in this fixture, so it still
    // round-trips as the explicit value when present in the URL — the
    // "omit when default" rule applies to SERIALIZING, not parsing.
    expect(parse("?q=ma&qf=title").qf).toBe("title");
  });

  it("drops a qf outside searchField", () => {
    expect(parse("?qf=rating").qf).toBeUndefined();
  });

  it("parses a valid sort", () => {
    expect(parse("?sort=rating.desc").sort).toEqual({ field: "rating", order: "desc" });
  });

  it("drops a sort on an unknown field", () => {
    expect(parse("?sort=nonexistent.asc").sort).toBeUndefined();
  });

  it("drops a sort with an invalid order", () => {
    expect(parse("?sort=rating.sideways").sort).toBeUndefined();
  });

  it("accepts _creationTime as a sort field", () => {
    expect(parse("?sort=_creationTime.desc").sort).toEqual({
      field: "_creationTime",
      order: "desc",
    });
  });

  it("parses a single-row filter", () => {
    expect(parse("?filter=(rating.gte.4)").filter).toEqual({
      field: "rating",
      op: "gte",
      value: 4,
    });
  });

  it("parses a multi-row AND group", () => {
    expect(parse("?filter=(rating.gte.4,featured.eq.true)").filter).toEqual({
      and: [
        { field: "rating", op: "gte", value: 4 },
        { field: "featured", op: "eq", value: true },
      ],
    });
  });

  it("parses multiple OR groups", () => {
    expect(parse("?filter=(rating.gte.4)|(source.eq.g2)").filter).toEqual({
      or: [
        { field: "rating", op: "gte", value: 4 },
        { field: "source", op: "eq", value: "g2" },
      ],
    });
  });

  it("parses isEmpty/isNotEmpty as eq/neq with value: undefined", () => {
    expect(parse("?filter=(company.isEmpty)").filter).toEqual({
      field: "company",
      op: "eq",
      value: undefined,
    });
    expect(parse("?filter=(company.isNotEmpty)").filter).toEqual({
      field: "company",
      op: "neq",
      value: undefined,
    });
  });

  it("decodes a date value from ISO into epoch ms", () => {
    const iso = "2026-09-01T00:00:00.000Z";
    expect(parse(`?filter=(publishedAt.gte.${encodeURIComponent(iso)})`).filter).toEqual({
      field: "publishedAt",
      op: "gte",
      value: Date.parse(iso),
    });
  });

  it("decodes a commitTs (updatedAt) value from ISO into epoch ms, identically to a real date field", () => {
    const iso = "2026-09-01T00:00:00.000Z";
    expect(parse(`?filter=(updatedAt.gte.${encodeURIComponent(iso)})`).filter).toEqual({
      field: "updatedAt",
      op: "gte",
      value: Date.parse(iso),
    });
  });

  it("decodes a URI-encoded string value, including one that embeds delimiter characters", () => {
    const raw = "a, b | c (d)";
    // `new URLSearchParams(query)` performs its OWN percent-decode when
    // parsing from a raw string — a single `encodeURIComponent(raw)`
    // interpolated directly into a template-string query would be fully
    // unwrapped by that constructor, leaving the delimiter characters
    // literal and indistinguishable from the grammar's own `,`/`|`/`(`/`)`.
    // In real usage `parseListViewUrlState` always receives an ALREADY-decoded
    // `URLSearchParams` (`nuqs`/Next.js hand it one built from the parsed
    // route, never a second raw string to re-parse), so this constructs
    // the fixture the same way: a plain `.set()` with no re-parse, which
    // is what preserves `encodeFilterValue`'s one `encodeURIComponent`
    // layer intact — exactly mirroring the `serializeListViewUrlState` ->
    // `new URLSearchParams(...).get()` round trip the "serializes" suite
    // below asserts.
    const searchParams = new URLSearchParams();
    searchParams.set("filter", `(title.eq.${encodeURIComponent(raw)})`);
    expect(parseListViewUrlState({ searchParams, collection }).filter).toEqual({
      field: "title",
      op: "eq",
      value: raw,
    });
  });

  it("drops a row referencing an unknown field", () => {
    expect(parse("?filter=(nope.eq.1)").filter).toBeUndefined();
  });

  it("drops a row with an unrecognized operator, keeping the rest of its group", () => {
    expect(parse("?filter=(rating.gte.4,rating.contains.5)").filter).toEqual({
      field: "rating",
      op: "gte",
      value: 4,
    });
  });

  it("drops an all-invalid group, keeping the surviving group", () => {
    expect(parse("?filter=(nope.eq.1)|(rating.gte.4)").filter).toEqual({
      field: "rating",
      op: "gte",
      value: 4,
    });
  });

  it("returns undefined for an all-invalid filter", () => {
    expect(parse("?filter=(nope.eq.1)").filter).toBeUndefined();
  });

  it("drops a size outside pageSizeOptions", () => {
    expect(parse("?size=999").size).toBeUndefined();
  });

  it("accepts a configured size", () => {
    expect(parse("?size=25").size).toBe(25);
  });

  it("parses a valid view ref", () => {
    expect(parse("?view=shared:5star").view).toBe("shared:5star");
    expect(parse("?view=config:featured").view).toBe("config:featured");
    expect(parse("?view=local:abc-123").view).toBe("local:abc-123");
  });

  it("drops a view with an unknown source prefix", () => {
    expect(parse("?view=team:abc").view).toBeUndefined();
  });

  it("parses peek as a raw id", () => {
    expect(parse("?peek=k17a4n8c").peek).toBe("k17a4n8c");
  });

  it("parses a full cols list of bare slugs", () => {
    expect(parse("?cols=rating,title,featured")).toMatchObject({
      cols: ["rating", "title", "featured"],
    });
  });

  it("parses a back-compat partial cols list unchanged (completion is resolveListViewQueryState's job, not this one)", () => {
    expect(parse("?cols=title").cols).toEqual(["title"]);
  });

  it("drops unknown field entries from cols, keeping the known ones", () => {
    expect(parse("?cols=title,nope,rating").cols).toEqual(["title", "rating"]);
  });

  it("returns undefined for an all-unknown cols list", () => {
    expect(parse("?cols=nope,alsoNope").cols).toBeUndefined();
  });

  it("returns undefined for an empty cols value", () => {
    expect(parse("?cols=").cols).toBeUndefined();
  });

  it("URI-decodes each cols entry", () => {
    expect(parse(`?cols=${encodeURIComponent("title")},rating`).cols).toEqual(["title", "rating"]);
  });

  it("parses a width suffix", () => {
    expect(parse("?cols=title:w260").cols).toEqual([{ field: "title", width: 260 }]);
  });

  it("parses a pinned-left suffix", () => {
    expect(parse("?cols=title:pl").cols).toEqual([{ field: "title", pinned: "left" }]);
  });

  it("parses a pinned-right suffix", () => {
    expect(parse("?cols=title:pr").cols).toEqual([{ field: "title", pinned: "right" }]);
  });

  it("parses a hidden suffix", () => {
    expect(parse("?cols=title:h").cols).toEqual([{ field: "title", hidden: true }]);
  });

  it("parses every suffix combined, in the canonical fixed order", () => {
    expect(parse("?cols=title:w260:pl:h").cols).toEqual([
      { field: "title", width: 260, pinned: "left", hidden: true },
    ]);
  });

  it("parses suffixes in any order (the canonical order is only a SERIALIZATION guarantee)", () => {
    expect(parse("?cols=title:h:pl:w260").cols).toEqual([
      { field: "title", width: 260, pinned: "left", hidden: true },
    ]);
  });

  it("ignores an unrecognized/malformed suffix without dropping the field", () => {
    expect(parse("?cols=title:bogus").cols).toEqual(["title"]);
  });

  it("ignores a non-positive or non-numeric width suffix", () => {
    expect(parse("?cols=title:w0").cols).toEqual(["title"]);
    expect(parse("?cols=title:wabc").cols).toEqual(["title"]);
  });

  it("mixes bare and suffixed entries in one list", () => {
    expect(parse("?cols=rating,title:pl:w200,featured:h").cols).toEqual([
      "rating",
      { field: "title", width: 200, pinned: "left" },
      { field: "featured", hidden: true },
    ]);
  });

  it("deduplicates a repeated field entry, keeping the FIRST occurrence's own suffixes", () => {
    expect(parse("?cols=title:w200,rating,title:w400").cols).toEqual([{ field: "title", width: 200 }, "rating"]);
  });

  const versionedCollection = defineCollection({
    slug: "url_params_versioned_test",
    fields: { title: text({ required: false }) },
    versions: { drafts: true },
    admin: { view: { pageSize: 10 } },
  });

  it("parses a vex_status cols= token (width/pin/hidden suffixes, same grammar as any real field) on a versioned collection — used to silently drop the whole token", () => {
    const result = parseListViewUrlState({
      searchParams: new URLSearchParams("?cols=vex_status:w200:pr,title"),
      collection: versionedCollection,
    });
    expect(result.cols).toEqual([{ field: "vex_status", width: 200, pinned: "right" }, "title"]);
  });

  it("drops a vex_status cols= token on a NON-versioned collection — it names no real field there", () => {
    const result = parseListViewUrlState({
      searchParams: new URLSearchParams("?cols=vex_status:w200,title"),
      collection,
    });
    expect(result.cols).toEqual(["title"]);
  });
});

describe("serializeListViewUrlState", () => {
  function serialize(params: Parameters<typeof serializeListViewUrlState>[0]["params"]) {
    return serializeListViewUrlState({ params, collection }).toString();
  }

  it("serializes nothing for an all-default state", () => {
    expect(serialize({ q: undefined, qf: undefined, sort: undefined, filter: undefined, size: undefined, view: undefined, peek: undefined, cols: undefined })).toBe("");
  });

  it("writes an explicit empty q=, distinct from omitting it, when q is \"\" (not undefined) — the clear sentinel", () => {
    expect(serialize({ q: "" })).toBe("q=");
  });

  it("writes an explicit empty filter=, distinct from omitting it, when filter is null (not undefined) — the clear sentinel", () => {
    expect(serialize({ filter: null })).toBe("filter=");
  });

  it("omits qf when it equals searchField[0]", () => {
    expect(serialize({ q: "ma", qf: "title" })).toBe("q=ma");
  });

  it("includes qf when it differs from the default", () => {
    const out = new URLSearchParams(serialize({ q: "ma", qf: "rating" }));
    expect(out.get("qf")).toBe("rating");
  });

  it("omits qf against admin.view's own resolved searchField, even when it's not searchFields[0]", () => {
    const withOverride = defineCollection({
      slug: "url_params_test_qf_override",
      fields: {
        title: text({ required: false, searchIndex: { name: "search_title_2", filterFields: [] } }),
        rating: text({ required: false, searchIndex: { name: "search_rating_2", filterFields: [] } }),
      },
      admin: {
        view: { searchFields: ["title", "rating"], pageSize: 10, searchField: "rating" },
      },
    });
    expect(
      serializeListViewUrlState({ params: { q: "ma", qf: "rating" }, collection: withOverride }).toString(),
    ).toBe("q=ma");
  });

  it("omits size when it equals defaultView.pageSize", () => {
    expect(serialize({ size: 10 })).toBe("");
  });

  it("includes size when it differs from the default", () => {
    const out = new URLSearchParams(serialize({ size: 25 }));
    expect(out.get("size")).toBe("25");
  });

  it("serializes a sort", () => {
    const out = new URLSearchParams(serialize({ sort: { field: "rating", order: "desc" } }));
    expect(out.get("sort")).toBe("rating.desc");
  });

  it("omits sort when it equals the collection's own resolved default sort", () => {
    expect(serialize({ sort: { field: "_creationTime", order: "desc" } })).toBe("");
  });

  it("serializes a bare leaf filter", () => {
    const out = new URLSearchParams(
      serialize({ filter: { field: "rating", op: "gte", value: 4 } }),
    );
    expect(out.get("filter")).toBe("(rating.gte.4)");
  });

  it("serializes isEmpty/isNotEmpty from a value: undefined leaf", () => {
    const out = new URLSearchParams(
      serialize({ filter: { field: "company", op: "eq", value: undefined } }),
    );
    expect(out.get("filter")).toBe("(company.isEmpty)");
  });

  it("serializes an and group and an or of groups", () => {
    const andOut = new URLSearchParams(
      serialize({
        filter: { and: [{ field: "rating", op: "gte", value: 4 }, { field: "featured", op: "eq", value: true }] },
      }),
    );
    expect(andOut.get("filter")).toBe("(rating.gte.4,featured.eq.true)");

    const orOut = new URLSearchParams(
      serialize({
        filter: { or: [{ field: "rating", op: "gte", value: 4 }, { field: "source", op: "eq", value: "g2" }] },
      }),
    );
    expect(orOut.get("filter")).toBe("(rating.gte.4)|(source.eq.g2)");
  });

  it("URI-encodes a string value containing delimiter characters", () => {
    const raw = "a, b | c (d)";
    const out = new URLSearchParams(
      serialize({ filter: { field: "title", op: "eq", value: raw } }),
    );
    expect(out.get("filter")).toBe(`(title.eq.${encodeURIComponent(raw)})`);
  });

  it("omits filter for an unrepresentable shape (not)", () => {
    expect(
      serialize({ filter: { not: { field: "rating", op: "gte", value: 4 } } as never }),
    ).toBe("");
  });

  it("serializes view and peek verbatim", () => {
    const out = new URLSearchParams(serialize({ view: "shared:5star", peek: "k17a4n8c" }));
    expect(out.get("view")).toBe("shared:5star");
    expect(out.get("peek")).toBe("k17a4n8c");
  });

  it("omits cols when it matches the collection's own default order exactly", () => {
    expect(
      serialize({ cols: ["title", "rating", "featured", "publishedAt", "source", "company", "updatedAt"] }),
    ).toBe("");
  });

  it("includes cols when it differs from the default order", () => {
    const out = new URLSearchParams(serialize({ cols: ["rating", "title"] }));
    expect(out.get("cols")).toBe("rating,title");
  });

  it("URI-encodes each cols entry", () => {
    // No field name in this fixture actually needs encoding — asserts the
    // encode call happens per-entry (round-trip coverage below proves it
    // survives a value that WOULD need it, via the shared `company` field).
    const out = new URLSearchParams(serialize({ cols: ["company", "title"] }));
    expect(out.get("cols")).toBe(`${encodeURIComponent("company")},${encodeURIComponent("title")}`);
  });

  it("serializes a width override", () => {
    const out = new URLSearchParams(serialize({ cols: [{ field: "title", width: 260 }] }));
    expect(out.get("cols")).toBe("title:w260");
  });

  it("serializes a pinned-left/right override", () => {
    expect(new URLSearchParams(serialize({ cols: [{ field: "title", pinned: "left" }] })).get("cols")).toBe(
      "title:pl",
    );
    expect(new URLSearchParams(serialize({ cols: [{ field: "title", pinned: "right" }] })).get("cols")).toBe(
      "title:pr",
    );
  });

  it("serializes a hidden override", () => {
    const out = new URLSearchParams(serialize({ cols: [{ field: "title", hidden: true }] }));
    expect(out.get("cols")).toBe("title:h");
  });

  it("serializes every suffix combined, always in the canonical fixed order (width, pin, hidden)", () => {
    const out = new URLSearchParams(
      serialize({ cols: [{ field: "title", hidden: true, pinned: "left", width: 260 }] }),
    );
    expect(out.get("cols")).toBe("title:w260:pl:h");
  });

  it("an object entry with every override unset serializes identically to a bare slug", () => {
    const out = new URLSearchParams(serialize({ cols: [{ field: "title" }] }));
    expect(out.get("cols")).toBe("title");
  });
});

describe("serializeListViewUrlState — diffs against the active view's own baseline, not just the collection default", () => {
  function serializeWithView(
    params: Parameters<typeof serializeListViewUrlState>[0]["params"],
    viewState: Parameters<typeof serializeListViewUrlState>[0]["viewState"],
  ) {
    return serializeListViewUrlState({ params, collection, viewState }).toString();
  }

  it("omits sort when it equals the active view's own saved sort, even though it differs from the collection default", () => {
    expect(
      serializeWithView({ sort: { field: "rating", order: "desc" } }, { sort: { field: "rating", order: "desc" } }),
    ).toBe("");
  });

  it("includes sort when it differs from the active view's own saved sort", () => {
    const out = new URLSearchParams(
      serializeWithView({ sort: { field: "rating", order: "asc" } }, { sort: { field: "rating", order: "desc" } }),
    );
    expect(out.get("sort")).toBe("rating.asc");
  });

  it("falls back to the collection default when the active view doesn't declare its own sort", () => {
    expect(serializeWithView({ sort: { field: "_creationTime", order: "desc" } }, {})).toBe("");
  });

  it("omits qf when it equals the active view's own saved searchField", () => {
    expect(serializeWithView({ qf: "rating" }, { searchField: "rating" })).toBe("");
  });

  it("omits size when it equals the active view's own saved pageSize", () => {
    expect(serializeWithView({ size: 25 }, { pageSize: 25 })).toBe("");
  });

  it("omits cols when it equals the active view's own saved columns, COMPLETED — the full array, not a visible subset (supersedes an earlier visible-subset rule)", () => {
    expect(
      serializeWithView(
        {
          cols: [
            "rating",
            "title",
            { field: "featured", hidden: true },
            { field: "publishedAt", hidden: true },
            { field: "source", hidden: true },
            { field: "company", hidden: true },
            { field: "updatedAt", hidden: true },
          ],
        },
        { columns: ["rating", "title"] },
      ),
    ).toBe("");
  });

  it("includes cols when it differs from the active view's own saved columns", () => {
    const out = new URLSearchParams(
      serializeWithView(
        {
          cols: [
            "title",
            "rating",
            { field: "featured", hidden: true },
            { field: "publishedAt", hidden: true },
            { field: "source", hidden: true },
            { field: "company", hidden: true },
            { field: "updatedAt", hidden: true },
          ],
        },
        { columns: ["rating", "title"] },
      ),
    );
    expect(out.get("cols")).toBe("title,rating,featured:h,publishedAt:h,source:h,company:h,updatedAt:h");
  });

  it("includes cols when only a width/pin override differs from the active view's own saved baseline", () => {
    const out = new URLSearchParams(
      serializeWithView(
        { cols: [{ field: "title", width: 300 }, "rating"] },
        { columns: ["title", "rating"] },
      ),
    );
    expect(out.get("cols")).toBe("title:w300,rating");
  });

  it("a versioned collection: resizing vex_status serializes into cols= (it used to never reach the URL at all); the unmodified baseline (vex_status still first, visible, unresized) serializes nothing", () => {
    const versionedCollection = defineCollection({
      slug: "url_params_serialize_versioned_test",
      fields: { title: text({ required: false }) },
      versions: { drafts: true },
      admin: { view: { pageSize: 10 } },
    });
    const baselineColumns = ["title", "updatedAt"];
    const unmodified = serializeListViewUrlState({
      params: { cols: [{ field: "vex_status" }, "title", "updatedAt"] },
      collection: versionedCollection,
      viewState: { columns: baselineColumns },
    }).toString();
    expect(unmodified).toBe("");

    const resized = new URLSearchParams(
      serializeListViewUrlState({
        params: { cols: [{ field: "vex_status", width: 220 }, "title", "updatedAt"] },
        collection: versionedCollection,
        viewState: { columns: baselineColumns },
      }).toString(),
    );
    expect(resized.get("cols")).toBe("vex_status:w220,title,updatedAt");
  });
});

describe("round-trip", () => {
  const cases: { name: string; query: string }[] = [
    { name: "empty", query: "" },
    { name: "search with non-default field", query: "q=ma&qf=rating" },
    { name: "sort", query: "sort=rating.desc" },
    { name: "search with parked sort", query: "q=ma&sort=rating.desc" },
    { name: "and group", query: "filter=(rating.gte.4%2Cfeatured.eq.true)" },
    { name: "or of groups", query: "filter=(rating.gte.4)%7C(source.eq.g2)" },
    { name: "isEmpty", query: "filter=(company.isEmpty)" },
    { name: "non-default size", query: "size=25" },
    { name: "shared view with changes", query: "view=shared%3Areview&sort=rating.desc" },
    { name: "peek", query: "peek=k17a4n8c" },
    { name: "explicit clear q", query: "q=" },
    { name: "explicit clear filter", query: "filter=" },
    { name: "cols, explicit full reorder", query: "cols=rating%2Ctitle%2Cfeatured%2CpublishedAt%2Csource%2Ccompany%2CupdatedAt" },
    { name: "cols, back-compat partial subset", query: "cols=title%2Crating" },
    { name: "cols, width/pin/hidden suffixes combined", query: "cols=title%3Aw260%3Apl%3Ah%2Crating" },
    { name: "cols, pinned-right only", query: "cols=company%3Apr" },
    {
      name: "everything at once",
      query:
        "q=ma&qf=rating&sort=rating.desc&filter=(rating.gte.4%2Cfeatured.eq.true)%7C(source.eq.g2)&size=25&view=local%3Aabc&peek=k17a4n8c&cols=rating%2Ctitle",
    },
  ];

  it.each(cases)("round-trips $name", ({ query }) => {
    const parsed = parse(query);
    const reSerialized = serializeListViewUrlState({ params: parsed, collection }).toString();
    const reParsed = parse(reSerialized);
    expect(reParsed).toEqual(parsed);
  });
});

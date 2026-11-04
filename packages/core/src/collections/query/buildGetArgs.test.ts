import { describe, expect, it } from "vitest";
import { defineCollection, defineGlobal, text } from "../../index";
import { buildGetArgs, buildGlobalGetArgs } from "./buildGetArgs";

const nonVersionedCollection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: false }) },
});

const versionedCollection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: false }) },
  versions: { drafts: true },
});

describe("buildGetArgs", () => {
  it("omits drafts entirely for a non-versioned collection — never a concrete drafts: false", () => {
    const args = buildGetArgs({ id: "doc1", collection: nonVersionedCollection });
    expect(args).toEqual({ id: "doc1", collection: "posts" });
    expect("drafts" in args).toBe(false);
  });

  it("includes drafts: true for a versioned collection", () => {
    expect(buildGetArgs({ id: "doc1", collection: versionedCollection })).toEqual({
      id: "doc1",
      collection: "posts",
      drafts: true,
    });
  });

  it("works identically for a media collection config (same resolved shape as CollectionConfig)", () => {
    // `MediaCollectionConfig` is a type alias for `CollectionConfig` (packages/core/src/media/types.ts)
    // — no separate resolution path exists, so a plain `defineCollection()` fixture exercises
    // the exact same runtime shape a real `defineMediaCollection()` config has.
    const mediaLikeCollection = defineCollection({
      slug: "images",
      fields: { alt: text({ required: false }) },
    });
    expect(buildGetArgs({ id: "img1", collection: mediaLikeCollection })).toEqual({
      id: "img1",
      collection: "images",
    });
  });

  it("produces byte-identical args for two independent callers given the same id/collection — the parity guarantee this helper exists for", () => {
    // Simulates two call sites (e.g. `AdminTopNavDocCrumb` and `CollectionEditViewData`)
    // independently calling the shared helper for the SAME document — the regression this
    // helper fixes was two callers hand-building `{ id,
    // collection, drafts }` slightly differently for the identical document, producing two
    // different TanStack Query cache keys for what should be one shared entry.
    const callerA = buildGetArgs({ id: "doc1", collection: versionedCollection });
    const callerB = buildGetArgs({ id: "doc1", collection: versionedCollection });
    expect(callerA).toEqual(callerB);
    expect(JSON.stringify(callerA)).toBe(JSON.stringify(callerB));
  });
});

const nonVersionedGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: { siteName: text({ label: "Site Name", required: false }) },
});

const versionedGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: { siteName: text({ label: "Site Name", required: false }) },
  versions: { drafts: true },
});

describe("buildGlobalGetArgs", () => {
  it("omits drafts entirely for a non-versioned global — never a concrete drafts: false", () => {
    const args = buildGlobalGetArgs({ global: nonVersionedGlobal });
    expect(args).toEqual({ slug: "siteSettings" });
    expect("drafts" in args).toBe(false);
  });

  it("includes drafts: true for a versioned global", () => {
    expect(buildGlobalGetArgs({ global: versionedGlobal })).toEqual({
      slug: "siteSettings",
      drafts: true,
    });
  });

  it("produces byte-identical args for two independent callers given the same global — the parity guarantee this helper exists for", () => {
    const callerA = buildGlobalGetArgs({ global: versionedGlobal });
    const callerB = buildGlobalGetArgs({ global: versionedGlobal });
    expect(callerA).toEqual(callerB);
    expect(JSON.stringify(callerA)).toBe(JSON.stringify(callerB));
  });
});

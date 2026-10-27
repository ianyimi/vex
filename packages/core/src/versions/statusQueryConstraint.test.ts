import { describe, expect, it, vi } from "vitest";
import type { VexConfig } from "../config";
import { defineCollection } from "../collections/config";
// import { relationship } from "../fields/relationship/config";
import { text } from "../fields";
import { composeStatusQueryConstraint, requiresPublishedOnly } from "./statusQueryConstraint";

const draftStatusTruePosts = defineCollection({
  slug: "posts",
  fields: { slug: text({ index: { name: "by_slug", draftStatus: true } }) },
  versions: { drafts: true },
});

const draftStatusBothPosts = defineCollection({
  slug: "posts",
  fields: { slug: text({ index: { name: "by_slug", draftStatus: "both" } }) },
  versions: { drafts: true },
});

const plainIndexPosts = defineCollection({
  slug: "posts",
  fields: { slug: text({ index: "by_slug" }) },
  versions: { drafts: true },
});

function configOf(collection: ReturnType<typeof defineCollection>): VexConfig {
  return { collections: [collection] } as unknown as VexConfig;
}

describe("requiresPublishedOnly", () => {
  it("is false when drafts: true is requested", () => {
    expect(
      requiresPublishedOnly({
        config: configOf(plainIndexPosts),
        collection: "posts",
        drafts: true,
      }),
    ).toBe(false);
  });

  it("is true for a versioned collection with no drafts request", () => {
    expect(requiresPublishedOnly({ config: configOf(plainIndexPosts), collection: "posts" })).toBe(
      true,
    );
  });

  it("is false when config is omitted", () => {
    expect(requiresPublishedOnly({ collection: "posts" })).toBe(false);
  });
});

describe("composeStatusQueryConstraint — published-only, draftStatus: true index", () => {
  it("claims the prefixed physical index with a vex_status-leading range and no .filter()", () => {
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusTruePosts),
      collection: "posts",
      resolvedIndex: { name: "by_slug", range: (q: any) => q.eq("slug", "hello") },
      accessFilter: undefined,
    });
    expect(result.resolvedIndex?.name).toBe("by_slug");
    expect(result.accessFilter).toBeUndefined();

    const calls: [string, unknown][] = [];
    const fakeBuilder = {
      eq: (field: string, value: unknown) => {
        calls.push([field, value]);
        return fakeBuilder;
      },
    };
    result.resolvedIndex?.range?.(fakeBuilder as any);
    expect(calls[0]).toEqual(["vex_status", "published"]);
    expect(calls[1]).toEqual(["slug", "hello"]);
  });
});

describe('composeStatusQueryConstraint — published-only, draftStatus: "both" index', () => {
  it("claims the twin physical index, not the unprefixed name", () => {
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusBothPosts),
      collection: "posts",
      resolvedIndex: { name: "by_slug" },
      accessFilter: undefined,
    });
    expect(result.resolvedIndex?.name).toBe("by_slug__draftStatus");
  });
});

describe("composeStatusQueryConstraint — published-only, index with no draftStatus", () => {
  it("falls back to .filter() and warns exactly once across repeated calls", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const call = () =>
      composeStatusQueryConstraint({
        config: configOf(plainIndexPosts),
        collection: "posts",
        resolvedIndex: { name: "by_slug", range: (q: any) => q.eq("slug", "hello") },
        accessFilter: undefined,
      });
    const first = call();
    call();
    expect(first.resolvedIndex?.name).toBe("by_slug");
    expect(first.accessFilter).toBeDefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});

describe('composeStatusQueryConstraint — drafts: true, draftStatus: "both" index', () => {
  it("uses the unprefixed physical index untouched", () => {
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusBothPosts),
      collection: "posts",
      drafts: true,
      resolvedIndex: { name: "by_slug", range: (q: any) => q.eq("slug", "hello") },
      accessFilter: undefined,
    });
    expect(result.resolvedIndex?.name).toBe("by_slug");
    expect(result.resolvedIndex?.range).toBeDefined();
  });
});

describe("composeStatusQueryConstraint — drafts: true, draftStatus: true index", () => {
  it("drops the range and moves the RBAC constraint to .filter(), warning once", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusTruePosts),
      collection: "posts",
      drafts: true,
      resolvedIndex: { name: "by_slug", range: (q: any) => q.eq("slug", "hello") },
      accessFilter: undefined,
    });
    expect(result.resolvedIndex).toEqual({ name: "by_slug", range: undefined });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});

describe("composeStatusQueryConstraint — drafts: true, draftStatus: true index, caller's range", () => {
  /** A FilterBuilder stand-in that renders each expression as a string. */
  const q = {
    field: (name: string) => `field(${name})`,
    eq: (left: unknown, right: unknown) => `eq(${String(left)}, ${JSON.stringify(right)})`,
    and: (...exprs: unknown[]) => `and(${exprs.join(", ")})`,
  };

  it("re-applies the dropped caller range as a filter, ANDed with the RBAC filter", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    // The caller's own index won the slot, so `accessFilter` is already the
    // whole RBAC condition and the dropped range is the caller's `slug` lookup.
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusTruePosts),
      collection: "posts",
      drafts: true,
      resolvedIndex: { name: "by_slug", range: (ix: any) => ix.eq("slug", "hello") },
      accessFilter: (fq: any) => fq.eq(fq.field("authorId"), "u1"),
    });
    warnSpy.mockRestore();

    expect(result.resolvedIndex).toEqual({ name: "by_slug", range: undefined });
    expect(result.accessFilter?.(q as never)).toBe(
      'and(eq(field(authorId), "u1"), eq(field(slug), "hello"))',
    );
  });

  it("re-applies an access-index range that accessFilter omitted (access index won the slot)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    // `find` resolved accessFilter with `indexAlreadyApplied: true`, so it carries
    // only the rule's leftover filter half; the index half lives in the range.
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusTruePosts),
      collection: "posts",
      drafts: true,
      resolvedIndex: { name: "by_slug", range: (ix: any) => ix.eq("slug", "mine") },
      accessFilter: (fq: any) => fq.eq(fq.field("approved"), true),
    });
    warnSpy.mockRestore();

    expect(result.accessFilter?.(q as never)).toBe(
      'and(eq(field(approved), true), eq(field(slug), "mine"))',
    );
  });

  it("re-applies every constraint of a merged access + caller range", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const compound = defineCollection({
      slug: "posts",
      fields: {
        authorId: text({ index: { name: "by_author_slug", additionalFields: ["slug"], draftStatus: true } }),
        slug: text(),
      },
      versions: { drafts: true },
    });
    // Same index name on both sides: `pickConvexQueryIndex` composed access's prefix
    // with the caller's continuation into one range.
    const result = composeStatusQueryConstraint({
      config: configOf(compound),
      collection: "posts",
      drafts: true,
      resolvedIndex: {
        name: "by_author_slug",
        range: (ix: any) => ix.eq("authorId", "u1").eq("slug", "hello"),
      },
      accessFilter: undefined,
    });
    warnSpy.mockRestore();

    expect(result.resolvedIndex).toEqual({ name: "by_author_slug", range: undefined });
    expect(result.accessFilter?.(q as never)).toBe(
      'and(eq(field(authorId), "u1"), eq(field(slug), "hello"))',
    );
  });

  it("adds no filter when the dropped range is ordering-only", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusTruePosts),
      collection: "posts",
      drafts: true,
      resolvedIndex: { name: "by_slug", range: undefined },
      accessFilter: undefined,
    });
    warnSpy.mockRestore();

    expect(result.accessFilter).toBeUndefined();
  });

  it("filters by the dropped range alone when there is no RBAC filter", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = composeStatusQueryConstraint({
      config: configOf(draftStatusTruePosts),
      collection: "posts",
      drafts: true,
      resolvedIndex: { name: "by_slug", range: (ix: any) => ix.eq("slug", "hello") },
      accessFilter: undefined,
    });
    warnSpy.mockRestore();

    expect(result.accessFilter?.(q as never)).toBe('eq(field(slug), "hello")');
  });
});

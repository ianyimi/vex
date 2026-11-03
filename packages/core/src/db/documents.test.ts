import { describe, expect, it } from "vitest";
import { CommitTsPlaceholder } from "convex/values";
import { defineCollection, text } from "../index";
import { commitTs } from "../fields";
import { convertCommitTsFieldsToMs, readableDocuments, resolveCollectionSlug, stampCommitTsFields } from "./documents";

const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true }) },
});
const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }) },
});

describe("resolveCollectionSlug", () => {
  /**
   * A `ctx` whose `normalizeId` claims `id` for exactly one table, mirroring the
   * real syscall: non-null for the owning table, `null` for every other.
   *
   * @param owningTable - The table the id actually belongs to.
   * @returns A partial query ctx carrying only `db.normalizeId`.
   */
  function ctxOwnedBy(owningTable: string) {
    return {
      db: { normalizeId: (table: string, id: string) => (table === owningTable ? id : null) },
    } as never;
  }

  const images = defineCollection({ slug: "images", fields: { alt: text() } });
  // `defineConfig` keeps media collections in their OWN array — a media slug never
  // appears in `collections`, which is exactly what this resolver has to handle.
  const mediaConfig = { collections: [articles, users], mediaCollections: [images] } as never;

  it("resolves an id owned by a regular collection", () => {
    expect(
      resolveCollectionSlug({ ctx: ctxOwnedBy("articles"), config: mediaConfig, id: "a1" as never }),
    ).toBe("articles");
  });

  it("resolves an id owned by a MEDIA collection", () => {
    // Regression: probing only `config.collections` left every media id
    // unresolvable, so `getUrl`/`deleteMedia` threw for any project with
    // `access` configured — public pages lost their images and emitted no
    // `og:image`.
    expect(
      resolveCollectionSlug({ ctx: ctxOwnedBy("images"), config: mediaConfig, id: "i1" as never }),
    ).toBe("images");
  });

  it("throws when no registered collection claims the id", () => {
    expect(() =>
      resolveCollectionSlug({
        ctx: ctxOwnedBy("vex_globals"),
        config: mediaConfig,
        id: "g1" as never,
      }),
    ).toThrow(/does not match a collection slug/);
  });
});

describe("stampCommitTsFields", () => {
  const fakeCtx = { db: { vars: { commitTs: new CommitTsPlaceholder() } } };

  it("stamps a 'save' field on create/update/publish/unpublish, not draftSave", () => {
    const fields = { updatedAt: commitTs({ on: "save" }) };
    for (const event of ["create", "update", "publish", "unpublish"] as const) {
      const result = stampCommitTsFields({ ctx: fakeCtx, fields, data: {} as Record<string, unknown>, events: [event] });
      expect(result.updatedAt).toBeInstanceOf(CommitTsPlaceholder);
    }
    const draftResult = stampCommitTsFields({ ctx: fakeCtx, fields, data: {} as Record<string, unknown>, events: ["draftSave"] });
    expect(draftResult.updatedAt).toBeUndefined();
  });

  it("stamps a 'publish' field only on publish", () => {
    const fields = { publishedCommitTs: commitTs({ on: "publish" }) };
    const published = stampCommitTsFields({ ctx: fakeCtx, fields, data: {} as Record<string, unknown>, events: ["publish"] });
    expect(published.publishedCommitTs).toBeInstanceOf(CommitTsPlaceholder);
    const created = stampCommitTsFields({ ctx: fakeCtx, fields, data: {} as Record<string, unknown>, events: ["create"] });
    expect(created.publishedCommitTs).toBeUndefined();
  });

  it("stamps an 'all' field on every event including draftSave", () => {
    const fields = { touchedAt: commitTs({ on: "all" }) };
    const result = stampCommitTsFields({ ctx: fakeCtx, fields, data: {} as Record<string, unknown>, events: ["draftSave"] });
    expect(result.touchedAt).toBeInstanceOf(CommitTsPlaceholder);
  });


  it("ignores non-commitTs fields entirely", () => {
    const fields = { title: { type: "text" } as never };
    const result = stampCommitTsFields({ ctx: fakeCtx, fields, data: { title: "hi" }, events: ["create"] });
    expect(result).toEqual({ title: "hi" });
  });
});

describe("convertCommitTsFieldsToMs", () => {
  it("converts a resolved bigint ns value to a plain ms number", () => {
    const ns = BigInt(1_700_000_000_123) * BigInt(1_000_000);
    const result = convertCommitTsFieldsToMs({ doc: { updatedAt: ns }, keys: ["updatedAt"] });
    expect(result.updatedAt).toBe(1_700_000_000_123);
  });

  it("leaves a non-bigint value untouched (e.g. not yet stamped, or a pre-migration fixture)", () => {
    const result = convertCommitTsFieldsToMs({
      doc: { updatedAt: "not a bigint", publishedCommitTs: "also not a bigint" },
      keys: ["updatedAt", "publishedCommitTs"],
    });
    expect(result.updatedAt).toBe("not a bigint");
    expect(result.publishedCommitTs).toBe("also not a bigint");
  });

  it("only touches the named keys", () => {
    const ns = BigInt(1_000) * BigInt(1_000_000);
    const result = convertCommitTsFieldsToMs({ doc: { updatedAt: ns, other: ns }, keys: ["updatedAt"] });
    expect(result.updatedAt).toBe(1_000);
    expect(result.other).toBe(ns);
  });
});

describe("readableDocuments — commitTs ms conversion", () => {
  it("converts a resolved-bigint commitTs field to ms for every readable doc, with no access config", () => {
    const ns = BigInt(1_700_000_000_000) * BigInt(1_000_000);
    const result = readableDocuments({
      docs: [{ _id: "1", title: "A", updatedAt: ns }],
      access: undefined,
      auth: undefined,
      resource: "posts",
      action: "read",
      whereFields: [],
      fields: { title: text(), updatedAt: commitTs() },
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.updatedAt).toBe(1_700_000_000_000);
  });

  it("passes docs through unconverted when no field is commitTs-typed", () => {
    const result = readableDocuments({
      docs: [{ _id: "1", title: "A" }],
      access: undefined,
      auth: undefined,
      resource: "posts",
      action: "read",
      whereFields: [],
      fields: { title: text() },
    });
    expect(result).toEqual([{ _id: "1", title: "A" }]);
  });
});

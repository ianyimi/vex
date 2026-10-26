import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../index";
import { resolveCollectionSlug } from "./documents";

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

import { describe, it, expect } from "vitest";
import type { VexConfig } from "../config";
import { buildDepthPopulate } from "./depth";

// ── Minimal VexConfig fixtures ────────────────────────────────────────────────

function makeConfig(
  collections: {
    slug: string;
    fields: Record<string, { type: string; collection?: { slug: string } }>;
  }[],
): VexConfig {
  return {
    collections: collections.map((c) => ({
      slug: c.slug,
      fields: c.fields,
      labels: { singular: c.slug, plural: c.slug },
      admin: { useAsTitle: "_id" },
    })),
  } as unknown as VexConfig;
}

const config = makeConfig([
  {
    slug: "posts",
    fields: {
      title: { type: "text" },
      author: { type: "relationship", collection: { slug: "authors" } },
      category: { type: "relationship", collection: { slug: "categories" } },
    },
  },
  {
    slug: "authors",
    fields: {
      name: { type: "text" },
      team: { type: "relationship", collection: { slug: "teams" } },
    },
  },
  {
    slug: "categories",
    fields: {
      label: { type: "text" },
      // no relationship fields
    },
  },
  {
    slug: "teams",
    fields: {
      name: { type: "text" },
      // no relationship fields
    },
  },
]);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("buildDepthPopulate", () => {
  it("returns {} for depth 0", () => {
    expect(buildDepthPopulate(config, "posts", 0)).toEqual({});
  });

  it("returns {} for an unknown slug", () => {
    expect(buildDepthPopulate(config, "nonexistent", 1)).toEqual({});
  });

  it("depth 1 — all direct relationship fields become true", () => {
    expect(buildDepthPopulate(config, "posts", 1)).toEqual({
      author: true,
      category: true,
    });
  });

  it("depth 1 — ignores non-relationship fields", () => {
    const result = buildDepthPopulate(config, "posts", 1);
    expect(result).not.toHaveProperty("title");
  });

  it("depth 2 — intermediate relationships nest; targets without relationships collapse to true", () => {
    expect(buildDepthPopulate(config, "posts", 2)).toEqual({
      author: { populate: { team: true } },
      category: true, // categories has no relationship fields → collapses
    });
  });

  it("depth 3 — leaf target with no relationships still collapses to true (no empty nested objects)", () => {
    // teams has no relationship fields, so team stays `true` even at depth 3
    expect(buildDepthPopulate(config, "posts", 3)).toEqual({
      author: { populate: { team: true } },
      category: true,
    });
  });

  it("collection with no relationship fields returns {}", () => {
    expect(buildDepthPopulate(config, "categories", 2)).toEqual({});
  });

  it("circular schemas — depth 1 returns true without attempting recursion", () => {
    const circular = makeConfig([
      {
        slug: "a",
        fields: { b: { type: "relationship", collection: { slug: "b" } } },
      },
      {
        slug: "b",
        fields: { a: { type: "relationship", collection: { slug: "a" } } },
      },
    ]);
    expect(buildDepthPopulate(circular, "a", 1)).toEqual({ b: true });
  });

  it("circular schemas — depth 2 cuts the cycle at the back-edge", () => {
    const circular = makeConfig([
      {
        slug: "a",
        fields: { b: { type: "relationship", collection: { slug: "b" } } },
      },
      {
        slug: "b",
        fields: { a: { type: "relationship", collection: { slug: "a" } } },
      },
    ]);
    // a→b is populated; b→a is a circular edge → true (not infinitely nested)
    expect(buildDepthPopulate(circular, "a", 2)).toEqual({
      b: { populate: { a: true } },
    });
  });
});

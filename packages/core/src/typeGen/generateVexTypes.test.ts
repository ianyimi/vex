import { describe, it, expect } from "vitest";
import { generateVexTypes } from "./generateVexTypes";
import { text, number, select } from "../fields";
import { blocks } from "../fields/blocks";
import { defineBlock } from "../blocks/defineBlock";
import { defineCollection } from "../config/defineCollection";
import type { VexConfig } from "../types";

function makeConfig(overrides: Partial<VexConfig>): VexConfig {
  return {
    basePath: "/admin",
    collections: [],
    globals: [],
    admin: { meta: {}, sidebar: {} } as any,
    auth: { collections: [], userCollection: "users" } as any,
    schema: { outputPath: "/convex/vex.schema.ts", typesOutputPath: "/convex/vex.types.ts", autoMigrate: false, autoRemove: false },
    ...overrides,
  };
}

describe("generateVexTypes", () => {
  it("generates interface for a basic collection", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true, label: "Title" }),
            body: text({ label: "Body" }),
            count: number({ label: "Count" }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });

    expect(result).toContain("export interface Posts {");
    expect(result).toContain("_id: Id<'posts'>");
    expect(result).toContain("_creationTime: number");
    expect(result).toContain("/** Title */");
    expect(result).toContain("title: string;");
    expect(result).toContain("/** Body */");
    expect(result).toContain("body?: string;");
    expect(result).toContain("/** Count */");
    expect(result).toContain("count?: number;");
  });

  it("uses interfaceName when provided on collection", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "blog_posts",
          interfaceName: "BlogPost",
          fields: { title: text({ required: true }) },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface BlogPost {");
    expect(result).not.toContain("export interface BlogPosts {");
  });

  it("generates select literal union types", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            status: select({
              options: [
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ],
              required: true,
            }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("status: 'draft' | 'published';");
  });

  it("generates block interfaces separately", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: {
        heading: text({ required: true, label: "Heading" }),
        subheading: text({ label: "Subheading" }),
      },
    });

    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: {
            content: blocks({ blocks: [heroBlock] }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });

    expect(result).toContain("export interface Hero {");
    expect(result).toContain("blockType: 'hero';");
    expect(result).toContain("blockName?: string;");
    expect(result).toContain("_key: string;");
    expect(result).toContain("/** Heading */");
    expect(result).toContain("heading: string;");
    expect(result).toContain("subheading?: string;");
    expect(result).toContain("content?: Hero[];");
  });

  it("uses interfaceName on blocks when provided", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      interfaceName: "HeroBlock",
      fields: {},
    });

    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: {
            content: blocks({ blocks: [heroBlock] }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface HeroBlock {");
    expect(result).toContain("content?: HeroBlock[];");
  });

  it("generates versioning fields when enabled", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
          versions: { drafts: true },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("vex_status?: 'draft' | 'published';");
    expect(result).toContain("vex_version?: number;");
    expect(result).toContain("vex_publishedAt?: number;");
  });

  it("generates global interfaces", () => {
    const config = makeConfig({
      globals: [
        {
          slug: "site_settings",
          label: "Site Settings",
          fields: {
            siteName: text({ required: true, label: "Site Name" }),
            logo: text({ label: "Logo URL" }),
          },
        },
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface SiteSettings {");
    expect(result).toContain("/** Site Name */");
    expect(result).toContain("siteName: string;");
    expect(result).toContain("logo?: string;");
    expect(result).toContain("vexGlobalSlug: 'site_settings';");
  });

  it("generates barrel VexCollectionTypes", () => {
    const config = makeConfig({
      collections: [
        defineCollection({ slug: "posts", fields: {} }),
        defineCollection({ slug: "articles", fields: {} }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface VexCollectionTypes {");
    expect(result).toContain("posts: Posts;");
    expect(result).toContain("articles: Articles;");
  });

  it("deduplicates blocks used in multiple collections", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: { heading: text() },
    });

    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: { content: blocks({ blocks: [heroBlock] }) },
        }),
        defineCollection({
          slug: "posts",
          fields: { layout: blocks({ blocks: [heroBlock] }) },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    const matches = result.match(/export interface Hero \{/g);
    expect(matches).toHaveLength(1);
  });

  it("includes Id import when collections exist", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("import type { Id } from");
  });

  it("skips ui fields", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).not.toContain("type: 'ui'");
    expect(result).not.toContain(": never;");
  });
});

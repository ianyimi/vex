import {
  blocks,
  defineCollection,
  group,
  relationship,
  text,
  upload,
  url,
  VexError,
} from "@vexcms/core";

import { TABLE_SLUG_IMAGES, TABLE_SLUG_PAGES, TABLE_SLUG_THEMES } from "~/db/constants";
import { resolvePagePath } from "~/lib/resolvePagePath";
import { pageBlocks } from "~/vexcms/blocks/config";

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  interfaceName: "Page",
  labels: {
    singular: "Page",
    plural: "Pages",
  },
  admin: {
    useAsTitle: "title",
    icon: "FileText",
    table: {
      defaultColumns: ["title", "slug", "_id"],
      serverPageSize: 100,
    },
    livePreview: {
      url: (doc) => resolvePagePath(doc.slug),
    },
  },
  versions: {
    drafts: true,
  },
  indexes: [
    {
      name: "by_slug_title",
      fields: ["slug", "title"],
    },
  ],
  fields: {
    title: text({
      label: "Title",
      required: true,
      description: "Display title shown as the page heading and in browser tabs (as fallback).",
    }),
    slug: text<typeof TABLE_SLUG_PAGES>({
      description: "URL-friendly page path",
      index: "by_slug",
      label: "Slug",
      required: true,
      validate: async ({ value, doc, vex }) => {
        const [existing] = await vex.find({
          collection: TABLE_SLUG_PAGES,
          withIndex: {
            name: "by_slug",
            range: (q) => q.eq("slug", value),
          },
          limit: 1,
        });
        if (existing && existing._id !== doc._id) {
          throw new VexError({
            code: "SLUG_CONFLICT",
            conflictingPageId: existing._id,
            message: `This slug is already in use by the page '${existing.title}'.`,
          });
        }
      },
    }),

    // ── Legacy content field (kept for existing documents) ──────────────
    content: text({
      label: "Content",
      description: "Page body content. Legacy field — use the blocks field for new pages.",
    }),

    // ── Page builder blocks ────────────────────────────────────────────────
    blocks: blocks({
      admin: {
        defaultCollapsed: true,
      },
      blocks: pageBlocks,
      interfaceName: "PageBlock",
      label: "Content",
      labels: {
        singular: "Block",
        plural: "Blocks",
      },
      min: 1,
    }),

    // ── SEO metadata (sidebar) ─────────────────────────────────────────────
    metaTitle: text({
      label: "Meta Title",
      description: "Custom <title> tag. Falls back to page title if empty.",
      admin: {
        position: "sidebar",
      },
    }),
    metaDescription: text({
      label: "Meta Description",
      description: "Custom meta description for search results.",
      admin: {
        position: "sidebar",
      },
    }),
    ogImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "OG Image",
      admin: { position: "sidebar" },
    }),

    // ── Relationships ──────────────────────────────────────────────────────
    themes: relationship({
      collection: {
        slug: TABLE_SLUG_THEMES,
      },
    }),

    seo: group({
      label: "SEO",
      interfaceName: "SEO",
      description: "seo metadata",
      fields: {
        metaTitle: text({ label: "Meta Title" }),
        metaDescription: text({ label: "Meta Description" }),
        ogImage: url({ label: "OG Image" }),
      },
    }),
  },
});

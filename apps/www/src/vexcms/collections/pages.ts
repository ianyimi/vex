import {
  array,
  blocks,
  defineCollection,
  group,
  number,
  relationship,
  text,
  upload,
  url,
} from "@vexcms/core";

import { TABLE_SLUG_IMAGES, TABLE_SLUG_PAGES, TABLE_SLUG_THEMES } from "~/db/constants";

import { pageBlocks } from "../blocks";

// ============================================================================
// Collection
// ============================================================================

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  interfaceName: "Page",
  labels: {
    singular: "Page",
    plural: "Pages",
  },
  admin: {
    useAsTitle: "title",
    icon: "Notebook",
  },
  fields: {
    title: text({
      required: true,
      description: "Display title shown as the page heading and in browser tabs (as fallback).",
    }),
    slug: text({
      required: true,
      index: "by_slug",
      description: "URL-friendly identifier. Used for routing: /<slug>. Must be unique.",
    }),

    // ── Legacy content field (kept for existing documents) ──────────────
    content: text({
      label: "Content",
      description: "Page body content. Legacy field — use the blocks field for new pages.",
    }),

    // ── Page builder blocks ────────────────────────────────────────────────
    blocks: blocks({
      label: "Page Builder",
      description:
        "Drag-and-drop sections that make up this page. Order determines render order on the site.",
      interfaceName: "PageBlock",
      blocks: pageBlocks,
      labels: { singular: "Section", plural: "Sections" },
      min: 1,
      admin: {
        defaultCollapsed: true,
      },
    }),

    testImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "Test Image",
      hasMany: true,
      accept: "image/*",
    }),

    // ── SEO metadata (sidebar) ─────────────────────────────────────────────
    metaTitle: text({
      label: "Meta Title",
      description: "Custom <title> tag for search engines. Falls back to the title field if empty.",
      admin: {
        position: "sidebar",
      },
    }),
    metaDescription: text({
      label: "Meta Description",
      description:
        "Summary shown in search result snippets. Keep under 160 characters for best display.",
      admin: {
        position: "sidebar",
      },
    }),
    ogImage: url({
      label: "OG Image",
      description: "Image URL for Open Graph social sharing previews. Recommended 1200×630px.",
      admin: {
        position: "sidebar",
      },
    }),

    // ── Relationships ──────────────────────────────────────────────────────
    themes: relationship({
      collection: {
        slug: TABLE_SLUG_THEMES,
      },
    }),

    // ── Test fields ────────────────────────────────────────────────────────
    test: array({
      label: "Test Array",
      items: text({ label: "test array header" }),
      description: "some test description.",
    }),
    test2: array({
      label: "Test Array 2",
      labels: {
        singular: "array",
        plural: "arrays",
      },
      items: array({
        items: number({ label: "nested nested number field" }),
        label: "SubList",
        labels: {
          singular: "SubArray",
          plural: "SubArrays",
        },
      }),
      description: "some test number array description",
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
    anotherTest: group({
      label: "test nested things",
      interfaceName: "AnotherGroupNames",
      fields: {
        title: text(),
        subtitle: text(),
        list: array({
          label: "test list in group field",
          items: group({
            label: "Group",
            interfaceName: "InnerGroup",
            defaultOpen: false,
            fields: {
              title: text({ description: "test field description", label: "Title" }),
              description: text({ label: "description", description: "another test description" }),
              queue: array({
                label: "sub group array list",
                items: group({
                  label: "sub group array sub group",
                  fields: {
                    title: text({ label: "Title" }),
                    description: text({ label: "Description" }),
                  },
                }),
              }),
            },
          }),
        }),
      },
    }),
  },
});

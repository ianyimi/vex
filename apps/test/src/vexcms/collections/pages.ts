import {
  array,
  blocks,
  collapsible,
  defineCollection,
  email,
  group,
  json,
  number,
  relationship,
  row,
  tabs,
  text,
  textarea,
  ui,
  upload,
  url,
  VexError,
} from "@vexcms/core";

import { TABLE_SLUG_IMAGES, TABLE_SLUG_PAGES, TABLE_SLUG_THEMES } from "~/db/constants";
import { resolvePagePath } from "~/lib/resolvePagePath";
import { pageBlocks } from "~/vexcms/blocks/config";
import { WordCountField } from "~/vexcms/admin/WordCountField";
import { PhoneInputWithHint } from "~/vexcms/admin/PhoneInputWithHint";
import { PhoneBeforeInputHint } from "~/vexcms/admin/PhoneBeforeInputHint";

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
    view: {
      serverPageSize: 100,
      sort: { field: "_creationTime", order: "desc" },
      columns: ["title", "slug"],
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
    info: tabs({
      tabs: [
        {
          label: "Content",
          defaultOpen: true,
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
            content: text({
              label: "Content",
              description: "Page body content. Legacy field — use the blocks field for new pages.",
            }),
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
          },
        },
        {
          label: "SEO",
          fields: {
            metaRow: row({
              fields: {
                metaTitle: text({
                  label: "Meta Title",
                  description: "Custom <title> tag. Falls back to page title if empty.",
                  admin: {
                    width: "60%",
                    position: "sidebar",
                  },
                }),
                metaDescription: text({
                  label: "Meta Description",
                  description: "Custom meta description for search results.",
                  admin: {
                    width: "40%",
                    position: "sidebar",
                  },
                }),
              },
            }),
            ogImage: upload({
              to: TABLE_SLUG_IMAGES,
              label: "OG Image",
              admin: { position: "sidebar" },
            }),
          },
        },
        {
          label: "Advanced",
          name: "advanced",
          fields: {
            contactEmail: email({
              label: "Contact Email",
              description: "Dogfood field for the email() leaf type — cell renders a mailto: link.",
            }),
            contactPhone: text({
              label: "Contact Phone",
              description: "Masked text field — this field's admin.mask overrides the project default.",
              admin: {
                mask: "(999) 999-9999",
                components: {
                  Input: [{ id: "acme.pages.phone.wrapInput", component: PhoneInputWithHint }],
                  beforeInput: [
                    { id: "acme.pages.phone.beforeHint", component: PhoneBeforeInputHint, order: 0 },
                  ],
                },
              },
            }),
            notes: textarea({
              label: "Internal Notes",
              rows: 6,
              max: 2000,
              description: "Dogfood field for the textarea() leaf type.",
            }),
            customData: json({
              label: "Custom Data",
              description: "Dogfood field for the json() leaf type — no shape validation.",
            }),
            wordCount: ui({
              admin: {
                components: { Field: WordCountField },
              },
            }),
            legacyFields: collapsible({
              label: "Legacy Test Fields",
              admin: { defaultCollapsed: true },
              fields: {
                test: array({
                  label: "Test Array",
                  items: text({ label: "test array header" }),
                  description: "some test description.",
                }),
                test2: array({
                  label: "Test Array 2",
                  items: array({
                    items: number({ label: "nested nested number field" }),
                    label: "SubList",
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
                        admin: {
                          defaultCollapsed: false,
                        },
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
            }),
          },
        },
      ],
    }),

    testImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "Test Image",
      hasMany: true,
      accept: "image/*",
    }),

    themes: relationship({
      collection: {
        slug: TABLE_SLUG_THEMES,
      },
    }),
  },
});

import {
  array,
  blocks,
  checkbox,
  collapsible,
  color,
  date,
  defineBlock,
  defineCollection,
  email,
  group,
  json,
  number,
  relationship,
  richtext,
  row,
  select,
  tabs,
  text,
  textarea,
  ui,
  upload,
  url,
} from "@vexcms/core";

import { TABLE_SLUG_FIELDS, TABLE_SLUG_IMAGES, TABLE_SLUG_USERS } from "~/db/constants";
import { FieldsWordCountCell, FieldsWordCountField } from "~/vexcms/components/FieldsWordCount";
import { FieldsTitleInputOverride } from "~/vexcms/components/FieldsTitleInput";

/**
 * Nested block used inside `content` below — demonstrates a block whose own
 * fields include an array of groups, proving `blocks` composes with the
 * other container types one level deep. Also demonstrates a `row()` gated
 * by `admin.condition` reading `siblingData` — the condition fires off
 * `showHeading`, this block's OWN other field, not the top-level document.
 */
const statGroupBlock = defineBlock({
  slug: "stat_group",
  label: "Stat Group",
  name: "stat_group",
  fields: {
    showHeading: checkbox({ label: "Show Heading" }),
    headingRow: row({
      fields: { heading: text({ label: "Heading" }) },
      admin: {
        condition: ({ siblingData }) =>
          typeof siblingData === "object" &&
          siblingData !== null &&
          "showHeading" in siblingData &&
          siblingData.showHeading === true,
      },
    }),
    stats: array({
      label: "Stats",
      items: group({
        label: "Stat",
        fields: {
          value: text({ label: "Value" }),
          caption: text({ label: "Caption" }),
        },
      }),
    }),
  },
});

/**
 * Nested block used only as a child inside `containerBlock` — a distinct
 * slug/interfaceName from `statGroupBlock` so the generated TypeScript
 * interfaces don't collide. Its `stats` array nests inside a `collapsible()`
 * — proves a UI field works inside a block that is itself nested inside
 * another block's own `blocks()` field.
 */
const nestedStatGroupBlock = defineBlock({
  slug: "nested_stat_group",
  label: "Nested Stat Group",
  name: "nested_stat_group",
  fields: {
    heading: text({ label: "Heading" }),
    statsSection: collapsible({
      label: "Stats",
      admin: { defaultCollapsed: true },
      fields: {
        stats: array({
          label: "Stats",
          items: group({
            label: "Stat",
            fields: {
              value: text({ label: "Value" }),
              caption: text({ label: "Caption" }),
            },
          }),
        }),
      },
    }),
  },
});

/**
 * Nested block used inside `content` below — demonstrates a block that
 * itself contains another `blocks` field, proving blocks can nest inside
 * blocks. Also demonstrates a `tabs()` field with a named tab nested
 * directly inside a block's own `fields`.
 */
const containerBlock = defineBlock({
  slug: "container",
  label: "Container",
  name: "container",
  fields: {
    label: text({ label: "Label" }),
    info: tabs({
      tabs: [
        { label: "Content", fields: { note: text({ label: "Note" }) } },
        { label: "Meta", name: "meta", fields: { tag: text({ label: "Tag" }) } },
      ],
    }),
    children: blocks({
      label: "Children",
      blocks: [nestedStatGroupBlock],
      labels: { singular: "Child Block", plural: "Child Blocks" },
    }),
  },
});

/**
 * Block used inside `content` below — demonstrates a block with a plain
 * `collapsible()` field (no nesting beyond the one level).
 */
const calloutBlock = defineBlock({
  slug: "callout",
  label: "Callout",
  name: "callout",
  fields: {
    body: textarea({ label: "Body" }),
    options: collapsible({
      label: "Options",
      admin: { defaultCollapsed: true },
      fields: { emphasis: checkbox({ label: "Emphasis" }) },
    }),
  },
});

/**
 * `fields` is the testing ground for every field type `@vexcms/core` ships.
 * Each entry demonstrates one option or combination; nothing here is
 * rendered on the public site. See `FieldsCollection` session for the
 * inventory of fields moved into this collection from `pages`/`users`.
 */
export const fields = defineCollection({
  slug: TABLE_SLUG_FIELDS,
  interfaceName: "FieldsExample",
  labels: {
    singular: "Field Example",
    plural: "Fields",
  },
  admin: {
    useAsTitle: "contactEmail",
    icon: "FlaskConical",
    livePreview: {
      url: "/",
    },
  },
  fields: {
    // ── email() — custom-named search index, reused by relationship pickers
    // targeting this collection instead of an auto-generated `search_contactEmail`.
    contactEmail: email({
      label: "Contact Email",
      required: true,
      description: "Demonstrates email() with a custom searchIndex name.",
      searchIndex: { name: "search_fields_contactEmail", filterFields: [] },
    }),

    // ── textarea() — multi-line text with rows + a tuple max with a custom message.
    bio: textarea({
      label: "Bio",
      rows: 6,
      max: [280, "Keep it under 280 characters."],
      description: "Demonstrates textarea() with rows and a tuple max.",
    }),

    // ── json() — arbitrary JSON-serializable value, no fixed shape.
    settings: json({
      label: "Settings",
      description: "Demonstrates json() — an arbitrary settings blob.",
    }),

    // ── text() — min length plus a tuple max with a custom message. Also
    // demonstrates admin.components.Input overriding the control in place.
    title: text({
      label: "Title",
      min: 3,
      max: [60, "Titles max out at 60 characters."],
      description: "Demonstrates text() with min and a tuple max.",
      admin: {
        components: {
          Input: [{ id: "apps-test.title-input-override", component: FieldsTitleInputOverride }],
        },
      },
    }),

    // ── number() — tuple min and max, each with a custom message.
    rating: number({
      label: "Rating",
      min: [0, "Rating cannot be negative."],
      max: [5, "Rating cannot exceed 5."],
      description: "Demonstrates number() with tuple min/max.",
    }),

    // ── checkbox() — boolean toggle.
    isFeatured: checkbox({
      label: "Featured",
      description: "Demonstrates checkbox().",
    }),

    // ── select() — single choice.
    status: select({
      label: "Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      description: "Demonstrates select() restricted to a single value.",
    }),

    // ── select() — hasMany choice.
    tags: select({
      label: "Tags",
      hasMany: true,
      options: [
        { label: "News", value: "news" },
        { label: "Tutorial", value: "tutorial" },
        { label: "Release", value: "release" },
      ],
      description: "Demonstrates select() with hasMany: true.",
    }),

    // ── color() — swatch picker.
    accentColor: color({
      label: "Accent Color",
      format: "oklch",
      description: "Demonstrates color() pinned to the oklch format.",
    }),

    // ── url() — single-line URL string.
    website: url({
      label: "Website",
      description: "Demonstrates url().",
    }),

    // ── date() — date-only, time picker hidden.
    dueOn: date({
      label: "Due On",
      time: { hidden: true },
      description: "Demonstrates date() with the time picker hidden.",
    }),

    // ── date() — date + time, including a seconds picker.
    eventAt: date({
      label: "Event At",
      time: { timePicker: { hour: true, minute: true, second: true } },
      description: "Demonstrates date() with a seconds-precision time picker.",
    }),

    // ── relationship() — single target.
    relatedUser: relationship({
      label: "Related User",
      collection: { slug: TABLE_SLUG_USERS },
      description: "Demonstrates relationship() restricted to a single document.",
    }),

    // ── relationship() — hasMany.
    relatedUsers: relationship({
      label: "Related Users",
      collection: { slug: TABLE_SLUG_USERS },
      hasMany: true,
      description: "Demonstrates relationship() with hasMany: true.",
    }),

    // ── upload() — single file.
    avatar: upload({
      label: "Avatar",
      to: TABLE_SLUG_IMAGES,
      accept: "image/*",
      description: "Demonstrates upload() restricted to a single file.",
    }),

    // ── upload() — hasMany with an accept filter.
    gallery: upload({
      label: "Gallery",
      to: TABLE_SLUG_IMAGES,
      hasMany: true,
      accept: "image/*",
      description: "Demonstrates upload() with hasMany: true and an accept filter.",
    }),

    // ── richtext() — rich text document (requires the `editor` adapter on vex.config).
    body: richtext({
      label: "Body",
      description: "Demonstrates richtext().",
    }),

    // ── array() — simple list of text items.
    tagList: array({
      label: "Tag List",
      items: text({ label: "Tag" }),
      description: "Demonstrates array() of a simple text field.",
    }),

    // ── array() of group() — each item is a named set of sub-fields.
    gridItems: array({
      label: "Grid Items",
      items: group({
        label: "Grid Item",
        fields: {
          heading: text({ label: "Heading" }),
          subheading: text({ label: "Subheading" }),
        },
      }),
      description: "Demonstrates array() of group() — array of groups.",
    }),

    // ── group() containing array() — a nested list inside a group.
    info: group({
      label: "Info",
      interfaceName: "FieldsExampleInfo",
      description: "Demonstrates group() containing an array() — group holding a list.",
      fields: {
        heading: text({ label: "Heading" }),
        bullets: array({
          label: "Bullets",
          items: text({ label: "Bullet" }),
        }),
      },
    }),

    // ── blocks() — page-builder union, including a block that itself nests
    // another blocks() field (`container`), a block with a tabs() field
    // (incl. a named tab), a block with a collapsible() nested inside a
    // nested block, a block with a siblingData-conditioned row(), and a
    // block with a plain collapsible().
    content: blocks({
      label: "Content",
      blocks: [statGroupBlock, containerBlock, calloutBlock],
      labels: { singular: "Section", plural: "Sections" },
      interfaceName: "FieldsExampleBlock",
      description: "Demonstrates blocks() with nested blocks/array/group/tabs/row/collapsible.",
    }),

    // ── checkbox() — sibling condition driver for the tabs()/row()
    // admin.condition examples below (layoutTabs' "Visibility" tab,
    // conditionalRow).
    showAdvanced: checkbox({
      label: "Show Advanced Options",
      description:
        "Toggles the Visibility tab inside layoutTabs and conditionalRow below — demonstrates a tabs()/row() admin.condition reading a top-level sibling.",
    }),

    // ── tabs() — first top-level tabs() field. An unnamed tab (General)
    // hoists its field; a named tab (seo) nests as one group-shaped data
    // field; Advanced sets defaultOpen: true while NOT being the first tab;
    // Visibility is gated by admin.condition on the showAdvanced sibling;
    // Composed nests a row() and a collapsible(); Nested nests another
    // tabs() field, which keeps local (non-URL) state since it isn't
    // rendered at the top level.
    layoutTabs: tabs<typeof TABLE_SLUG_FIELDS>({
      label: "Layout",
      tabs: [
        {
          label: "General",
          fields: { displayName: text({ label: "Display Name" }) },
        },
        {
          label: "SEO",
          name: "seo",
          description: "A named tab — stores metaTitle/metaDescription under one `seo` object.",
          fields: {
            metaTitle: text({ label: "Meta Title", required: true }),
            metaDescription: textarea({ label: "Meta Description", required: true, rows: 3 }),
          },
        },
        {
          label: "Advanced",
          defaultOpen: true,
          description: "defaultOpen: true while NOT being the first tab.",
          fields: { advancedNote: text({ label: "Advanced Note" }) },
        },
        {
          label: "Visibility",
          description: "Gated by admin.condition reading the showAdvanced sibling.",
          admin: {
            condition: ({ data }) => data.showAdvanced === true,
          },
          fields: { visibilityNote: text({ label: "Visibility Note" }) },
        },
        {
          label: "Composed",
          description: "Nests a row() and a collapsible() — proves nesting inside a tab.",
          fields: {
            columns: row({
              fields: {
                colLeft: text({ label: "Col Left", admin: { width: "50%" } }),
                colRight: text({ label: "Col Right", admin: { width: "50%" } }),
              },
            }),
            aside: collapsible({
              label: "Aside",
              fields: { asideNote: text({ label: "Aside Note" }) },
            }),
          },
        },
        {
          label: "Nested",
          description:
            "Nests another tabs() field — local state, no URL param, since it isn't top-level.",
          fields: {
            innerTabs: tabs({
              tabs: [
                { label: "Inner A", fields: { innerFirst: text({ label: "Inner First" }) } },
                { label: "Inner B", fields: { innerSecond: text({ label: "Inner Second" }) } },
              ],
            }),
          },
        },
      ],
    }),

    // ── tabs() — second top-level tabs() field, proving its own
    // independent `?metaTabs=` URL param (distinct from `?layoutTabs=`).
    metaTabs: tabs({
      label: "Meta",
      tabs: [
        { label: "Primary", fields: { altTitle: text({ label: "Alt Title" }) } },
        { label: "Secondary", fields: { altSummary: text({ label: "Alt Summary" }) } },
      ],
    }),

    // ── collapsible() — top-level, defaultCollapsed: true, admin.readOnly:
    // true propagates to its own field (archiveId renders disabled).
    readOnlySection: collapsible({
      label: "Read-Only Section",
      admin: { defaultCollapsed: true, readOnly: true },
      fields: { archiveId: text({ label: "Archive Id" }) },
      description: "Demonstrates admin.readOnly on a container propagating to its own field.",
    }),

    // ── row() — top-level, admin.hidden: true propagates to its own field
    // (legacyFlag never renders and is excluded from the list view).
    hiddenSection: row({
      fields: { legacyFlag: checkbox({ label: "Legacy Flag" }) },
      admin: { hidden: true },
      description: "Demonstrates admin.hidden on a container propagating to its own field.",
    }),

    // ── row() — children's % widths sum to 100, so each keeps its own width.
    evenRow: row({
      fields: {
        priceLabel: text({ label: "Price Label", admin: { width: "40%" } }),
        priceValue: text({ label: "Price Value", admin: { width: "60%" } }),
      },
      description: "Demonstrates row() with % widths summing to 100.",
    }),

    // ── row() — children's % widths do NOT sum to 100 (30 + 30), so both
    // fall back to an equal 50/50 share.
    fallbackRow: row({
      fields: {
        fallbackA: text({ label: "Fallback A", admin: { width: "30%" } }),
        fallbackB: text({ label: "Fallback B", admin: { width: "30%" } }),
      },
      description:
        "Demonstrates row() falling back to an equal share when widths don't sum to 100.",
    }),

    // ── row() — gated by admin.condition on the showAdvanced sibling.
    conditionalRow: row({
      fields: { conditionalNote: text({ label: "Conditional Note" }) },
      admin: {
        condition: ({ data }) =>
          typeof data === "object" &&
          data !== null &&
          "showAdvanced" in data &&
          data.showAdvanced === true,
      },
      description: "Demonstrates row() with admin.condition reading the showAdvanced sibling.",
    }),

    // ── ui() — custom Field + Cell, no stored value. Field renders in the
    // sidebar; Cell shows a "Nw" word-count column in the list view.
    wordCount: ui<typeof TABLE_SLUG_FIELDS>({
      label: "Word Count",
      admin: {
        position: "sidebar",
        components: { Field: FieldsWordCountField, Cell: FieldsWordCountCell },
      },
      description: "Demonstrates ui() with a custom Field (sidebar) and Cell (list view column).",
    }),

    // ── group() containing tabs() and row() — UI fields nested inside a
    // group's own fields, a separate flattening scope from the collection's
    // top level (no collision with layoutTabs'/evenRow's own hoisted keys).
    displaySettings: group({
      label: "Display Settings",
      interfaceName: "FieldsExampleDisplaySettings",
      description: "Demonstrates tabs() and row() nested inside a group().",
      fields: {
        layout: tabs({
          tabs: [
            { label: "Grid", fields: { columns: number({ label: "Columns" }) } },
            { label: "List", name: "list", fields: { spacing: number({ label: "Spacing" }) } },
          ],
        }),
        sizing: row({
          fields: {
            width: number({ label: "Width", admin: { width: "50%" }, step: 10 }),
            height: number({ label: "Height", admin: { width: "50%" }, step: 10 }),
          },
        }),
      },
    }),

    // ── array() of group() whose group nests a row() and a
    // siblingData-conditioned collapsible() — each item's own showDetails
    // checkbox toggles that SAME item's details collapsible via siblingData.
    sections: array({
      label: "Sections",
      items: group({
        label: "Section",
        fields: {
          showDetails: checkbox({ label: "Show Details" }),
          summary: text({ label: "Summary" }),
          layout: row({
            fields: {
              itemLeft: text({ label: "Left", admin: { width: "50%" } }),
              itemRight: text({ label: "Right", admin: { width: "50%" } }),
            },
          }),
          details: collapsible({
            label: "Details",
            admin: {
              condition: ({ siblingData }) =>
                typeof siblingData === "object" &&
                siblingData !== null &&
                "showDetails" in siblingData &&
                siblingData.showDetails === true,
            },
            fields: { body: textarea({ label: "Body" }) },
          }),
        },
      }),
      description:
        "Demonstrates array() of group() nesting a row() and a siblingData-conditioned collapsible().",
    }),
  },
});

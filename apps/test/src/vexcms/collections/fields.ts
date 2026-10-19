import {
  array,
  blocks,
  checkbox,
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
  select,
  text,
  textarea,
  upload,
  url,
} from "@vexcms/core"

import { TABLE_SLUG_FIELDS, TABLE_SLUG_IMAGES, TABLE_SLUG_USERS } from "~/db/constants"

/**
 * Nested block used inside `content` below — demonstrates a block whose own
 * fields include an array of groups, proving `blocks` composes with the
 * other container types one level deep.
 */
const statGroupBlock = defineBlock({
  slug: "stat_group",
  label: "Stat Group",
  name: "stat_group",
  fields: {
    heading: text({ label: "Heading" }),
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
})

/**
 * Nested block used only as a child inside `containerBlock` — a distinct
 * slug/interfaceName from `statGroupBlock` so the generated TypeScript
 * interfaces don't collide.
 */
const nestedStatGroupBlock = defineBlock({
  slug: "nested_stat_group",
  label: "Nested Stat Group",
  name: "nested_stat_group",
  fields: {
    heading: text({ label: "Heading" }),
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
})

/**
 * Nested block used inside `content` below — demonstrates a block that
 * itself contains another `blocks` field, proving blocks can nest inside
 * blocks.
 */
const containerBlock = defineBlock({
  slug: "container",
  label: "Container",
  name: "container",
  fields: {
    label: text({ label: "Label" }),
    children: blocks({
      label: "Children",
      blocks: [nestedStatGroupBlock],
      labels: { singular: "Child Block", plural: "Child Blocks" },
    }),
  },
})

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

    // ── text() — min length plus a tuple max with a custom message.
    title: text({
      label: "Title",
      min: 3,
      max: [60, "Titles max out at 60 characters."],
      description: "Demonstrates text() with min and a tuple max.",
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
    // another blocks() field (`container`) and a block with an array of
    // groups (`stat_group`).
    content: blocks({
      label: "Content",
      blocks: [statGroupBlock, containerBlock],
      labels: { singular: "Section", plural: "Sections" },
      interfaceName: "FieldsExampleBlock",
      description: "Demonstrates blocks() with nested blocks/array/group.",
    }),
  },
})

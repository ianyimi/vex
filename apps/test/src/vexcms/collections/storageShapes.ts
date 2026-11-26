import {
  bytes,
  defineCollection,
  group,
  keyValue,
  number,
  relationship,
  select,
  text,
  upload,
  variant,
} from "@vexcms/core";

import { TABLE_SLUG_IMAGES, TABLE_SLUG_STORAGE_SHAPES, TABLE_SLUG_USERS } from "~/db/constants";

/**
 * Dogfood collection for the Convex storage shapes: nullable fields, the
 * `schema.validator` overrides on number/select/relationship/upload, and the
 * `bytes()`, `keyValue()` and `variant()` fields, one field per shape.
 */
export const storageShapes = defineCollection({
  slug: TABLE_SLUG_STORAGE_SHAPES,
  labels: {
    singular: "Storage Shape",
    plural: "Storage Shapes",
  },
  admin: {
    useAsTitle: "name",
    icon: "Database",
  },
  versions: {
    drafts: true,
  },
  fields: {
    // ── nullable ────────────────────────────────────────────────
    name: text({ label: "Name", required: true }),
    nullableNote: text({ label: "Nullable Note", nullable: true }),
    nullableCount: number({ label: "Nullable Count", nullable: true }),
    nullableStatus: select({
      label: "Nullable Status",
      nullable: true,
      hasMany: false,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    }),
    nullableMeta: group({
      label: "Nullable Meta",
      nullable: true,
      fields: {
        note: text({ label: "Note" }),
      },
    }),
    // ── number int64 ───────────────────────────────────────────
    viewCount: number({
      label: "View Count",
      schema: { validator: "int64" },
      index: "by_viewCount",
      admin: {
        enableSorting: true,
      },
      min: BigInt(0),
    }),
    // ── select literal/string scalar ───────────────────────────
    literalStatus: select({
      label: "Literal Status",
      hasMany: false,
      schema: { validator: "literal" },
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    }),
    stringStatus: select({
      label: "String Status",
      hasMany: false,
      schema: { validator: "string" },
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    }),
    // ── relationship/upload schema validator ───────────────────
    ownerId: relationship({
      label: "Owner (id)",
      collection: { slug: TABLE_SLUG_USERS },
      schema: { validator: "id" },
    }),
    ownerRef: relationship({
      label: "Owner (string ref)",
      collection: { slug: TABLE_SLUG_USERS },
      schema: { validator: "string" },
    }),
    cover: upload({
      label: "Cover image",
      to: TABLE_SLUG_IMAGES,
      schema: { validator: "id" },
    }),
    // ── bytes ───────────────────────────────────────────────────
    payload: bytes({ label: "Payload" }),
    scores: keyValue({
      label: "Scores",
      value: number({ label: "Score", required: true }),
    }),
    userScores: keyValue({
      label: "User Scores",
      keys: { collection: { slug: TABLE_SLUG_USERS } },
      value: number({ label: "Score", required: true }),
    }),
    // ── variant ─────────────────────────────────────────────────
    channel: variant({
      label: "Channel",
      discriminator: "kind",
      variants: {
        email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
        sms: {
          label: "SMS",
          fields: { phoneNumber: text({ label: "Phone number", required: true }) },
        },
      },
    }),
    amount: variant({
      label: "Amount",
      variants: {
        fixed: text({ label: "Fixed amount", required: true }),
        metered: number({ label: "Metered amount", required: true }),
      },
    }),
  },
});

import {
  array,
  checkbox,
  color,
  date,
  defineCollection,
  email,
  group,
  json,
  number,
  select,
  text,
  textarea,
  upload,
  url,
} from "@vexcms/core"

import { PRODUCT_STATUSES, TABLE_SLUG_IMAGES, TABLE_SLUG_PRODUCTS } from "~/db/constants"

/**
 * Demo catalog collection — exercises the field types the other demo collections
 * don't (`date`, `color`, `url`, `email`, `json`, `group`, `array`,
 * `upload`), plus two column-preset views with different pins. Every field is
 * readable by the demo role: the contrast case to `leads`' hidden fields.
 */
export const products = defineCollection({
  slug: TABLE_SLUG_PRODUCTS,
  interfaceName: "Product",
  labels: {
    singular: "Product",
    plural: "Products",
  },
  admin: {
    useAsTitle: "name",
    icon: "Package",
    view: {
      sort: { field: "updatedAt", order: "desc" },
      searchFields: ["name"],
      columns: [
        { field: "name", pinned: "left", width: 220 },
        { field: "tagline", width: 240 },
        { field: "status", width: 120 },
        { field: "price", width: 100 },
        { field: "launchedOn", width: 140 },
        { field: "updatedAt", width: 170 },
        { field: "website", hidden: true },
        { field: "brandColor", hidden: true },
        { field: "supportEmail", hidden: true },
      ],
      bulkActions: { delete: true },
    },
    views: [
      {
        viewId: "catalog",
        name: "Catalog",
        description: "Everything that is not archived, launch date first.",
        state: {
          where: { field: "archived", op: "eq", value: false },
          columns: [
            { field: "name", pinned: "left", width: 220 },
            { field: "tagline", width: 260 },
            { field: "launchedOn", width: 140 },
            { field: "status", width: 120 },
            { field: "website", width: 200 },
          ],
        },
      },
      {
        viewId: "pricing",
        name: "Pricing",
        description: "Price pinned right for quick scanning.",
        state: {
          where: { field: "archived", op: "eq", value: false },
          columns: [
            { field: "name", pinned: "left", width: 220 },
            { field: "status", width: 120 },
            { field: "supportEmail", width: 200 },
            { field: "price", pinned: "right", width: 100 },
          ],
        },
      },
    ],
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
      searchIndex: { name: "search_products_name", filterFields: [] },
      description: "Product name.",
    }),
    tagline: text({
      label: "Tagline",
      description: "One-line pitch shown in list views.",
    }),
    description: textarea({
      label: "Description",
      description: "Long-form product description.",
    }),
    status: select({
      label: "Status",
      required: true,
      index: "by_status",
      admin: { enableSorting: true },
      options: [
        { label: "Draft", value: PRODUCT_STATUSES.draft },
        { label: "Active", value: PRODUCT_STATUSES.active },
        { label: "Archived", value: PRODUCT_STATUSES.archived },
      ],
      description: "Catalog lifecycle state.",
    }),
    archived: checkbox({
      label: "Archived",
      description: "Hidden from the Catalog and Pricing views.",
    }),
    price: number({
      label: "Price",
      min: [0, "Price cannot be negative."],
      description: "Monthly price in USD.",
    }),
    launchedOn: date({
      label: "Launched On",
      time: { hidden: true },
      description: "Public launch date.",
    }),
    website: url({
      label: "Website",
      description: "Public product page.",
    }),
    supportEmail: email({
      label: "Support Email",
      description: "Where customers reach this product's team.",
    }),
    brandColor: color({
      label: "Brand Color",
      format: "oklch",
      description: "Accent color used in marketing material.",
    }),
    heroImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "Hero Image",
      admin: { position: "sidebar" },
    }),
    highlights: array({
      label: "Highlights",
      items: group({
        label: "Highlight",
        fields: {
          title: text({ label: "Title", required: true }),
          detail: text({ label: "Detail" }),
        },
      }),
    }),
    specs: group({
      label: "Specs",
      fields: {
        sku: text({ label: "SKU" }),
        weightGrams: number({ label: "Weight (g)" }),
      },
    }),
    metadata: json({
      label: "Metadata",
      description: "Arbitrary integration metadata blob.",
    }),
  },
})

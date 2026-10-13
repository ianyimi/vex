import { array, defineBlock, group, select, text, upload } from "@vexcms/core"

import { TABLE_SLUG_IMAGES } from "~/db/constants"

import { BLOCK_SLUG_SPLIT } from "../constants"

export const splitBlock = defineBlock({
  slug: BLOCK_SLUG_SPLIT,
  label: "Split",
  fields: {
    eyebrow: text({ label: "Eyebrow" }),
    heading: text({ label: "Heading", required: true }),
    body: text({ label: "Body", required: true }),
    bullets: array({
      label: "Bullets",
      items: group({
        label: "Bullet",
        fields: {
          icon: text({ label: "Icon", description: "Lucide icon name" }),
          text: text({ label: "Text", required: true }),
        },
      }),
    }),
    media: select({
      label: "Media",
      description:
        'Code is the variant the seed uses. Image falls back to None when no image is set, so a scaffold with an empty media library never shows a broken frame.',
      options: [
        { label: "Code", value: "code" },
        { label: "Image", value: "image" },
        { label: "None", value: "none" },
      ],
      defaultValue: ["code"],
    }),
    code: text({ label: "Code" }),
    codeFilename: text({ label: "Code Filename" }),
    codeLanguage: select({
      label: "Code Language",
      options: [
        { label: "TypeScript", value: "ts" },
        { label: "TSX", value: "tsx" },
        { label: "Shell", value: "bash" },
        { label: "JSON", value: "json" },
      ],
      defaultValue: ["ts"],
    }),
    image: upload({ label: "Image", to: TABLE_SLUG_IMAGES }),
    mediaPosition: select({
      label: "Media Position",
      description:
        "Consecutive Splits alternate by this field, not by an nth-child rule, so an editor can break the alternation.",
      options: [
        { label: "Right", value: "right" },
        { label: "Left", value: "left" },
      ],
      defaultValue: ["right"],
    }),
  },
  admin: {
    icon: "Layers",
  },
})

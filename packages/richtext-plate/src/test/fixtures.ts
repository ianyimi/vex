import type { RichTextDocument } from "@vexcms/core";

/**
 * A `posts.body` document exactly as `PlateEditorField` saved it under Plate 52.3
 * (apps/test, 2026-11-03), so the stored-value compatibility tests run against
 * real persisted content, not a hand-written guess at it. Only the image `url`
 * is swapped for a placeholder host.
 *
 * It covers the one node shape Plate 53 changed: `blockquote` is stored FLAT
 * (text children). 53 stores a blockquote as a container of blocks.
 */
export const PLATE_52_DOCUMENT: RichTextDocument = [
  { children: [{ text: "Upgrade heading" }], id: "3b2WLltDJL", type: "h2" },
  {
    children: [
      { text: "Plain then " },
      { bold: true, text: "bold" },
      { text: " and " },
      { italic: true, text: "italic" },
      { text: " text." },
    ],
    id: "q-hyvXAonp",
    type: "p",
  },
  {
    children: [{ text: "First bullet" }],
    id: "aozMWcP1Jj",
    indent: 1,
    listStyleType: "disc",
    type: "p",
  },
  {
    children: [{ text: "Second bullet" }],
    id: "d5ag7iOKoR",
    indent: 1,
    listStart: 2,
    listStyleType: "disc",
    type: "p",
  },
  { children: [{ text: "A quoted line" }], id: "7oLF0IXuDM", type: "blockquote" },
  {
    children: [
      { text: "See the " },
      {
        children: [{ text: "docs site" }],
        id: "tHs2cWshQ-",
        type: "a",
        url: "https://docs.vexcms.dev",
      },
      { text: "" },
    ],
    id: "6ggJeyRg65",
    type: "p",
  },
  {
    alt: "ChatGPT Image Aug 31, 2025, 11_13_14 PM.png",
    children: [{ text: "" }],
    id: "EH-kJCj-ad",
    mediaId: "m5787q1necwpek4jzz59pjr9js89kast",
    type: "img",
    url: "https://example.convex.cloud/api/storage/71ade08e-225b-46c2-bd81-dee8dc29e021",
  },
  { children: [{ text: "" }], id: "f0RrG0MBwV", type: "p" },
];

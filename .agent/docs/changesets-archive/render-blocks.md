---
"@vexcms/react": minor
---

Add `RenderBlocks` — a generic, typed dispatcher for `blocks()` field content: a `components`
map keyed by `blockType`, each entry narrowed via `Extract<TBlock, { blockType: K }>`, an
optional `fallback` for unrecognized block types, and `block.id` as the React key. Exported
alongside `RenderBlocksProps`, `BlockComponents`, and `BlockComponentProps`. Replaces the
hand-rolled block-type switch every consumer previously wrote — proven against `apps/test`'s
`PageContent` — and is what both `create-vexcms` templates use to render page, header, and
footer content.

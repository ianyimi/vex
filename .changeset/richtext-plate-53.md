---
"@vexcms/richtext-plate": patch
"@vexcms/react": patch
---

Rich text editor upgraded to Plate 53, with fixes:

- **Plate 53.** `platejs` and every `@platejs/*` dependency moved to 53.x (`platejs` 53.5.2).
- **Blockquotes.** Plate 53 stores a blockquote as a container of paragraphs. The toolbar's quote button now wraps and unwraps blocks, so a quote can be toggled off again. Quotes saved before the upgrade are converted to the new shape when the editor opens, so toggling one off no longer deletes its text. Opening a document does not mark it as edited.
- **Rendered lists.** `RichText` renders bulleted and numbered lists again. Plate 53 had moved the list wrapper out of the plugin it uses.
- **Valid markup.** `RichText` no longer puts lists or links inside a `<p>`, which fixes React hydration errors on rendered pages and in the list-view peek panel. Links now stay inline in their paragraph instead of breaking onto their own line.
- **Sticky toolbar.** The editor toolbar now pins flush to the top of the admin form while you scroll. It reads the new `--vex-form-sticky-top` CSS variable, which the admin's form scroll area sets to cancel its own top padding.
- **Read-only blocks.** "Collapse all" and "Expand all" stay usable on a read-only blocks field, matching array fields. They only change which blocks are open, never the value.

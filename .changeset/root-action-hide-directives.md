---
"@vexcms/core": patch
---

A root-level `{ id, hidden: true }` entry in `admin.components.blocks.itemActions`, `blocks.headerActions` or `array.itemActions` now hides that built-in action. `defineConfig()` used to resolve these lists early, which dropped hide-only entries, so hiding a built-in block or array action had no effect.

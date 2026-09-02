---
"create-vexcms": minor
---

Ship real `base-nextjs` and `marketing-site` templates, previously README stubs: auth, admin
panel, media, users, and the first-admin bootstrap flow in `base-nextjs`; pages, headers,
footers, themes, `siteSettings`, 8 marketing blocks, theme wiring, and seed data in the
`marketing-site` overlay. Add `--monorepo` (catalog-aware, targets `apps/<name>` under the
nearest `pnpm-workspace.yaml`) and `--yes` (accepts every prompt's default) flags.

---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"@vexcms/cli": patch
"@vexcms/better-auth": patch
"@vexcms/file-storage-convex": patch
"@vexcms/richtext-plate": patch
"create-vexcms": patch
---

Publish under Apache-2.0 with full package metadata.

Every published manifest now carries `license: "Apache-2.0"` (root `LICENSE` +
`NOTICE` added), `description`, `keywords`, `author`, `homepage`, and
`repository` with per-package `directory`. `sideEffects: false` is declared
where verified side-effect-free; `@vexcms/next` declares `["*.css"]` because it
exports `./styles`. Packages publish to the `alpha` dist-tag
(`publishConfig.tag`), leaving `latest` untouched until promotion.

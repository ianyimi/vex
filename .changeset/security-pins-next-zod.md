---
"@vexcms/core": patch
"@vexcms/react": patch
"create-vexcms": patch
---

Security: `zod` 4.4.3 → 4.6.7 (GHSA-mrhx-c7xc-m3w5, memory exhaustion validating oversized
constrained collections, fixed in 4.6.6). New projects scaffold with `next` 16.4.5 instead of
16.3.3, which carried critical remote-code-execution advisories in the image optimizer,
`use cache` functions and `next/og`.

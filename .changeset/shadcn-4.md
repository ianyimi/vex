---
"create-vexcms": patch
---

New projects pin `shadcn` 4.23.0 (was 3.6.3). It is a devDependency read only by
`globals.css` (`@import "shadcn/tailwind.css"`); 4.x keeps that stylesheet's existing rules
and depends on `zod` 4 instead of the vulnerable `zod` 3.25.76.

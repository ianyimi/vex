---
"@vexcms/core": patch
"create-vexcms": patch
---

`convex/schema.ts` imports the `user` table from the generated
`convex/vex.schema.ts` instead of redeclaring it by hand, in `apps/www`,
`apps/test` and both `create-vexcms` templates (`base-nextjs`,
`marketing-site`). A field added to the `users`/`user` collection now reaches
`Doc<"user">` and the deployed schema with no second edit — previously it
reached the generated schema but not the hand-written table.

The generated `user` tables in `apps/www`/`apps/test` were also missing the
`by_email_name`/`by_name`/`by_userId` indexes Better Auth needs (the adapter's
collection definition already computes them; the checked-in files had not
been regenerated since that indexing landed).

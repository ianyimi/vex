---
"create-vexcms": patch
---

`base-nextjs` (and the `marketing-site` overlay, which inherits its `package.json`) now ships a
`vex:deploy` script (`vex deploy`) instead of only documenting `npx convex deploy` in the
README. The scaffold README's `## Deployment` section and the root `create-vexcms` README now
point at the new [deployment guide](https://docs.vexcms.dev/guides/deployment/) and the
`pnpm vex:deploy --cmd 'pnpm build'` Vercel build command instead of a three-step
`npx convex deploy` recipe.

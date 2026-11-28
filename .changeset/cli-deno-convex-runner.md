---
"@vexcms/cli": patch
---

`vex dev` and `vex deploy` run `convex` through `deno x` in a project with a `deno.lock`.
Before, a Deno project fell through to `npx`, which needs a separate Node.js and npm install.
When `deno` isn't on PATH (a Deno project checked out on a Node.js-only machine), they warn and
keep using `npx`.

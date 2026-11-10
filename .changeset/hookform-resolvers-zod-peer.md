---
"create-vexcms": patch
---

New projects declare a `zod` peer for `@hookform/resolvers` (pulled in by
`@daveyplate/better-auth-ui`) through `pnpm.packageExtensions`. The package imports
`zod/v4/core` without declaring `zod`, so it only resolved when pnpm happened to hoist a
compatible copy; production builds could fail with "Can't resolve 'zod/v4/core'".

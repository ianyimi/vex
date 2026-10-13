---
"@vexcms/core": patch
---

Smaller bundles for anything that reaches the field input schemas. `fields/*/inputSchema.ts`
and `fields/utils.ts` imported Zod as `import { z } from "zod"`, which forces bundlers to keep
Zod's whole `z` namespace object — every locale included. They now use
`import * as z from "zod"`, which tree-shakes. Importing all of `@vexcms/core` drops from
~90 KB to ~46 KB gzipped, and `adminFieldToInputSchema` on its own from ~67 KB to ~23 KB. No API
or behavior change.

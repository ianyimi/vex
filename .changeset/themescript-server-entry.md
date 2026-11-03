---
"@vexcms/react": patch
---

`ThemeScript` moves from `@vexcms/react` (re-exported through `ui/index.ts` → the main
`src/index.ts` barrel) to a new `@vexcms/react/server` entry.

`src/index.ts` carries its own `"use client"` directive deliberately — everything reachable
from it joins the client module graph. `ThemeScript` is a plain `<script>`-returning function
with no hooks, genuinely server-renderable, but got swept into that boundary anyway purely by
being re-exported through the same barrel. Rendered from a Server Component (`app/layout.tsx`)
it became a client component reference instead of running during the server's own render
pass — React's "Encountered a script tag while rendering React component" warning (meant for
SSR output, not a post-hydration client insertion) and a flash of the wrong theme before
hydration.

`import { ThemeScript } from "@vexcms/react/server"` instead of `"@vexcms/react"`. No other
change — same props, same rendered output.

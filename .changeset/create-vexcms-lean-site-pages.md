---
"create-vexcms": patch
---

The scaffolded templates (`base-nextjs`, `marketing-site`) stop shipping admin panel and
auth-UI weight to public pages:

- The auth-UI provider (`AuthUIProvider`, previously mounted at the app root through
  `BetterAuthClientProvider`) now mounts only around the two routes that render an
  `AuthView` — the `/auth/[pathname]` page and the intercepting `@auth` modal route. Every
  other route no longer loads `better-auth-ui`, react-hook-form, hcaptcha or qrcode. The
  installer's `updateOAuthUIConfig` target moved with it: it now edits
  `src/auth/AuthViewProvider.tsx`, the single `AuthUIProvider` mount point, instead of the
  old root-level provider file.
- Icons scaffolded into blocks (`Features`, `HowItWorks`, `Footer`, `Split`) and
  `SessionButton` go through `@vexcms/react`'s lazy `Icon` (loads one icon per name on
  demand) instead of importing `lucide-react`'s `icons` map directly, except
  `SessionButton`'s sign-out icon, which stays a static `import { LogOut } from
  "lucide-react"` since it is the same icon on every render.

No config or route changes required for an already-scaffolded project — these are starting
points for newly scaffolded ones.

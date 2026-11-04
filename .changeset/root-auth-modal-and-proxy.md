---
"create-vexcms": patch
---

Template auth changes (`base-nextjs` and `marketing-site`):

- **Sign-in modal.** The intercepting sign-in modal moves from `app/(frontend)/@auth` to the app root (`app/@auth`, intercepting via `(.)auth`). The admin panel's "Sign in" now opens it as a dialog as well. A null `[...catchAll]` slot page clears the modal on soft navigation away.
- **Proxy.** `proxy.ts` no longer gates `/admin` (the matcher excludes it). The admin `page.tsx` now does the gating:
  - its redirect keeps the full deep link in `redirectTo`;
  - a failed session check sends the user to `/unauthorized` instead of letting them through.

  This also removes the Edge-runtime `BroadcastChannel` build warning.
- **Convex provider.** The Convex client provider passes `expectAuth: hasSessionCookie()`. It also resumes the socket when the session cookie is stale. Previously an anonymous visitor's socket stayed paused forever.

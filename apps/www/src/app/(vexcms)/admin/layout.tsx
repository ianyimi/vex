import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { getUserOrg } from "~/auth/server";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";

/**
 * Overlays `base-nextjs`'s admin layout to wire the theme system in: base
 * ships no theme, so its admin layout has nothing to render here. `<ThemeStyle
 * scope="admin" />` covers first paint; `<ThemeLive scope="admin" />` keeps it
 * live after a save in the admin panel, with no full reload. Emitted at
 * `:root:root`, so it outranks the site theme on admin routes only. Falls
 * back to the site theme when `siteSettings.adminTheme` is empty — see
 * `api.theme.getAdmin`.
 *
 * `AuthServerProvider` (`~/components/providers/auth`) used to wrap `{children}` here —
 * removed (perf fix, measured, not just flagged): it `await`s `getToken()`/`getUserOrg()`
 * BEFORE returning its own `{children}`, so React cannot begin streaming ANYTHING inside
 * it until that resolves, regardless of `NextAdminLayout`'s own `authPromise` plumbing.
 * Live TTFB measurement proved this: the "static shell" arrived no faster than the full
 * response, exactly matching `AuthServerProvider`'s own blocking cost, before this
 * removal. Safe to remove: its own `AuthContext` (`useAuth()`) has ZERO consumers inside
 * the admin tree — the one file whose comment mentions `AuthServerProvider`
 * (`SessionButton.tsx`) reads Better Auth's OWN client-side `useSession()` instead, and
 * only renders in the PUBLIC site's header block, never inside `/admin`.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Not awaited (perf/streaming fix) — `NextAdminLayout` resolves it inside the
  // sidebar's OWN `<Suspense>` boundary (`@vexcms/react`'s `AdminLayout`), so
  // `{children}` and this layout's own static chrome stream immediately instead of
  // waiting on a Convex round trip. `getUserOrg` is `cache()`-memoized (`auth/server.ts`):
  // this call and `page.tsx`'s own share ONE round trip, not two.
  const authPromise = getUserOrg();
  return (
    // `VexConfigProvider` is no longer mounted here — the root layout's
    // `ClientProviders` mounts it once for the whole app.
    <>
      <ThemeStyle scope="admin" />
      <ThemeLive scope="admin" />
      <NextAdminLayout authPromise={authPromise}>{children}</NextAdminLayout>
    </>
  );
}

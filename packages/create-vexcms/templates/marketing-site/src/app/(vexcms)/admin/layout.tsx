import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { getToken, getUserOrgForVexApi } from "~/auth/server";
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
 * `AuthServerProvider` used to wrap `{children}` here — removed (perf fix, measured): it
 * `await`s `getToken()`/`getUserOrg()` BEFORE returning its own `{children}`, so React
 * cannot begin streaming ANYTHING inside it until that resolves. Safe to remove: its own
 * `AuthContext` (`useAuth()`) has zero consumers inside the admin tree.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Not awaited — `NextAdminLayout` resolves it inside the sidebar's OWN `<Suspense>`
  // boundary (`@vexcms/react`'s `AdminLayout`), so `{children}` and this layout's own
  // static chrome stream immediately instead of waiting on a Convex round trip.
  const authPromise = getUserOrgForVexApi();
  // Awaited, unlike `authPromise` above: `getToken()` is `cache()`-memoized AND, when a
  // valid JWT cookie is present, resolves from a local decode (no network round trip —
  // see `auth/server.ts`'s `jwtCache` comment), so this costs far less than `getUserOrg()`
  // would. It must be awaited (not streamed via Suspense): the `<meta name="vex-session">`
  // it gates below needs to land in the INITIAL, non-deferred SSR HTML — before any
  // client script hydrates — for `convex.tsx`'s `hasSessionHint()` to see it synchronously
  // at hydration time (see that module's own doc comment).
  const sessionToken = await getToken();
  return (
    // `VexConfigProvider` is no longer mounted here — the root layout's
    // `ClientProviders` mounts it once for the whole app.
    <>
      {/* Tells `components/providers/convex.tsx`'s `hasSessionHint()` that a Better Auth
          session exists for this request, synchronously and before hydration — Better Auth's
          own `session_token` cookie is `httpOnly`, so `document.cookie` can never see it
          client-side. Never the token itself: just a presence marker. */}
      {sessionToken ? <meta name="vex-session" content="1" /> : null}
      <ThemeStyle scope="admin" />
      <ThemeLive scope="admin" />
      <NextAdminLayout authPromise={authPromise}>{children}</NextAdminLayout>
    </>
  );
}

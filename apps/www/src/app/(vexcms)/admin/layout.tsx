import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { getCurrentUser } from "~/auth/serverUtils";
import { AuthServerProvider } from "~/components/providers/auth";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";
import config from "~/vex.config";

import { ClientProviders } from "./clientProviders";

/**
 * Overlays `base-nextjs`'s admin layout to wire the theme system in: base
 * ships no theme, so its admin layout has nothing to render here. `<ThemeStyle
 * scope="admin" />` covers first paint; `<ThemeLive scope="admin" />` keeps it
 * live after a save in the admin panel, with no full reload. Emitted at
 * `:root:root`, so it outranks the site theme on admin routes only. Falls
 * back to the site theme when `siteSettings.adminTheme` is empty — see
 * `api.theme.getAdmin`.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    // Mounted here rather than in the root layout: its `getToken()` cookie read
    // forced every route in the app dynamic. Admin routes are meant to be
    // dynamic, so this is the correct home for it.
    <AuthServerProvider>
      <ClientProviders>
        <ThemeStyle scope="admin" />
        <ThemeLive scope="admin" />
        <NextAdminLayout config={config} user={user ?? undefined}>
          {children}
        </NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  );
}

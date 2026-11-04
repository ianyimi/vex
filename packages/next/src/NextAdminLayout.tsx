import type { ReactNode } from "react";
import { ADMIN_COOKIE_NAME, parseAdminCookie, type VexApiAuth } from "@vexcms/core";
import { NextAdminLayoutClient } from "./NextAdminLayoutClient";
import { cookies } from "next/headers";

/**
 * Next.js admin layout shell for VexCMS.
 *
 * A **server component** that reads the consolidated `vex-admin` cookie's
 * `sidebarOpen` field server-side (previously a dedicated
 * `sidebar_state` cookie) so the sidebar's open/closed state is correct on
 * first paint, with no client flash, and passes it, plus `authPromise`/
 * `children`, to the
 * client leaf `NextAdminLayoutClient`. Config no longer crosses this
 * boundary at all — the admin panel's client tree gets its config from the
 * app's own root `VexConfigProvider` mount
 * (`components/providers/client.tsx`), not from a prop threaded through this
 * layout.
 *
 * Does **not** await `authPromise` itself — only
 * `cookies()` (fast, no network). The sidebar resolves `authPromise` inside its
 * OWN `<Suspense>` boundary (`AdminLayout`, `@vexcms/react`), so a slow
 * `getUserOrg()` round trip only delays the sidebar nav, never `children` or
 * this layout's own static chrome.
 *
 * Render it from your admin `layout.tsx`. Because this is a server component,
 * your `layout.tsx` may itself call server-only auth helpers to build
 * `authPromise` (e.g. `getUserOrg()` from `~/auth/server`) — started, not
 * awaited, so `layout.tsx` itself stays synchronous and streams immediately.
 *
 * @param props - Layout props.
 * @param props.children - The page content from `[[...slug]]/page.tsx`.
 * @param props.authPromise - The in-flight `{ user, organization }` fetch,
 *   optional — omit it entirely when `config.access` is absent/disabled.
 * @returns The rendered admin shell, wrapping `children` in the client boundary
 *   ({@link NextAdminLayoutClient}) with the server-read sidebar cookie state.
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * import { NextAdminLayout } from "@vexcms/next/client";
 * import { getUserOrg } from "~/auth/server";
 *
 * export default function AdminLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <NextAdminLayout authPromise={getUserOrg()}>
 *       {children}
 *     </NextAdminLayout>
 *   );
 * }
 * ```
 */
export async function NextAdminLayout(props: {
  children: ReactNode;
  authPromise?: Promise<VexApiAuth>;
}) {
  const cookieStore = await cookies();
  const sidebarOpen = parseAdminCookie({ cookieValue: cookieStore.get(ADMIN_COOKIE_NAME)?.value }).sidebarOpen ?? false;

  return (
    <NextAdminLayoutClient authPromise={props.authPromise} sidebarOpen={sidebarOpen}>
      {props.children}
    </NextAdminLayoutClient>
  );
}

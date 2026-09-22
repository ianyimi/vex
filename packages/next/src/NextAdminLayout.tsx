import type { ReactNode } from "react";
import type { AdminUser } from "@vexcms/react";
import { NextAdminLayoutClient } from "./NextAdminLayoutClient";
import { cookies } from "next/headers";

/**
 * Next.js admin layout shell for VexCMS.
 *
 * A **server component** that reads the `sidebar_state` cookie server-side
 * (so the sidebar's open/closed state is correct on first paint, with no
 * client flash) and passes it, plus `user`/`organization`/`children`, to the
 * client leaf `NextAdminLayoutClient`. Config no longer crosses this
 * boundary at all — the admin panel's client tree gets its config from the
 * app's own root `VexConfigProvider` mount
 * (`components/providers/client.tsx`), not from a prop threaded through this
 * layout.
 *
 * Render it from your admin `layout.tsx`. Because this is a server component,
 * your `layout.tsx` may itself be an `async` server component (e.g. to run auth
 * checks).
 *
 * @param props - Layout props.
 * @param props.children - The page content from `[[...slug]]/page.tsx`.
 * @param props.user - Current user for the admin shell.
 * @returns The rendered admin shell, wrapping `children` in the client boundary
 *   ({@link NextAdminLayoutClient}) with the server-read sidebar cookie state.
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * import { NextAdminLayout } from "@vexcms/next/client";
 * import { getCurrentUser } from "~/auth/serverUtils";
 *
 * export default async function AdminLayout({ children }: { children: ReactNode }) {
 *   const user = await getCurrentUser();
 *   return (
 *     <NextAdminLayout user={user ?? undefined}>
 *       {children}
 *     </NextAdminLayout>
 *   );
 * }
 * ```
 */
export async function NextAdminLayout(props: {
  children: ReactNode;
  user?: AdminUser;
  organization?: Record<string, unknown>;
}) {
  const cookieStore = await cookies();
  const sidebarOpen = String(cookieStore.get("sidebar_state")?.value) === "true";

  return (
    <NextAdminLayoutClient
      user={props.user}
      organization={props.organization}
      sidebarOpen={sidebarOpen}
    >
      {props.children}
    </NextAdminLayoutClient>
  );
}

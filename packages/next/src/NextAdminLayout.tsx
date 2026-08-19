import type { ReactNode } from "react";
import type { VexConfig } from "@vexcms/core";
import { sanitizeConfigForClient } from "@vexcms/core";
import type { AdminUser } from "@vexcms/react";
import { NextAdminLayoutClient } from "./NextAdminLayoutClient";
import { cookies } from "next/headers";

/**
 * Next.js admin layout shell for VexCMS.
 *
 * A **server component** that sits on the server→client boundary for the admin
 * panel. It sanitizes the resolved `vex.config` with `sanitizeConfigForClient`
 * — stripping storage adapter class instances, functions, and React components
 * — *before* the config is handed to the client leaf `NextAdminLayoutClient`.
 *
 * This placement is the whole point: React serializes props when a server
 * component renders a client component, so the sanitize **must** happen on the
 * server side of that edge. Sanitizing inside the client component would run
 * too late — the raw config would already have failed to serialize.
 *
 * The client leaf handles everything that needs the browser (`usePathname`,
 * `NuqsAdapter`, `NextLink`/`NextImage`); this wrapper does no client work.
 *
 * Render it from your admin `layout.tsx`. Because this is a server component,
 * your `layout.tsx` may itself be an `async` server component (e.g. to run auth
 * checks) and pass the **raw** `vex.config` straight through — no sanitize
 * needed on the application side.
 *
 * @param props - Layout props
 * @param props.config - The resolved VexCMS config from `vex.config.ts` (raw)
 * @param props.children - The page content from `[[...slug]]/page.tsx`
 * @param props.user - Current user for the admin shell
 *
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * import { NextAdminLayout } from "@vexcms/next/client";
 * import config from "~/vex.config";
 * import { getCurrentUser } from "~/auth/serverUtils";
 *
 * export default async function AdminLayout({ children }: { children: ReactNode }) {
 *   const user = await getCurrentUser();
 *   return (
 *     <NextAdminLayout config={config} user={user ?? undefined}>
 *       {children}
 *     </NextAdminLayout>
 *   );
 * }
 * ```
 */
export async function NextAdminLayout(props: {
  config: VexConfig;
  children: ReactNode;
  user?: AdminUser;
  organization?: Record<string, unknown>;
}) {
  // Sanitize on the SERVER side of the server→client boundary, before the
  // config is serialized as a prop into the client leaf. This removes the
  // storage adapter class instances that would otherwise crash RSC
  // serialization ("Classes or null prototypes are not supported").
  const clientConfig = sanitizeConfigForClient(props.config);
  const cookieStore = await cookies();
  const sidebarOpen = String(cookieStore.get("sidebar_state")?.value) === "true";

  return (
    <NextAdminLayoutClient
      config={clientConfig}
      user={props.user}
      organization={props.organization}
      sidebarOpen={sidebarOpen}
    >
      {props.children}
    </NextAdminLayoutClient>
  );
}

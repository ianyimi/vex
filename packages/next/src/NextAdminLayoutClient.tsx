"use client";
// "use client" is injected by the tsup build banner for this entry (see
// tsup.config.ts) so the emitted module carries the client boundary.
import type { ReactNode } from "react";
import type { ClientVexConfig } from "@vexcms/core";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import NextImage from "next/image";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AdminLayout, type AdminUser } from "@vexcms/react";

/**
 * Client leaf for the Next.js admin layout.
 *
 * Owns all client-only wiring that cannot run on the server:
 * - `usePathname()` to derive the active collection slug / document id for
 *   sidebar highlighting (Next.js layouts do not receive route params).
 * - `NuqsAdapter` (`nuqs/adapters/next/app`) so URL state works inside the
 *   admin routes.
 * - `NextLink` / `NextImage` passed as framework components so every
 *   `VexLink`/`VexImage` uses Next.js routing and image optimisation.
 *
 * **Receives an already-sanitized `ClientVexConfig`.** The server wrapper
 * ({@link NextAdminLayout}) calls `sanitizeConfigForClient` before this
 * component is reached, so no non-serializable values (storage adapter class
 * instances, functions, React components) cross the server→client boundary.
 *
 * This component is internal to `@vexcms/next` — applications render
 * {@link NextAdminLayout} instead.
 *
 * @param props - Layout props
 * @param props.config - Sanitized config, safe to serialize across the boundary
 * @param props.children - The page content from `[[...slug]]/page.tsx`
 * @param props.user - Current user for the admin shell
 */
export function NextAdminLayoutClient(props: {
  config: ClientVexConfig;
  children: ReactNode;
  user?: AdminUser;
  organization?: Record<string, unknown>;
  sidebarOpen?: boolean;
}) {
  const pathname = usePathname();
  // pathname: "/admin", "/admin/posts", "/admin/posts/123"
  // Split on "/" and take the segment after "admin"
  const segments = pathname.split("/").filter(Boolean);
  const activeSlug = segments[1]; // undefined on /admin, "posts" on /admin/posts
  const activeDocID = segments[2];

  return (
    <NuqsAdapter>
      <AdminLayout
        config={props.config}
        activeSlug={activeSlug}
        components={{ Link: NextLink, Image: NextImage }}
        pathname={pathname}
        activeDocID={activeDocID}
        user={props.user}
        organization={props.organization}
        sidebarOpen={props.sidebarOpen}
      >
        {props.children}
      </AdminLayout>
    </NuqsAdapter>
  );
}

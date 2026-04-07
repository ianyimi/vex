"use client";

import type { ReactNode } from "react";
import type { VexConfig } from "@vexcms/core";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import NextImage from "next/image";
import { AdminLayout } from "@vexcms/react";

/**
 * Next.js admin layout shell for VexCMS.
 *
 * A client component that wraps `AdminLayout` from `@vexcms/react` with
 * Next.js-specific wiring:
 * - Passes `NextLink` and `NextImage` as framework components so all
 *   `VexLink`/`VexImage` helpers in the admin panel use Next.js routing
 *   and image optimisation automatically.
 * - Uses `usePathname()` to derive the active collection slug for sidebar
 *   highlighting. Next.js layouts do not receive child route params, so
 *   pathname parsing is the only way to know which collection is active.
 *
 * Place this in `app/admin/layout.tsx`. It stays mounted across navigations —
 * the sidebar and all providers are never re-rendered on route changes.
 *
 * @param props - Layout props
 * @param props.config - The resolved VexCMS config from `vex.config.ts`
 * @param props.children - The page content from `[[...slug]]/page.tsx`
 * @returns <VexAdminLayout config={config}>{children}</VexAdminLayout>
 *
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * import { VexAdminLayout } from "@vexcms/next";
 * import config from "../../../vex.config";
 *
 * export default function AdminLayout({ children }: { children: React.ReactNode }) {
 *   return <VexAdminLayout config={config}>{children}</VexAdminLayout>;
 * }
 * ```
 */
export function NextAdminLayout(props: {
  config: VexConfig;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // pathname: "/admin", "/admin/posts", "/admin/posts/123"
  // Split on "/" and take the segment after "admin"
  const segments = pathname.split("/").filter(Boolean);
  const activeSlug = segments[1]; // undefined on /admin, "posts" on /admin/posts

  return (
    <AdminLayout
      config={props.config}
      activeSlug={activeSlug}
      components={{ Link: NextLink, Image: NextImage }}
    >
      {props.children}
    </AdminLayout>
  );
}

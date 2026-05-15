"use client";

import type { ReactNode } from "react";
import type { VexConfig } from "@vexcms/core";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import NextImage from "next/image";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AdminLayout, AdminUser } from "@vexcms/react";

/**
 * Next.js admin layout shell for VexCMS.
 *
 * A client component that wraps `AdminLayout` from `@vexcms/react` with
 * Next.js-specific wiring:
 * - Provides a nuqs adapter (`nuqs/adapters/next`) so URL state works
 *   correctly within the admin panel routes.
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
 *
 * **`layout.tsx` must be `"use client"` and import `vex.config` directly.**
 * Turbopack's RSC HMR does not reliably propagate transitive dependency changes
 * (e.g. `posts.ts` → `vex.config.ts` → `layout.tsx`). The fix is to make the
 * layout a client module so Turbopack's Fast Refresh tracks the dependency.
 * `VexConfigContext` then propagates the live config to all admin components
 * (including `CollectionListView` and `CreateDocumentModal`) so field changes
 * hot-reload without a manual refresh. Next.js passes RSC page content through
 * `children` regardless of the layout being a client component.
 *
 * If you need server-only work in the admin layout (auth checks etc.), add a
 * separate RSC layout above this one in the route hierarchy.
 *
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * "use client"
 *
 * import type { ReactNode } from "react";
 * import { NextAdminLayout } from "@vexcms/next/client";
 * import config from "~/vex.config";
 *
 * export default function AdminLayout({ children }: { children: ReactNode }) {
 *   return <NextAdminLayout config={config}>{children}</NextAdminLayout>;
 * }
 * ```
 */
export function NextAdminLayout(props: {
  config: VexConfig;
  children: ReactNode;
  user?: AdminUser;
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
      >
        {props.children}
      </AdminLayout>
    </NuqsAdapter>
  );
}

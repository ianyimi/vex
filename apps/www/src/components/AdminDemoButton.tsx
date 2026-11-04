"use client";

import { buttonVariants, cn } from "@vexcms/react";
import { Settings } from "lucide-react";
import Link from "next/link";

/**
 * Opens the admin panel for anyone, read-only.
 *
 * A plain link: `/admin` now
 * checks `canAccessAdminPanel` BEFORE redirecting an unauthenticated caller away, at
 * both the route (`app/(vexcms)/admin/[[...path]]/page.tsx`) and the middleware gate
 * (`src/proxy.ts`'s `guardAdminRequest`) — a link alone no longer bounces an anonymous
 * visitor to `/auth/sign-in`. This REPLACES the earlier version, which minted a
 * throwaway Better Auth anonymous session first (via the `anonymous()` plugin) purely
 * to get past that now-fixed redirect — no session of any kind is created anymore.
 *
 * What the resulting (still fully anonymous) request can do is decided entirely by
 * `src/auth/access.ts`: a caller with no session carries no roles, `hasPermission` falls
 * back to `anonRole` (`user`), and that role grants `adminPanel.access` plus `read` on
 * `pages`/`siteSettings` and nothing else. Read-only is enforced server-side by the
 * access matrix, not by this component — nothing here is a security boundary.
 */
export function AdminDemoButton({
  className,
  size = "sm",
}: {
  className?: string;
  /** `sm` in the bar; `default` in the mobile Sheet, which needs a 44px row. */
  size?: "default" | "sm";
}) {
  return (
    <Link
      className={cn(buttonVariants({ size, variant: "outline" }), "gap-1.5 active:translate-y-px", className)}
      href="/admin"
      title="Browse the admin panel with read-only access"
    >
      <Settings className="size-3.5" />
      Admin
    </Link>
  );
}

"use client";

import { buttonVariants, cn } from "@vexcms/react";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn, useSession } from "~/auth/client";

/**
 * Opens the admin panel for anyone, read-only.
 *
 * `/admin` gates on authentication *before* authorization (see
 * `app/(vexcms)/admin/[[...path]]/page.tsx`), so a link alone would bounce an
 * anonymous visitor to `/auth/sign-in`. Better Auth's `anonymous()` plugin is
 * already registered in `convex/auth/plugins/index.ts`, so this mints a
 * throwaway session instead and then navigates.
 *
 * What that session can do is decided entirely by `src/auth/access.ts`: an
 * anonymous user carries no entry in `roles`, `hasPermission` falls back to
 * `anonRole` (`user`), and that role grants `adminPanel.access` plus `read` on
 * `pages`/`siteSettings` and nothing else. Read-only is enforced server-side by
 * the access matrix, not by this component — nothing here is a security
 * boundary.
 *
 * Rendered unconditionally, unlike the `useCanAccessAdminPanel()` gate that
 * used to guard it: that hook reads `VexAccessProvider`, which is only mounted
 * inside `/admin`, so on the marketing site it returned `false` for every
 * visitor and the affordance never appeared at all.
 */
export function AdminDemoButton({
  className,
  size = "sm",
}: {
  className?: string;
  /** `sm` in the bar; `default` in the mobile Sheet, which needs a 44px row. */
  size?: "default" | "sm";
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const label = "Admin";
  const classes = cn(
    buttonVariants({ size, variant: "outline" }),
    "gap-1.5 active:translate-y-px",
    className,
  );

  // A real link once a session exists, so middle-click and "open in new tab"
  // behave. Both branches render the same box, so the swap after `useSession`
  // resolves is invisible.
  if (session?.user) {
    return (
      <Link className={classes} href="/admin" title="Open the admin panel">
        <Settings className="size-3.5" />
        {label}
      </Link>
    );
  }

  return (
    <button
      aria-busy={isPending}
      className={classes}
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        signIn
          .anonymous()
          .then(() => {
            router.push("/admin");
          })
          .catch(() => {
            // Anonymous sign-in disabled or unreachable — hand the visitor the
            // real form rather than a dead button.
            router.push("/auth/sign-in?redirectTo=/admin");
          })
          .finally(() => {
            setIsPending(false);
          });
      }}
      title="Browse the admin panel with read-only access"
      type="button"
    >
      <Settings className={cn("size-3.5", isPending && "animate-spin")} />
      {label}
    </button>
  );
}

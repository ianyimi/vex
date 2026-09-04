"use client";

import { buttonVariants, cn } from "@vexcms/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut, useSession } from "~/auth/client";

/**
 * Drops a real session and returns the visitor to browsing anonymously.
 *
 * Renders only for a genuinely signed-in account. An anonymous demo session
 * does not count: `AdminDemoButton` mints one for any visitor who opens the
 * read-only panel, and offering *them* a sign-out control is meaningless —
 * they never signed in. See the `isAnonymous` guard below.
 *
 * There is deliberately no matching sign-in button. The site has no public
 * registration flow, so a login affordance in the marketing header would lead
 * nowhere useful for the visitors who make up almost all of the traffic. The
 * `/auth/sign-in` route is still reachable directly, which is how someone
 * holding an anonymous demo session upgrades to a real one.
 *
 * `router.refresh()` after `signOut()` is required, not cosmetic:
 * `AuthServerProvider` resolves the user in a server component, so a
 * client-only sign-out would clear the client's session state while the
 * server-rendered tree (and anything gated on it) kept showing the old user
 * until the next natural navigation.
 */
export function LogoutButton({
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

  // A real account only. Better Auth's `anonymous()` plugin issues a genuine
  // session for `AdminDemoButton`'s read-only demo, so `session.user` is
  // truthy for a visitor who never signed in to anything — offering them
  // "Sign out" asks them to leave an account they do not have. The plugin
  // marks those users `isAnonymous: true` (their email is a generated
  // `temp@….com` and their name is "Anonymous"), and `anonymousClient()`
  // carries the flag through to the typed client session, so no cast is
  // needed to read it here.
  if (!session?.user || session.user.isAnonymous === true) {
    return null;
  }

  const classes = cn(
    buttonVariants({ size, variant: "ghost" }),
    "gap-1.5 active:translate-y-px",
    className,
  );

  return (
    <button
      aria-busy={isPending}
      className={classes}
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        signOut()
          .then(() => {
            router.refresh();
          })
          .catch(() => {
            // A failed sign-out that leaves a stale client cache is worse
            // than a redundant refresh, so refresh either way.
            router.refresh();
          })
          .finally(() => {
            setIsPending(false);
          });
      }}
      title="Sign out and return to browsing anonymously"
      type="button"
    >
      <LogOut className={cn("size-3.5", isPending && "animate-spin")} />
      Sign out
    </button>
  );
}

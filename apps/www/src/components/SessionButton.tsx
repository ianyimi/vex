"use client";

import { buttonVariants, cn, Icon } from "@vexcms/react";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut, useSession } from "~/auth/client";

import { Button } from "./ui/button";

/**
 * One header slot that is always occupied: a disabled "Sign in" while the
 * session resolves, "Sign in" for a visitor, "Sign out" for a real account.
 *
 * Always rendering *something* is the point. The previous sign-out-only
 * control mounted after `useSession()` resolved, so the bar's right edge
 * jumped on every load for a signed-in user, and a signed-out user had no
 * way in except typing `/auth/sign-in` by hand.
 *
 * An anonymous demo session counts as signed out: `AdminDemoButton` mints one
 * for any visitor who opens the read-only panel, and offering them "Sign out"
 * asks them to leave an account they do not have. Better Auth's `anonymous()`
 * plugin marks those users `isAnonymous: true` and `anonymousClient()`
 * carries the flag through to the typed client session. Showing "Sign in"
 * instead is also how that visitor upgrades to a real account.
 *
 * "Sign in" is a plain link to `/auth/sign-in`. From a client navigation the
 * `@auth` intercepting route renders the form in a dialog over the current
 * page, and `AuthUIProvider.onSessionChange` refreshes the tree once the
 * session lands, so there is no `redirectTo` — that query switches the route
 * to its full-page guard mode.
 *
 * `router.refresh()` after `signOut()` is required, not cosmetic:
 * `AuthServerProvider` resolves the user in a server component, so a
 * client-only sign-out would clear the client's session state while the
 * server-rendered tree (and anything gated on it) kept showing the old user
 * until the next natural navigation.
 */
export function SessionButton({
  className,
  size = "sm",
}: {
  className?: string;
  /** `sm` in the bar; `default` in the mobile Sheet, which needs a 44px row. */
  size?: "default" | "sm";
}) {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const classes = cn(
    buttonVariants({ size, variant: "ghost" }),
    "gap-1.5 active:translate-y-px",
    className,
  );

  // While the session resolves, show the signed-out control disabled rather
  // than a spinner: the bar is right-aligned, so if this flips to the slightly
  // wider "Sign out" only the slot itself grows leftward — GitHub and the
  // buttons after it never move.
  if (isSessionPending) {
    return (
      <button aria-busy className={classes} disabled type="button">
        <LogIn size={14} />
        Sign in
      </button>
    );
  }

  if (!session?.user || session.user.isAnonymous === true) {
    return (
      <Link className={classes} href="/auth/sign-in" title="Sign in to your account">
        <LogIn size={14} />
        Sign in
      </Link>
    );
  }

  return (
    <Button
      aria-busy={isSigningOut}
      className={classes}
      disabled={isSigningOut}
      onClick={() => {
        setIsSigningOut(true);
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
            setIsSigningOut(false);
          });
      }}
      title="Sign out and return to browsing anonymously"
      type="button"
      variant="ghost"
    >
      <Icon
        className={cn(isSigningOut && "animate-spin")}
        name={isSigningOut ? "LoaderCircle" : "LogOut"}
        size={14}
      />
      Sign out
    </Button>
  );
}

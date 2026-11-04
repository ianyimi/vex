"use client";

import { AuthView } from "@daveyplate/better-auth-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity } from "react";

import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

export default function AuthCard({ pathname }: { pathname: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `redirectTo` alone can't distinguish a server GUARD redirect (middleware's
  // `redirectToSignIn`, or `/admin`'s own `redirect("/auth/sign-in?redirectTo=…")`)
  // from an explicit "Sign in" click — `AdminTopNav`'s `AuthControl` also sends
  // `redirectTo` (the current admin URL, to return to after signing in), and it
  // wants the DIALOG like every other explicit sign-in trigger, not the
  // full-screen guard card. `~/auth/client`'s `signInHref` appends `modal=1` as
  // the marker that says "this is a deliberate sign-in, render it as a modal" —
  // its absence is what makes a redirect a guard redirect.
  const isGuardRedirect = searchParams.has("redirectTo") && !searchParams.has("modal");
  if (isGuardRedirect) {
    return (
      <main className="absolute inset-0 grid place-items-center">
        <AuthView path={pathname} />
      </main>
    );
  }
  // No in-flow wrapper here on purpose. The Dialog portals into <body>, so a
  // wrapping <main> would be an empty element sitting after everything else
  // (the `@auth` slot renders last in the root layout). Next's post-navigation
  // scroll handler targets the new segment's first DOM node and would scroll
  // that empty element into view — i.e. jump the page to the bottom behind
  // the modal. With only a portal rendered there is no node to target.
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
      open
    >
      <Activity mode="hidden">
        <DialogTitle />
      </Activity>
      <DialogContent
        aria-describedby={undefined}
        className="grid place-items-center bg-transparent shadow-none ring-transparent"
        showCloseButton={false}
      >
        <AuthView path={pathname} />
      </DialogContent>
    </Dialog>
  );
}

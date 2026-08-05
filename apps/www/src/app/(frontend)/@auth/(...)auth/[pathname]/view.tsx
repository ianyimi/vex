"use client";

import { AuthView } from "@daveyplate/better-auth-ui";
import { useSearchParams } from "next/navigation";
import { Activity } from "react";

import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

export default function AuthCard({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const isGuardRedirect = searchParams.has("redirectTo");
  if (isGuardRedirect) {
    console.log("guard redirect activated");
    return (
      <main className="absolute inset-0 grid place-items-center">
        <AuthView path={pathname} />
      </main>
    );
  }
  return (
    <main>
      <Dialog open>
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
    </main>
  );
}

"use client";

import { ThemeToggle } from "@vexcms/react";
import { TerminalIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { signOut, useSession } from "~/auth/client";
import { Button } from "~/components/ui/button";

export function ComponentExample() {
  const { data: session } = useSession();

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {session?.user && (
          <>
            <div className="bg-muted flex size-8 items-center justify-center rounded-full">
              <UserIcon className="text-muted-foreground size-4" />
            </div>
            <span className="text-sm font-medium">{session.user.name}</span>
          </>
        )}
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="bg-foreground text-background flex size-14 items-center justify-center rounded-2xl">
          <TerminalIcon className="size-7" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Vex CMS</h1>
          <p className="text-muted-foreground max-w-sm text-base">
            The CMS built for Convex. Real-time, type-safe, developer first.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {session?.user ? (
          <div className="flex gap-4">
            <Link href="/admin">
              <Button>Admin</Button>
            </Link>
            <Button onClick={() => signOut()} variant="outline">
              Sign out
            </Button>
          </div>
        ) : (
          <>
            <Button nativeButton={false} render={<Link href="/auth/sign-up" />}>
              Sign up
            </Button>
            <Button nativeButton={false} render={<Link href="/auth/sign-in" />} variant="outline">
              Sign in
            </Button>
          </>
        )}
      </div>

      <code className="bg-muted text-muted-foreground rounded-lg px-4 py-2 font-mono text-sm">
        npx create-vexcms@alpha
      </code>
    </div>
  );
}

"use client";

import { buttonVariants, cn } from "@vexcms/react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { TOUR_PATH } from "~/lib/routes";

/**
 * Error boundary for every route under `/admin`: a render error in the admin
 * panel shows a retry button and a link to the static tour instead of a
 * blank page.
 *
 * @param props.error - The thrown error; logged to the console.
 * @param props.reset - Re-renders the failed segment.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    console.error(error);
    retryRef.current?.focus();
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Demo unavailable</h1>
      <p className="max-w-[32rem] text-muted-foreground">
        Something went wrong loading the admin panel. Try again, or view a static tour instead.
      </p>
      <div className="flex gap-4">
        <button
          className={cn(buttonVariants({ variant: "default" }))}
          onClick={reset}
          ref={retryRef}
          type="button"
        >
          Try again
        </button>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={TOUR_PATH}>
          View the tour
        </Link>
      </div>
    </div>
  );
}

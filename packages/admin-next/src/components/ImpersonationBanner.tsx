"use client";

import { usePermissionContext } from "../context/PermissionContext";
import { Button } from "@vexcms/ui";
import { XIcon, UserIcon } from "lucide-react";

export function ImpersonationBanner(props: {
  onStopImpersonation?: () => void;
}) {
  let ctx: ReturnType<typeof usePermissionContext> | null = null;
  try {
    ctx = usePermissionContext();
  } catch {
    return null;
  }

  if (!ctx.impersonation.active || !ctx.impersonation.impersonatedUser) {
    return null;
  }

  const impersonated = ctx.impersonation.impersonatedUser;

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-sm">
      <div className="flex items-center gap-2">
        <UserIcon className="h-4 w-4" />
        <span>
          Viewing as <strong>{impersonated.name}</strong> ({impersonated.email})
        </span>
      </div>
      {props.onStopImpersonation && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800"
          onClick={props.onStopImpersonation}
        >
          <XIcon className="h-3 w-3 mr-1" />
          Stop Impersonating
        </Button>
      )}
    </div>
  );
}

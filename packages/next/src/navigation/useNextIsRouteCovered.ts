"use client";

import { usePathname } from "next/navigation";
import { useVexConfig } from "@vexcms/react";

/**
 * Next.js App Router implementation of `FrameworkComponents["useIsRouteCovered"]`
 * (`packages/react/src/config/useFrameworkComponents.ts`).
 *
 * An intercepting route rendered from a root-level parallel slot — the app's
 * `@auth` sign-in modal, opened from the admin top bar — swaps the URL to its own
 * (`/auth/sign-in?redirectTo=…`) while the admin page stays mounted underneath.
 * `usePathname()`/`useSearchParams()` on that page then report the modal's URL.
 *
 * Admin UI only mounts on an admin route, and leaving the admin for real unmounts
 * it, so a pathname outside the configured `basePath` while still mounted can only
 * mean a covering route. With `basePath: "/"` every pathname is inside the admin,
 * so nothing is ever reported as covered — the admin and the app's own routes share
 * one namespace there and cannot be told apart by path.
 *
 * Provide it from `NextAdminLayoutClient`:
 * `components={{ …, useIsRouteCovered: useNextIsRouteCovered }}`.
 *
 * @returns `true` while the current pathname is outside the admin's `basePath`.
 */
export function useNextIsRouteCovered(): boolean {
  const pathname = usePathname();
  const adminRoot = `/${useVexConfig().basePath.split("/").filter(Boolean).join("/")}`;
  if (adminRoot === "/") return false;
  return pathname !== adminRoot && !pathname.startsWith(`${adminRoot}/`);
}

"use client";

import { useRouter } from "next/navigation";

/**
 * Next.js App Router implementation of `FrameworkComponents["useNavigate"]`
 * (`packages/react/src/config/useFrameworkComponents.ts`, Step 7).
 *
 * Returns the App Router's own `router.push`, unwrapped — guarding is not
 * this hook's job. `@vexcms/react`'s `useVexNavigate`
 * (`packages/react/src/config/useVexNavigate.ts`) is the only caller: it
 * consults `useUnsavedChangesGuard`'s blocking state itself before invoking
 * the function this hook returns, so every built-in post-mutation
 * navigation (after delete, after a duplicate's create resolves) is guarded
 * without this hook knowing anything about dirty state.
 *
 * Provide it from `NextAdminLayoutClient`:
 * `components={{ …, useNavigate: useNextNavigate }}`.
 *
 * @returns A function that navigates to `href` via the App Router.
 */
export function useNextNavigate(): (href: string) => void {
  const router = useRouter();
  return router.push;
}

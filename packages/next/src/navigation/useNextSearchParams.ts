"use client";

import { useSearchParams } from "next/navigation";

/**
 * Next.js App Router implementation of `FrameworkComponents["useSearchParams"]`
 * (`packages/react/src/config/useFrameworkComponents.ts`).
 *
 * `useSearchParams()` from `next/navigation` is SSR-safe on the admin's
 * dynamic routes, and it reflects shallow history updates (the `nuqs` writes
 * behind the list view's filter/sort/search), so the sign-in return URL
 * always carries the live query.
 *
 * Provide it from `NextAdminLayoutClient`:
 * `components={{ …, useSearchParams: useNextSearchParams }}`.
 *
 * @returns The current URL's query.
 */
export function useNextSearchParams(): URLSearchParams {
  return useSearchParams();
}

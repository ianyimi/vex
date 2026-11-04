"use client";

import { useFrameworkComponents } from "./useFrameworkComponents";

/**
 * Whether a route outside the admin currently covers it
 * (`FrameworkComponents.useIsRouteCovered`) — e.g. the app's sign-in modal opened
 * from the admin top bar. Reads the adapter hook unconditionally, like
 * `useVexNavigate` reads `useNavigate`, since an adapter's presence doesn't change
 * render to render.
 *
 * @returns `true` while covered; always `false` without an adapter hook.
 */
export function useIsRouteCovered(): boolean {
  return useFrameworkComponents().useIsRouteCovered?.() ?? false;
}

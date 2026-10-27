"use client";

import { createContext, type ReactNode, useContext } from "react";

/**
 * Default revalidation endpoint — a same-origin relative path, since the admin
 * panel and the public site it purges are always one deployment (see
 * `createVexRevalidateRoute` in `@vexcms/next`). No env var or shared secret is
 * needed because the request rides the admin's own session cookie.
 */
export const DEFAULT_VEX_REVALIDATE_ENDPOINT = "/api/vex/revalidate";

/** Revalidation settings `useVexMutation` and `useVexRevalidate` read. */
export interface VexRevalidateContextValue {
  /** When `true`, the purge request is skipped entirely. */
  disabled: boolean;
  /** URL that `{ collection, operation, changes }` is POSTed to after a write. */
  endpoint: string;
}

const VexRevalidateContext = createContext<VexRevalidateContextValue>({
  disabled: false,
  endpoint: DEFAULT_VEX_REVALIDATE_ENDPOINT,
});

/**
 * Reads the revalidation endpoint and enabled/disabled switch that
 * `useVexMutation` purges through.
 *
 * @returns The endpoint URL and disabled switch for the current admin session —
 *   the same-origin default when rendered outside `VexRevalidateProvider`.
 */
export function useVexRevalidateConfig(): VexRevalidateContextValue {
  return useContext(VexRevalidateContext);
}

/**
 * Overrides where `useVexMutation` purges to, or disables purging entirely.
 *
 * Only needed for the two cases the same-origin relative default does not
 * cover: an admin panel hosted on a different origin from the public site
 * (`endpoint` as an absolute URL), or a non-Next consumer with no
 * `createVexRevalidateRoute` to call (`disabled`).
 *
 * @param props - Input props.
 * @returns The context provider wrapping `props.children`.
 *
 * @example
 * ```tsx
 * <VexRevalidateProvider endpoint="https://www.example.com/api/vex/revalidate">
 *   <AdminLayout config={vexConfig}>{children}</AdminLayout>
 * </VexRevalidateProvider>
 * ```
 */
export function VexRevalidateProvider(props: {
  children: ReactNode;
  /** Skip purging entirely. Defaults to `false`. */
  disabled?: boolean;
  /** Absolute or relative endpoint. Defaults to the same-origin path. */
  endpoint?: string;
}) {
  return (
    <VexRevalidateContext.Provider
      value={{
        disabled: props.disabled ?? false,
        endpoint: props.endpoint ?? DEFAULT_VEX_REVALIDATE_ENDPOINT,
      }}
    >
      {props.children}
    </VexRevalidateContext.Provider>
  );
}

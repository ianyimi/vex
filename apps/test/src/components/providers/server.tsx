import { ThemeProvider } from "@vexcms/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type PropsWithChildren } from "react";


/**
 * Server-side provider shell: theme context + the nuqs URL-state adapter.
 *
 * `AuthServerProvider` used to wrap `NuqsAdapter` here, putting a `getToken()`
 * cookie read on every route's render path. It now mounts directly in
 * `app/(vexcms)/admin/layout.tsx`, the only route group that needs it.
 *
 * Deliberately does **not** mount `ConvexClientProvider` — `ClientProviders`
 * renders it, and `ClientProviders` is nested inside this component, so its
 * copy is the one that actually reaches `children`. Mounting it here as well
 * built a second `ConvexReactClient` + `QueryClient` pair on every server
 * render (`providers/convex.tsx` intentionally creates fresh clients per call
 * server-side to avoid cross-request leaks) whose only consumer was the
 * discarded outer subtree.
 *
 * Nothing between here and `ClientProviders` needs Convex: `AuthServerProvider`
 * is a server component that calls `getToken()`/`fetchAuthQuery` directly, and
 * `NuqsAdapter` is unrelated. React context is unreadable from server
 * components regardless.
 */
export default function ServerProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system">
      <NuqsAdapter>{children}</NuqsAdapter>
    </ThemeProvider>
  );
}

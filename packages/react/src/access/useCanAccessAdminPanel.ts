"use client";

import { canAccessAdminPanel } from "@vexcms/core";

import { useVexAccess } from "../config/VexConfigContext";
import { useIsVexAuthProviderMounted, useVexAuth } from "../auth/VexAuthContext";
import { useVexSessionAdapter } from "../auth/VexSessionAdapterContext";

/**
 * Result of {@link useCanAccessAdminPanel} — a tri-state, not a plain
 * boolean, because a public-page caller (no `VexAuthProvider`, resolving the
 * caller from a reactive client session instead) genuinely doesn't know the
 * answer for one tick after mount. A header that renders nothing while
 * `isPending` is `true` and an "Admin" link the instant it flips `false`
 * pops the link in after a signed-in visitor already sees the rest of the
 * header — reserve the link's own fixed-size slot (e.g. an invisible
 * placeholder matching its box) for the `isPending` window instead, the same
 * "always occupy the slot" treatment `SessionButton` uses for sign-in/out.
 */
export interface UseCanAccessAdminPanelResult {
  /**
   * Whether the current caller passes the `adminPanel.access` check. Only
   * meaningful once `isPending` is `false` — always `false` while pending.
   */
  canAccess: boolean;
  /**
   * Whether the caller is still being resolved. `false` inside `/admin`
   * (the caller is server-resolved, synchronous) — only ever `true` on a
   * public page, for the one tick before the client session settles.
   */
  isPending: boolean;
}

const SETTLED_DENIED: UseCanAccessAdminPanelResult = { canAccess: false, isPending: false };

/**
 * Whether the current caller may reach the admin panel at all — the
 * `adminPanel.access` gate, evaluated with the *same* predicate
 * (`canAccessAdminPanel`) the server route uses, so an "Admin" affordance in
 * site chrome can never disagree with what happens on navigation.
 *
 * Works in both trees:
 *
 * - **Inside `/admin`** (a `VexAuthProvider` ancestor is mounted): reads the
 *   server-resolved `{ user, organization }` from `useVexAuth()` —
 *   synchronous, `isPending` is always `false`.
 * - **Outside `/admin`** (every public page — no `VexAuthProvider` is ever
 *   mounted there): reads the app's own client session via the
 *   `VexSessionAdapterProvider` adapter (if mounted — see that module's own
 *   doc comment for wiring it), which resolves asynchronously on the client,
 *   like Better Auth's `authClient.useSession()`. `isPending` reflects that
 *   window; no adapter mounted degrades to the same fail-closed `false` as
 *   "no session", never a thrown error.
 *
 * Advisory only, like `usePermission`: the server route still redirects an
 * unauthorized caller. This exists so the UI does not offer a link that
 * leads to `/unauthorized`.
 *
 * Fails closed on a missing config or a missing/unresolved caller, which
 * `hasPermission` alone does not do: it returns `true` when no access config
 * is supplied, because server-side that legitimately means "RBAC is not
 * configured for this project". Client-side the same absence more often
 * means no config/session is in scope yet — rendering an "Admin" link for
 * an unresolved or anonymous visitor. Absence of information is not
 * permission.
 *
 * @returns `{ canAccess, isPending }` — see {@link UseCanAccessAdminPanelResult}.
 */
export function useCanAccessAdminPanel(): UseCanAccessAdminPanelResult {
  const access = useVexAccess();
  const isAdminContext = useIsVexAuthProviderMounted();
  const adminAuth = useVexAuth();
  const sessionAdapter = useVexSessionAdapter();
  // Called unconditionally, like `FrameworkComponents.useNavigate`/
  // `useIsRouteCovered` — an adapter's presence doesn't change render to
  // render, only whether the optional call fires.
  const session = sessionAdapter?.useSession();

  if (isAdminContext) {
    if (!access || !adminAuth.user) return SETTLED_DENIED;
    return {
      canAccess: canAccessAdminPanel({
        access,
        organization: adminAuth.organization,
        user: adminAuth.user,
      }),
      isPending: false,
    };
  }

  if (!access || !session) return SETTLED_DENIED;
  if (session.isPending) return { canAccess: false, isPending: true };
  if (!session.user) return SETTLED_DENIED;
  return {
    canAccess: canAccessAdminPanel({
      access,
      organization: session.organization,
      user: session.user,
    }),
    isPending: false,
  };
}

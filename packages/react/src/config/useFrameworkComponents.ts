"use client";

import type {
  AnchorHTMLAttributes,
  ComponentType,
  ImgHTMLAttributes,
} from "react";
import { createContext, useContext } from "react";

/**
 * Props the `VexLink` helper accepts — and that the injected `Link` component must handle.
 *
 * `href` is always a string (an internal admin route such as `/admin/posts`).
 * All other HTML anchor attributes are forwarded via the spread.
 */
export interface VexLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Internal route path, e.g. `/admin/posts`. */
  href: string;
}

/**
 * Props the `VexImage` helper accepts — and that the injected `Image` component must handle.
 */
export interface VexImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

/**
 * Framework adapter capability for intercepting navigation away from a
 * dirty edit view. `@vexcms/react` never imports a router —
 * `useUnsavedChangesGuard` calls `useBlocker` unconditionally and the
 * adapter decides how to intercept in-app link clicks and back/forward for
 * its framework (unload is NOT this adapter's job — `useUnsavedChangesGuard`
 * registers `beforeunload` itself). `@vexcms/next` is the only
 * implementation shipped in 0.1.0; a TanStack Start adapter would
 * implement the same contract without touching `@vexcms/react`.
 */
export interface NavigationBlockerAdapter {
  /**
   * Registers interception for the lifetime of the calling component,
   * re-registering whenever `when` changes. A Rules-of-Hooks-safe hook:
   * called every render regardless of `when`'s value.
   *
   * @param props - Blocker props.
   * @param props.when - Whether navigation should currently be intercepted.
   * @param props.onBlock - Called with a `proceed` callback instead of
   *   letting a blocked navigation through; calling `proceed()` lets that
   *   ONE navigation complete (a Leave click, or a released guard).
   */
  useBlocker(props: { when: boolean; onBlock: (proceed: () => void) => void }): void;
}

/**
 * Optional framework-specific component overrides.
 *
 * Pass these to `AdminLayout` so all internal components (`AppSidebar`, view
 * components, etc.) render the correct framework primitives without any extra
 * configuration by the developer.
 *
 * @example
 * ```tsx
 * // Next.js — pass directly
 * import NextLink from "next/link";
 * import NextImage from "next/image";
 *
 * <AdminLayout components={{ Link: NextLink, Image: NextImage }} config={vexConfig}>
 *   {children}
 * </AdminLayout>
 *
 * // TanStack Start — wrap to map href → to
 * import { Link as RouterLink } from "@tanstack/react-router";
 * const StartLink = ({ href, ...rest }: VexLinkProps) => <RouterLink to={href} {...rest} />;
 *
 * <AdminLayout components={{ Link: StartLink }} config={vexConfig}>
 *   {children}
 * </AdminLayout>
 * ```
 */
export interface FrameworkComponents {
  /**
   * Link component for client-side navigation.
   * Next.js: `NextLink` from `next/link` — accepts `href: string` directly.
   * TanStack Start: wrap `RouterLink` to map `href` → `to` (see example above).
   * Falls back to a native `<a>` if omitted.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link?: ComponentType<any>;
  /**
   * Image component for optimised image rendering.
   * Next.js: `NextImage` from `next/image`.
   * Falls back to a native `<img>` if omitted.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Image?: ComponentType<any>;
  /**
   * Intercepts in-app navigation away from a dirty edit view so
   * `useUnsavedChangesGuard` can show the Stay/Leave dialog. Next.js:
 * `useNextNavigationBlocker` from `@vexcms/next`. Omitted →
   * in-app navigation is never intercepted; the `beforeunload` native
   * prompt still fires on tab close / hard reload.
   */
  navigationBlocker?: NavigationBlockerAdapter;
  /**
 * Client-side programmatic navigation — consumed ONLY by
   * `useVexNavigate`, for a built-in's post-mutation redirect (after
   * delete, after a duplicate's create resolves). Everything clickable
   * keeps using `VexLink`/`Link`, never this. Next.js:
   * `@vexcms/next`'s wrapper around `useRouter().push` from
 * `next/navigation`. Omitted → `useVexNavigate` falls back to
   * `window.location.assign`, a full page navigation.
   *
   * @returns A hook — called unconditionally, like any other hook, at the
   *   top of `useVexNavigate` — returning the actual
   *   `(href: string) => void` navigate function.
   */
  useNavigate?: () => (href: string) => void;
  /**
   * Reports whether a route outside the admin currently owns the URL while the admin
   * stays mounted underneath it — e.g. a Next.js intercepting route such as the app's
   * root `@auth` sign-in modal. The covered admin page still reads the URL, so without
   * this its URL state (list filter/view/search, the active tab, open modals, the
   * sidebar's active collection) would read the covering route's query and reset behind
   * the modal. While it returns `true`, those readers keep their last admin value
   * (`useLastUncoveredValue`), the list view drops URL writes, and admin-wide keyboard
   * shortcuts stand down. Next.js: `useNextIsRouteCovered` from `@vexcms/next`. Omitted →
   * never covered.
   *
   * @returns A hook — called unconditionally, like `useNavigate` — returning `true`
   *   while a non-admin route covers the admin.
   */
  useIsRouteCovered?: () => boolean;
  /**
   * The current URL's query, read reactively — including shallow (history-only) updates
   * such as the list view's filter/sort writes. `AdminTopNav` appends it to the sign-in
   * return URL so signing in lands on exactly the page and state the visitor left.
   * Must be SSR-safe (the server render and hydration must agree). Next.js: `useSearchParams`
   * from `next/navigation`, via `@vexcms/next`'s `useNextSearchParams`. Omitted → the
   * return URL carries the path only.
   *
   * @returns A hook — called unconditionally — returning the current query.
   */
  useSearchParams?: () => URLSearchParams;
  /**
 * Sign-in/out adapter for `AdminTopNav`'s own control (a sign-in/out control in the
 * admin top bar, enabled by anonymous admin
   * access via `anonRole`). Omitted → the control renders nothing, same as today.
   *
   * The SIGNED-IN/SIGNED-OUT state itself is NOT part of this adapter — `AdminTopNav`
   * already reads it from `useVexAuth()` (`{ user, organization }`, server-resolved,
   * SSR-correct with no client-only flash), the same source every other RBAC-aware
   * component in this tree reads. `user === null` or `user.isAnonymous === true`
   * (Better Auth's `anonymous()` plugin convention, matching `@vexcms/better-auth`'s own
   * `anonRoleDatabaseHook`) both count as "signed out" for this control.
   *
   * Next.js: wire via `@vexcms/next`'s `VexAdminAuthAdapterProvider`, wrapping the app's
   * own `BetterAuthClientProvider` (or equivalent) — see its own doc comment for why a
   * context, not a prop threaded through `layout.tsx`, is required (the sign-in href
   * builder/`signOut` function are app-specific client values that cannot cross the
   * Server→Client Component boundary as props from an `async` layout).
   */
  auth?: FrameworkAuthAdapter;
}

/**
 * App-provided sign-in/out actions for `AdminTopNav`'s control.
 *
 * @see {@link FrameworkComponents.auth}
 */
export interface FrameworkAuthAdapter {
  /**
   * Builds the sign-in URL for a signed-out visitor, given the current admin URL to
   * return to after signing in (e.g. appended as a `redirectTo` query param, matching
   * the convention the project's own sign-in-gate middleware already uses).
   *
   * @param redirectTo - The current admin URL (path + query), to return to after sign-in.
   * @returns The sign-in route's URL, e.g. `/auth/sign-in?redirectTo=%2Fadmin%2Fposts`.
   */
  signInHref: (redirectTo: string) => string;
  /**
   * Signs the current session out AND triggers whatever full, server-aware refresh the
   * framework needs (Next.js: `signOut()` then `router.refresh()`) so the admin panel's
   * own server-resolved auth state (`VexAuthProvider`, seeded by `NextAdminPage`) and any
   * route guard re-evaluate against the now-signed-out session on return — landing on the
   * sign-in page if anonymous admin access isn't configured, or the admin panel's own
   * anonymous view if it is, exactly like a fresh unauthenticated request would.
   * `AdminTopNav` only calls this once and shows a pending state until it settles — the
   * adapter owns the whole sequence, not just the Better Auth call.
   *
   * @returns A promise that resolves once the ENTIRE sign-out sequence (not just the
   *   auth-client call) completes — `AdminTopNav`'s own pending state matches its
   *   lifetime. Should resolve even on failure (matching `SessionButton.tsx`'s own "a
   *   stale client cache after a failed sign-out is worse than a redundant refresh"
   *   reasoning) rather than rejecting and leaving the control stuck pending.
   */
  signOut: () => Promise<void>;
}

/**
 * Data attribute marking a link that opens a covering route
 * ({@link FrameworkComponents.useIsRouteCovered}) instead of leaving the admin — e.g.
 * `AdminTopNav`'s "Sign in", which opens the app's intercepted sign-in modal. A
 * framework's navigation blocker lets such a click through: the admin stays mounted
 * underneath with its unsaved state intact, so nothing is being left.
 */
export const COVERING_ROUTE_LINK_ATTRIBUTE = "data-vex-covering-route";

/**
 * React context for accessing the framework component overrides.
 * <Link />
 * <Image />
 */
export const FrameworkComponentsContext = createContext<FrameworkComponents>(
  {},
);

/**
 * Returns the current framework component overrides.
 *
 * @returns The `FrameworkComponents` provided by the nearest `AdminLayout`,
 *   or an empty object if no provider is in scope (all helpers fall back to
 *   native elements).
 */
export function useFrameworkComponents(): FrameworkComponents {
  return useContext(FrameworkComponentsContext);
}

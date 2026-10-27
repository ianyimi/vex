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
 * dirty edit view (decisions 1–2). `@vexcms/react` never imports a router —
 * `useUnsavedChangesGuard` calls `useBlocker` unconditionally and the
 * adapter decides how to intercept in-app link clicks and back/forward for
 * its framework (unload is NOT this adapter's job — `useUnsavedChangesGuard`
 * registers `beforeunload` itself). `@vexcms/next` is the only
 * implementation shipped in 0.1.0 (Step 8); a TanStack Start adapter would
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
   * `useNextNavigationBlocker` from `@vexcms/next` (Step 8). Omitted →
   * in-app navigation is never intercepted; the `beforeunload` native
   * prompt still fires on tab close / hard reload.
   */
  navigationBlocker?: NavigationBlockerAdapter;
  /**
   * Client-side programmatic navigation (spec decision 2) — consumed ONLY by
   * `useVexNavigate`, for a built-in's post-mutation redirect (after
   * delete, after a duplicate's create resolves). Everything clickable
   * keeps using `VexLink`/`Link`, never this. Next.js:
   * `@vexcms/next`'s wrapper around `useRouter().push` from
   * `next/navigation` (Step 8). Omitted → `useVexNavigate` falls back to
   * `window.location.assign`, a full page navigation.
   *
   * @returns A hook — called unconditionally, like any other hook, at the
   *   top of `useVexNavigate` — returning the actual
   *   `(href: string) => void` navigate function.
   */
  useNavigate?: () => (href: string) => void;
}

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

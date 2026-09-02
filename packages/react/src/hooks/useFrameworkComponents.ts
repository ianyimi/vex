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

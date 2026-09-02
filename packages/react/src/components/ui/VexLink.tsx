"use client";

import { forwardRef } from "react";
import {
  useFrameworkComponents,
  type VexLinkProps,
} from "../../hooks/useFrameworkComponents";
import { cn } from "../../styles/utils";

/**
 * Framework-aware link component.
 *
 * Renders the `Link` component from `FrameworkComponentsContext` if one is
 * configured (e.g. Next.js `NextLink`, TanStack Router wrapper), otherwise
 * falls back to a native `<a>` tag. All props are forwarded.
 *
 * In Base UI components, pass via the `render` prop rather than as a child:
 * ```tsx
 * <SidebarMenuButton render={<VexLink href="/admin/posts" />}>
 *   Posts
 * </SidebarMenuButton>
 * ```
 * Base UI's `useRender` merges the button's styles and state into the element.
 *
 * @param props - Accepts `href` plus any standard HTML anchor attributes
 * @returns A link element rendered by the injected framework component or `<a>`
 *
 * @example
 * ```tsx
 * // Standalone
 * <VexLink href="/admin/posts">Posts</VexLink>
 *
 * // As Base UI render prop (sidebar nav)
 * <SidebarMenuButton render={<VexLink href="/admin/posts" />} isActive>
 *   Posts
 * </SidebarMenuButton>
 * ```
 */
export const VexLink = forwardRef<HTMLAnchorElement, VexLinkProps>(
  function VexLink({ href, children, className, ...rest }, ref) {
    const { Link } = useFrameworkComponents();
    if (Link) {
      return (
        <Link
          href={href}
          ref={ref}
          {...rest}
          className={cn("transition-colors duration-300", className)}
        >
          {children}
        </Link>
      );
    }
    return (
      <a href={href} ref={ref} {...rest}>
        {children}
      </a>
    );
  },
);

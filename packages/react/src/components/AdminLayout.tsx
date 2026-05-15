"use client";

import type { ReactNode } from "react";
import type { VexConfig } from "@vexcms/core";
import {
  FrameworkComponentsContext,
  type FrameworkComponents,
} from "../hooks/useFrameworkComponents";
import { VexConfigContext } from "../context/VexConfigContext";
import { AppSidebar } from "./AdminSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { TooltipProvider } from "./ui/tooltip";
import AdminTopNav from "./AdminTopNav";

/**
 * User data displayed in the admin shell.
 *
 * Supplied by the host app's auth layer (e.g. Better Auth's `getCurrentUser()`).
 * All fields are optional so the admin shell degrades gracefully when no user
 * is provided.
 */
export interface AdminUser {
  /** Display name. */
  name?: string;
  /** User email. */
  email?: string;
  /** Avatar image URL. */
  image?: string;
}

/**
 * Props for the `AdminLayout` component.
 */
export interface AdminLayoutProps {
  /** The full resolved VexCMS config — forwarded to `AppSidebar`. */
  config: VexConfig;
  /**
   * The slug of the currently active collection.
   * Forwarded to `AppSidebar` for active nav highlighting.
   */
  activeSlug?: string;
  /**
   * The docID of the currently active document.
   * Forwarded to `AppSidebar` and `AdminTopNav` for admin navigation.
   */
  activeDocID?: string;
  /**
   * The full pathname of the current url
   * Forwarded to `AppTopNav` for the top nav.
   */
  pathname: string;
  /** The active view content rendered in the main content area. */
  children: ReactNode;
  /**
   * Optional framework-specific component overrides.
   *
   * Pass `{ Link: NextLink, Image: NextImage }` for Next.js.
   * Pass `{ Link: StartLink }` for TanStack Start (where `StartLink` wraps
   * `RouterLink` to map `href` → `to`).
   *
   * When omitted, all internal components fall back to native `<a>` and `<img>`.
   * In practice this prop is set by the framework adapter (`@vexcms/next` etc.)
   * rather than by the application developer.
   */
  components?: FrameworkComponents;
  user?: AdminUser;
}

/**
 * Admin panel layout shell.
 *
 * Provides `FrameworkComponentsContext` (for `VexLink`/`VexImage`) and
 * `SidebarProvider` (for the collapsible sidebar), renders `AppSidebar` on
 * the left, and places view content in a `SidebarInset` main area on the right.
 * A `SidebarTrigger` is rendered at the top of the content area for toggling.
 *
 * Exported from `@vexcms/react` and used by `NextAdminLayout` in `@vexcms/next`.
 * The consuming framework adapter (e.g. `NextAdminLayout`) is responsible for
 * providing a nuqs adapter before rendering this component.
 *
 * @param props - Layout props
 * @param props.config - Full VexCMS config
 * @param props.activeSlug - Forwarded to `AppSidebar` for active state
 * @param props.children - The active admin view content
 * @param props.components - Optional framework Link/Image overrides
 * @returns <AdminLayout>{children}</AdminLayout>
 *
 * @example
 * ```tsx
 * <AdminLayout
 *   config={vexConfig}
 *   activeSlug="posts"
 *   components={{ Link: NextLink, Image: NextImage }}
 * >
 *   <CollectionListView collection={postsCollection} />
 * </AdminLayout>
 * ```
 */
export function AdminLayout(props: AdminLayoutProps) {
  const side = props.config.admin.sidebar.side;

  const sidebar = (
    <AppSidebar
      config={props.config}
      activeSlug={props.activeSlug}
      user={props.user}
    />
  );

  const content = (
    <SidebarInset>
      <header className="flex h-12 items-center gap-2 px-4 border-b shrink-0">
        {side === "right" && <div className="flex-1" />}
        {side === "right" ? (
          <>
            <AdminTopNav {...props} />
            <SidebarTrigger
              side={side}
              className="transition-colors duration-300 hover:text-primary-hover"
            />
          </>
        ) : (
          <>
            <SidebarTrigger
              side={side}
              className="transition-colors duration-300 hover:text-primary-hover"
            />
            <AdminTopNav {...props} />
          </>
        )}
      </header>
      <main className="flex-1 overflow-y-auto p-6">{props.children}</main>
    </SidebarInset>
  );

  return (
    <VexConfigContext.Provider value={props.config}>
      <FrameworkComponentsContext.Provider value={props.components ?? {}}>
        <TooltipProvider>
          <SidebarProvider>
            {side === "right" ? (
              <>
                {content}
                {sidebar}
              </>
            ) : (
              <>
                {sidebar}
                {content}
              </>
            )}
          </SidebarProvider>
        </TooltipProvider>
      </FrameworkComponentsContext.Provider>
    </VexConfigContext.Provider>
  );
}

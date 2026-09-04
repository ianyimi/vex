"use client";

import type { ReactNode } from "react";
import type { ClientVexConfig } from "@vexcms/core";
import {
  FrameworkComponentsContext,
  type FrameworkComponents,
} from "../hooks/useFrameworkComponents";
import { VexAuthProvider, VexConfigContext } from "../context";
import { AppSidebar } from "./AdminSidebar";
import {
  Button,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  TooltipProvider,
  ThemeProvider,
  VexLink,
} from "./ui";
import AdminTopNav from "./AdminTopNav";

/**
 * User data displayed in the admin shell.
 *
 * Supplied by the host app's auth layer (e.g. Better Auth's `getCurrentUser()`).
 * All fields are optional so the admin shell degrades gracefully when no user
 * is provided.
 */
export interface AdminUser extends Record<string, unknown> {
  [key: string]: unknown;
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
  config: ClientVexConfig;
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
  organization?: Record<string, unknown>;
  sidebarOpen?: boolean;
}

/**
 * Link back out to the site this admin panel manages, rendered in the
 * `AdminLayout` topbar so it stays visible even when the sidebar is
 * collapsed (it used to live in `AppSidebar`'s header and disappeared with
 * the sidebar).
 *
 * `href` is hardcoded to `"/"` rather than a configured site URL: the panel
 * is mounted under `config.basePath` inside the host app, so the site it
 * manages is always at the root — there is no site URL on `ClientVexConfig`
 * to read, and nothing to go stale. The topbar's existing "Home" breadcrumb
 * points at `basePath` (the panel dashboard itself), not the site, so this
 * button is the only way out.
 *
 * `nativeButton={false}` is required whenever `render` supplies an anchor —
 * Base UI then emits `aria-disabled` instead of the `disabled` attribute,
 * which is what `buttonVariants` actually styles.
 *
 * @param props - Component props
 * @param props.className - Optional class override for positioning (e.g. `"ml-auto"`)
 * @returns <ViewSiteButton className="ml-auto" />
 */
function ViewSiteButton({ className }: { className?: string }) {
  return (
    <Button
      nativeButton={false}
      render={<VexLink href="/" />}
      size="icon"
      variant="outline"
      icon="ExternalLink"
      iconPosition="center"
      className={className}
    >
      <span className="sr-only">View site</span>
    </Button>
  );
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
      activeDocID={props.activeDocID}
      user={props.user}
    />
  );

  const content = (
    <SidebarInset>
      <header className="bg-background sticky top-0 z-100 flex h-12 shrink-0 items-center gap-2 border-b px-4">
        {side === "right" && <div className="flex-1" />}
        {side === "right" ? (
          <>
            <AdminTopNav {...props} />
            <ViewSiteButton />
            <SidebarTrigger
              side={side}
              className="hover:text-primary/90 transition-colors duration-300"
            />
          </>
        ) : (
          <>
            <SidebarTrigger
              side={side}
              className="hover:text-primary/90 transition-colors duration-300"
            />
            <AdminTopNav {...props} />
            <ViewSiteButton className="ml-auto" />
          </>
        )}
      </header>
      <main className="flex-1 p-6 pt-0">{props.children}</main>
    </SidebarInset>
  );

  return (
    <VexConfigContext.Provider value={props.config}>
      <VexAuthProvider
        value={{ user: props.user as Record<string, unknown>, organization: props.organization }}
      >
        <FrameworkComponentsContext.Provider value={props.components ?? {}}>
          <ThemeProvider>
            <TooltipProvider>
              <SidebarProvider defaultOpen={props.sidebarOpen}>
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
          </ThemeProvider>
        </FrameworkComponentsContext.Provider>
      </VexAuthProvider>
    </VexConfigContext.Provider>
  );
}

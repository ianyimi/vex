"use client";

import { Suspense, use, useEffect, type ReactNode } from "react";
import {
  LIST_VIEW_CONFIG_COOKIES,
  listChipsVisibleCookieName,
  listViewSkeletonRowCountCookieName,
  localSavedListViewsCookieName,
  livePreviewLayoutCookieName,
  livePreviewPanelCookieName,
  type VexApiAuth,
} from "@vexcms/core";
import {
  FrameworkComponentsContext,
  type FrameworkComponents,
} from "../config/useFrameworkComponents";
import { useVexConfig } from "../config/VexConfigContext";
import { VexAuthProvider } from "../auth";
import { AppSidebar } from "./AdminSidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  Toaster,
  TooltipProvider,
  ThemeProvider,
} from "../ui";

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
  /**
   * The slug of the currently active collection.
   * Forwarded to `AppSidebar` for active nav highlighting.
   */
  activeSlug?: string;
  /**
   * The docID of the currently active document.
   * Forwarded to `AppSidebar` for active nav highlighting.
   */
  activeDocID?: string;
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
  /**
   * The caller's `{ user, organization }`, in flight — resolved
   * independently of `children`, inside its OWN `<Suspense>` boundary around
   * JUST the sidebar's own nav gating, so a slow auth fetch never blocks
   * `children`'s own streaming (a perf fix: previously the whole admin shell
   * waited on this before rendering ANYTHING). Omit it when `config.access`
   * is absent/disabled (the optional-`auth` case) — the sidebar
   * then renders immediately with an anonymous `{ user: null }`, nothing to
   * suspend on.
   */
  authPromise?: Promise<VexApiAuth>;
  sidebarOpen?: boolean;
}

/**
 * Admin panel layout shell.
 *
 * Provides `FrameworkComponentsContext` (for `VexLink`/`VexImage`) and `SidebarProvider` (for
 * the collapsible sidebar), renders `AppSidebar` on the left, and places view content in a
 * `SidebarInset` main area on the right. Owns ONLY the sidebar and the main column frame —
 * the top bar (breadcrumbs, `SidebarTrigger`, "View site") is rendered by `NextAdminPage`
 * itself, inside `{children}` (see `AdminTopNav.tsx`'s own doc comment for why).
 *
 * Exported from `@vexcms/react` and used by `NextAdminLayout` in `@vexcms/next`.
 * The consuming framework adapter (e.g. `NextAdminLayout`) is responsible for
 * providing a nuqs adapter before rendering this component. Reads the full
 * config via `useVexConfig()` — the app's own `VexConfigProvider` mount
 * already sits above this component in every render tree, so this component
 * no longer needs to establish its own context value.
 *
 * @param props - Layout props
 * @param props.activeSlug - Forwarded to `AppSidebar` for active state
 * @param props.children - The active admin view content
 * @param props.components - Optional framework Link/Image overrides
 * @returns <AdminLayout>{children}</AdminLayout>
 *
 * @example
 * ```tsx
 * <AdminLayout
 *   activeSlug="posts"
 *   components={{ Link: NextLink, Image: NextImage }}
 * >
 *   <CollectionListView collection="posts" />
 * </AdminLayout>
 * ```
 */
export function AdminLayout(props: AdminLayoutProps) {
  const config = useVexConfig();
  const side = config.admin.sidebar.side;

  // One-time best-effort clear of every PRE-consolidation
  // cookie name still lingering from a returning browser — `vex-list-density`,
  // `vex-list-chips:<slug>`, `vex-list-views:<slug>`, `vex-list-rows:<slug>`,
  // `vex-live-preview-panel:<slug>`, `vex-live-preview-layout:<slug>` (all
  // previously `path=/`), and `sidebar_state` (shadcn's own, previously
  // `path=/` with no `samesite`). None of these are read anymore (every
  // reader now goes through the consolidated `vex-admin`/`vex-admin:<slug>`
  // cookies instead) — this just stops them from accumulating in the
  // browser's cookie jar forever. Best-effort: a blocked/unavailable
  // `document.cookie` degrades to "nothing cleared this visit", never a
  // crash, same guard every writer in `@vexcms/react/adminCookie.ts` uses.
  useEffect(() => {
    try {
      const slugs = [
        ...config.collections.map((c) => c.slug),
        ...config.mediaCollections.map((m) => m.slug),
      ];
      const globalSlugs = config.globals.map((g) => g.slug);
      const retiredNames = [
        LIST_VIEW_CONFIG_COOKIES.density,
        "sidebar_state",
        ...slugs.map((slug) => listChipsVisibleCookieName({ collectionSlug: slug })),
        ...slugs.map((slug) => localSavedListViewsCookieName({ collection: slug })),
        ...slugs.map((slug) => listViewSkeletonRowCountCookieName({ collection: slug })),
        ...[...slugs, ...globalSlugs].map((slug) => livePreviewPanelCookieName({ slug })),
        ...[...slugs, ...globalSlugs].map((slug) => livePreviewLayoutCookieName({ slug })),
      ];
      for (const name of retiredNames) {
        document.cookie = `${name}=; path=/; max-age=0`;
      }
    } catch {
      // document.cookie can throw under Safari private mode / strict cookie
      // settings; a lingering retired cookie is not worth crashing the shell.
    }
  }, []);

  const sidebar = props.authPromise ? (
    <Suspense fallback={<AdminSidebarSkeleton />}>
      <AuthedSidebar
        authPromise={props.authPromise}
        activeSlug={props.activeSlug}
        activeDocID={props.activeDocID}
      />
    </Suspense>
  ) : (
    // No `authPromise` at all means `config.access` is absent or
    // disabled for this project (the optional-`auth` case) — render the real
    // sidebar immediately with an anonymous `{ user: null }`; there is
    // nothing to suspend on.
    <VexAuthProvider value={{ user: null }}>
      <AppSidebar activeSlug={props.activeSlug} activeDocID={props.activeDocID} />
    </VexAuthProvider>
  );

  const content = (
    <SidebarInset>
      {/* The app's only scroll container. The window itself never scrolls (see
          `SidebarProvider`'s wrapper), so toggling a view's height can no longer
          add or remove a window scrollbar and shift the layout sideways.

          No padding here:
          `AdminLayout` now renders ONLY the sidebar and this main column frame — the top
          bar (`AdminTopNav`) and the padded content wrapper both live INSIDE `{children}`
          now, rendered by `NextAdminPage` itself, so the bar can be a true descendant of
          `NextAdminPage`'s own `HydrationBoundary` (required for its document-title crumb
          to resolve correctly on first paint — see `AdminTopNav.tsx`'s own doc comment). The
          bar's own `sticky top-0` still works correctly here: `position: sticky` sticks to
          the nearest scrolling ancestor, which is THIS `<main>` (its `overflow-y-auto`),
          regardless of how deep inside `{children}` the bar itself sits.

          `flex flex-col` (double-scroll fix):
          wrapper (`NextAdminPage.tsx`'s `renderAdminShell`) are now BOTH children of this
          `<main>`, not siblings of it — without a flex chain here, the content wrapper's own
          `flex-1 min-h-0` has nothing to divide space WITH (it needs to share `<main>`'s own
          height with the bar's fixed height, the same way `<main>` itself shares
          `SidebarInset`'s height with the sidebar). Without this, the wrapper's own
          percentage/flex height ignored the bar's ~48px, overflowing `<main>`'s own bottom
          edge by exactly that much — a second, unwanted page-level scrollbar. */}
      <main className="vex-scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto" id="main">
        {props.children}
      </main>
    </SidebarInset>
  );

  return (
    <>
      <a
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-100 focus-visible:rounded-sm focus-visible:border focus-visible:border-border focus-visible:bg-card focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-foreground"
        href="#main"
      >
        Skip to content
      </a>
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
      <Toaster />
    </>
  );
}

/**
 * Resolves `authPromise` (via React's `use()`) and renders the real sidebar
 * nav, scoped to its OWN `VexAuthProvider` — not the whole admin shell's.
 * `AdminLayout`'s `{children}` is a SIBLING of this component (not nested
 * inside it), so `children`'s own streaming is never gated on this promise;
 * `NextAdminPage` provides its OWN auth context for the content area
   * (independent of this one). Wrapped in `<Suspense>` by
 * `AdminLayout` so a slow `getUserOrg()` round trip only delays the sidebar's
 * nav, never the rest of the shell.
 *
 * @param props - Component props.
 * @param props.authPromise - The in-flight `{ user, organization }` fetch.
 * @returns The real `AppSidebar`, wrapped in a `VexAuthProvider` scoped to it.
 */
function AuthedSidebar(props: {
  authPromise: Promise<VexApiAuth>;
  activeSlug?: string;
  activeDocID?: string;
}) {
  const auth = use(props.authPromise);
  return (
    <VexAuthProvider value={auth}>
      <AppSidebar
        activeSlug={props.activeSlug}
        activeDocID={props.activeDocID}
        user={auth.user as AdminUser | undefined}
      />
    </VexAuthProvider>
  );
}

/**
 * Generic sidebar skeleton shown while `authPromise` is in flight (streamed
 * first paint, Decision NN) — no nav labels, no collection names or counts,
 * so a denied/unauthenticated caller never sees anything project-specific in
 * the shell (even the UNFILTERED collection COUNT is
 * config-derived information the generic shell must not leak). A FIXED
 * placeholder row count, not read from `useVexConfig()` — the sidebar is its
 * own scrollable column (`SidebarContent`'s own `overflow-auto` inside a
 * viewport-pinned `h-svh` wrapper, `ui/sidebar.tsx`), so however many real
 * rows replace these placeholders, nothing OUTSIDE the sidebar (the main
 * content's position) ever shifts — only the sidebar's own internal content
 * may grow/shrink/scroll, which is an accepted, contained difference, not a
 * page-level layout shift.
 *
 * @returns A `Sidebar` filled with fixed-count placeholder rows (no real
 *   nav labels, collection names, or counts).
 */
function AdminSidebarSkeleton() {
  const config = useVexConfig();
  const SKELETON_ROW_COUNT = 6;
  return (
    <Sidebar side={config.admin.sidebar.side} collapsible={config.admin.sidebar.collapsible}>
      <SidebarHeader className="flex h-12 justify-center border-b">
        <div className="flex items-center justify-between">
          <span className="px-2 font-mono text-sm font-semibold tracking-tight">VexCMS Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

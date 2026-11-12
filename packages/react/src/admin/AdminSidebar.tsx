"use client";

import { CRUD_ACTIONS, PERMISSION_SCOPES } from "@vexcms/core";
import { adminHref } from "./adminHref";
import { useVexConfig } from "../config/VexConfigContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  VexLink,
  ThemeToggle,
  Icon,
} from "../ui";
import { AdminUser } from "./AdminLayout";
import { Activity, useEffect } from "react";
import { usePermission } from "../access";
import { writeSidebarSectionCountsCookie } from "./writeSidebarSectionCountsCookie";

/**
 * Props for the `AppSidebar` component.
 */
export interface AppSidebarProps {
  /**
   * The slug of the currently active collection.
   * Used to set `isActive` on the matching `SidebarMenuButton`.
   */
  activeSlug?: string;
  /**
   * The docID of the currently active document.
   * Sometimes refers to a global slug.
   * Used to set `isActive` on the matching `SidebarMenuButton`.
   */
  activeDocID?: string;
  user?: AdminUser;
}

/**
 * Admin panel sidebar component.
 *
 * Renders the VexCMS admin navigation using shadcn `Sidebar` primitives.
 * Displays a nav group per registered collection with links to `/admin/:slug`.
 * The active collection's menu button is highlighted via the `isActive` prop.
 *
 * Navigation links are rendered via `VexLink`, which reads `FrameworkComponentsContext`
 * to use the configured framework `Link` component (e.g. Next.js `NextLink`) or falls
 * back to a native `<a>`. `VexLink` is passed via the Base UI `render` prop on
 * `SidebarMenuButton` — Base UI's `useRender` merges the button's styles and state
 * attributes into the rendered link element.
 *
 * Must be rendered inside a `SidebarProvider` — `AdminLayout` provides this.
 *
 * @param props - Sidebar props
 * @param props.activeSlug - Slug of the currently active collection
 * @returns <AppSidebar activeSlug="posts" />
 *
 * @example
 * ```tsx
 * // Used inside AdminLayout — SidebarProvider and FrameworkComponentsContext are in scope
 * <AppSidebar activeSlug="posts" />
 * ```
 */
export function AppSidebar(props: AppSidebarProps) {
  const config = useVexConfig();

  // `scope: "any"` — the sidebar asks "may they read at least one document in
  // this collection?", so a per-document check resolves optimistically and the
  // section stays visible; row-level filtering happens in `find`/`get`.
  const collections = config.collections.filter((c) =>
    usePermission({
      resource: c.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );
  const globals = config.globals.filter((g) =>
    usePermission({
      resource: g.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );
  const mediaCollections = config.mediaCollections.filter((mc) =>
    usePermission({
      resource: mc.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );

  // Persists each section's own settled, permission-filtered item count so the NEXT
  // server render's `<Suspense>` fallback (`AdminSidebarSkeleton`) can reproduce this
  // exact header/row shape on first paint instead of a generic placeholder count — the
  // sidebar's own version of `writeListViewSkeletonRowCountCookie`. One effect per
  // section (not a single combined write) so a section whose own permission check
  // resolves independently of the others still persists as soon as ITS length settles.
  useEffect(() => {
    writeSidebarSectionCountsCookie({ basePath: config.basePath, section: "collections", count: collections.length });
  }, [config.basePath, collections.length]);
  useEffect(() => {
    writeSidebarSectionCountsCookie({ basePath: config.basePath, section: "globals", count: globals.length });
  }, [config.basePath, globals.length]);
  useEffect(() => {
    writeSidebarSectionCountsCookie({ basePath: config.basePath, section: "media", count: mediaCollections.length });
  }, [config.basePath, mediaCollections.length]);

  return (
    <Sidebar
      aria-label="Admin navigation"
      collapsible={config.admin.sidebar.collapsible}
      role="navigation"
      side={config.admin.sidebar.side}
    >
      <SidebarHeader className="flex min-h-[67px] justify-center border-b px-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-base font-semibold tracking-tight">VexCMS Admin</span>
          <ThemeToggle size="icon-lg" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Activity mode={collections.length > 0 ? "visible" : "hidden"}>
          <SidebarGroup>
            <SidebarGroupLabel>Collections</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {collections.map((collection) => (
                  <SidebarMenuItem key={collection.slug}>
                    <SidebarMenuButton
                      render={<VexLink href={adminHref({ type: "collection", slug: collection.slug }, config.basePath)} />}
                      isActive={props.activeSlug === collection.slug}
                    >
                      {collection.admin.icon && (
                        <div>
                          <Icon name={collection.admin.icon} size={12} />
                        </div>
                      )}
                      {collection.labels.plural}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Activity>
        <Activity mode={globals.length > 0 ? "visible" : "hidden"}>
          <SidebarGroup>
            <SidebarGroupLabel>Globals</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {globals.map((global) => (
                  <SidebarMenuItem key={global.slug}>
                    <SidebarMenuButton
                      render={<VexLink href={adminHref({ type: "global", slug: global.slug }, config.basePath)} />}
                      isActive={props.activeDocID === global.slug}
                    >
                      {global.admin.icon && (
                        <div>
                          <Icon name={global.admin.icon} size={12} />
                        </div>
                      )}
                      {global.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Activity>
        <Activity mode={mediaCollections.length > 0 ? "visible" : "hidden"}>
          <SidebarGroup>
            <SidebarGroupLabel>Media</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mediaCollections.map((mediaCollection) => (
                  <SidebarMenuItem key={mediaCollection.slug}>
                    <SidebarMenuButton
                      render={<VexLink href={adminHref({ type: "collection", slug: mediaCollection.slug }, config.basePath)} />}
                      isActive={props.activeSlug === mediaCollection.slug}
                    >
                      {mediaCollection.admin.icon && (
                        <div>
                          <Icon name={mediaCollection.admin.icon} size={12} />
                        </div>
                      )}
                      {mediaCollection.labels.plural}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Activity>
      </SidebarContent>
    </Sidebar>
  );
}

"use client";

import { addLeadingSlash, ClientVexConfig, CRUD_ACTIONS, PERMISSION_SCOPES } from "@vexcms/core";
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
} from "./ui";
import { AdminUser } from "./AdminLayout";
import { Icon } from "./Icon";
import { Activity } from "react";
import { usePermission } from "../hooks";

/**
 * Props for the `AppSidebar` component.
 */
export interface AppSidebarProps {
  /** The full resolved VexCMS config — used to render the collection nav links. */
  config: ClientVexConfig;
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
 * @param props.config - Full VexCMS config
 * @param props.activeSlug - Slug of the currently active collection
 * @returns <AppSidebar config={vexConfig} activeSlug="posts" />
 *
 * @example
 * ```tsx
 * // Used inside AdminLayout — SidebarProvider and FrameworkComponentsContext are in scope
 * <AppSidebar config={vexConfig} activeSlug="posts" />
 * ```
 */
export function AppSidebar(props: AppSidebarProps) {
  const adminRoot = addLeadingSlash(props.config.basePath);

  // `scope: "any"` — the sidebar asks "may they read at least one document in
  // this collection?", so a per-document check resolves optimistically and the
  // section stays visible; row-level filtering happens in `find`/`get`.
  const collections = props.config.collections.filter((c) =>
    usePermission({
      resource: c.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );
  const globals = props.config.globals.filter((g) =>
    usePermission({
      resource: g.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );
  const mediaCollections = props.config.mediaCollections.filter((mc) =>
    usePermission({
      resource: mc.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );

  return (
    <Sidebar
      side={props.config.admin.sidebar.side}
      collapsible={props.config.admin.sidebar.collapsible}
    >
      <SidebarHeader className="flex h-12 justify-center border-b">
        <div className="flex items-center justify-between">
          <span className="px-2 font-mono text-sm font-semibold tracking-tight">VexCMS Admin</span>
          <ThemeToggle />
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
                      render={<VexLink href={`${adminRoot}/${collection.slug}`} />}
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
                      render={<VexLink href={`${adminRoot}/globals/${global.slug}`} />}
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
                      render={<VexLink href={`${adminRoot}/${mediaCollection.slug}`} />}
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

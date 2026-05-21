"use client";

import { addLeadingSlash, type VexConfig } from "@vexcms/core";
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
} from "./ui/sidebar";
import { VexLink } from "./ui/VexLink";
import { AdminUser } from "./AdminLayout";

/**
 * Props for the `AppSidebar` component.
 */
export interface AppSidebarProps {
  /** The full resolved VexCMS config — used to render the collection nav links. */
  config: VexConfig;
  /**
   * The slug of the currently active collection.
   * Used to set `isActive` on the matching `SidebarMenuButton`.
   */
  activeSlug?: string;
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
  return (
    <Sidebar side={props.config.admin.sidebar.side}>
      <SidebarHeader className="h-12 border-b flex flex-col justify-center">
        <span className="font-semibold font-mono text-sm tracking-tight px-2">
          VexCMS Admin
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {props.config.collections.map((collection) => (
                <SidebarMenuItem key={collection.slug}>
                  <SidebarMenuButton
                    render={
                      <VexLink
                        href={`${addLeadingSlash(props.config.basePath)}/${collection.slug}`}
                      />
                    }
                    isActive={props.activeSlug === collection.slug}
                  >
                    {collection.labels.plural}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

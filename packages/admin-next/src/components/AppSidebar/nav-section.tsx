"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@vexcms/ui";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { readLocalStorage } from "../../hooks/useLocalStorage";
import { useCallback } from "react";

interface NavSectionProps {
  title: string;
  items: {
    title: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  /** Ungrouped items rendered as direct links below the groups */
  ungroupedItems?: {
    title: string;
    url: string;
    slug: string;
  }[];
}

function NavGroup({
  sectionTitle,
  item,
}: {
  sectionTitle: string;
  item: NavSectionProps["items"][number];
}) {
  const storageKey = `vex-nav-group-${sectionTitle}-${item.title}`;

  // Read synchronously for defaultOpen so the Collapsible mounts
  // in the correct state with no animation.
  const initialOpen = readLocalStorage(storageKey, item.isActive ?? false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(open));
      } catch {
        // Storage unavailable
      }
    },
    [storageKey]
  );

  return (
    <Collapsible
      defaultOpen={initialOpen}
      onOpenChange={handleOpenChange}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={<SidebarMenuButton tooltip={item.title} />}
      >
        {item.icon}
        <span>{item.title}</span>
        <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items?.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton render={<Link href={subItem.url} />}>
                <span>{subItem.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavSection({ title, items, ungroupedItems }: NavSectionProps) {
  if (items.length === 0 && (!ungroupedItems || ungroupedItems.length === 0)) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavGroup key={item.title} sectionTitle={title} item={item} />
        ))}
        {ungroupedItems?.map((item) => (
          <SidebarMenuItem key={item.slug}>
            <SidebarMenuButton render={<Link href={item.url} />} tooltip={item.title}>
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

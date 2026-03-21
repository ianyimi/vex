"use client";

import { NavSection } from "./nav-section";
// import { NavProjects } from "./nav-projects";
import { NavUser, NavUserData } from "./nav-user";
// import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  // SidebarHeader,
  SidebarRail,
} from "@vexcms/ui";
// import {
//   GalleryVerticalEndIcon,
//   AudioLinesIcon,
//   TerminalIcon,
//   TerminalSquareIcon,
//   BotIcon,
//   BookOpenIcon,
//   Settings2Icon,
//   FrameIcon,
//   PieChartIcon,
//   MapIcon,
// } from "lucide-react";
import { ClientVexConfig, hasPermission } from "@vexcms/core";
import { ComponentProps, ReactNode, useMemo } from "react";
import { usePermissionContext } from "../../context/PermissionContext";

type CollectionNavItem = {
  title: string;
  url: string;
  slug: string;
  icon?: ReactNode;
  isActive?: boolean;
};

type CollectionNavGroup = {
  items: CollectionNavItem[];
} & Omit<CollectionNavItem, "url" | "slug">;

export { type NavUserData } from "./nav-user";

import type { PermissionUser } from "../../context/PermissionContext";

export function AppSidebar({
  config,
  user,
  onImpersonate,
  impersonatableUsers,
  ...props
}: {
  config: ClientVexConfig;
  user?: NavUserData;
  onImpersonate?: (target: PermissionUser) => void;
  impersonatableUsers?: PermissionUser[];
} & ComponentProps<typeof Sidebar>) {
  // Try to get permission context — may not exist if no access config
  let permissionContext: ReturnType<typeof usePermissionContext> | null = null;
  try {
    permissionContext = usePermissionContext();
  } catch {
    // No permission provider — show all collections (permissive default)
  }

  const nav = useMemo(() => {
    // Combine user collections + auth-only collections + media collections (no duplicates)
    const userSlugs = new Set(config.collections.map((c) => c.slug));
    const allCollections = [
      ...config.collections,
      ...(config.auth?.collections.filter((c) => !userSlugs.has(c.slug)) ?? []),
      ...(config.media?.collections.filter((c) => !userSlugs.has(c.slug)) ?? []),
    ];

    // Filter collections by read access (no fields needed — just overall boolean)
    const accessibleCollections = permissionContext?.access
      ? allCollections.filter((c) => {
          const readAllowed = hasPermission({
            access: permissionContext!.access,
            user: { _id: permissionContext!.user.id },
            userRoles: permissionContext!.user.roles,
            resource: c.slug,
            action: "read",
          });
          return readAllowed === true;
        })
      : allCollections;

    const collections: CollectionNavItem[] = accessibleCollections
      .filter((c) => !c.admin?.group)
      .map((c) => ({
        title: c.labels?.plural ?? c.slug,
        url: `${config.basePath}/${c.slug}`,
        slug: c.slug,
      }));

    const collectionGroups: CollectionNavGroup[] = [];
    accessibleCollections.forEach((c) => {
      if (!c.admin?.group) return;
      const index = collectionGroups.findIndex(
        (cg) => cg.title === c.admin!.group,
      );
      if (index < 0) {
        collectionGroups.push({
          title: c.admin!.group,
          items: [
            {
              title: c.labels?.plural ?? c.slug,
              url: `${config.basePath}/${c.slug}`,
              slug: c.slug,
            },
          ],
        });
      } else {
        collectionGroups[index].items.push({
          title: c.labels?.plural ?? c.slug,
          url: `${config.basePath}/${c.slug}`,
          slug: c.slug,
        });
      }
    });

    const globals: CollectionNavItem[] = config.globals
      .filter((g) => !g.admin?.group)
      .map((g) => ({
        title: (g.admin?.useAsTitle as string) ?? g.slug,
        url: `${config.basePath}/${g.slug}`,
        slug: g.slug,
      }));

    const globalGroups: CollectionNavGroup[] = [];
    config.globals.forEach((g) => {
      if (!g.admin?.group) return;
      const index = collectionGroups.findIndex(
        (gg) => gg.title === g.admin!.group,
      );
      if (index < 0) {
        globalGroups.push({
          title: g.admin!.group,
          items: [
            {
              title: g.slug,
              url: `${config.basePath}/${g.slug}`,
              slug: g.slug,
            },
          ],
        });
      } else {
        globalGroups[index].items.push({
          title: g.slug,
          url: `${config.basePath}/${g.slug}`,
          slug: g.slug,
        });
      }
    });

    return {
      collections,
      collectionGroups,
      globals,
      globalGroups,
    };
  }, [config.collections, config.auth?.collections, config.media?.collections, config.globals, config.basePath, permissionContext]);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader> */}
      {/*   <TeamSwitcher teams={data.teams} /> */}
      {/* </SidebarHeader> */}
      <SidebarContent>
        <div data-tour="sidebar-collections">
          <NavSection title="Collections" items={nav.collectionGroups} />
        </div>
        {(!config.admin.sidebar.hideGlobals || config.globals.length > 0) && (
          <NavSection title="Globals" items={nav.globalGroups} />
        )}
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <div data-tour="user-menu">
            <NavUser user={user} onImpersonate={onImpersonate} impersonatableUsers={impersonatableUsers} />
          </div>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}

// const data = {
//   user: {
//     name: "shadcn",
//     email: "m@example.com",
//     avatar: "/avatars/shadcn.jpg",
//   },
//   teams: [
//     {
//       name: "Acme Inc",
//       logo: <GalleryVerticalEndIcon />,
//       plan: "Enterprise",
//     },
//     {
//       name: "Acme Corp.",
//       logo: <AudioLinesIcon />,
//       plan: "Startup",
//     },
//     {
//       name: "Evil Corp.",
//       logo: <TerminalIcon />,
//       plan: "Free",
//     },
//   ],
//   navMain: [
//     {
//       title: "Playground",
//       url: "#",
//       icon: <TerminalSquareIcon />,
//       isActive: true,
//       items: [
//         {
//           title: "History",
//           url: "#",
//         },
//         {
//           title: "Starred",
//           url: "#",
//         },
//         {
//           title: "Settings",
//           url: "#",
//         },
//       ],
//     },
//     {
//       title: "Models",
//       url: "#",
//       icon: <BotIcon />,
//       items: [
//         {
//           title: "Genesis",
//           url: "#",
//         },
//         {
//           title: "Explorer",
//           url: "#",
//         },
//         {
//           title: "Quantum",
//           url: "#",
//         },
//       ],
//     },
//     {
//       title: "Documentation",
//       url: "#",
//       icon: <BookOpenIcon />,
//       items: [
//         {
//           title: "Introduction",
//           url: "#",
//         },
//         {
//           title: "Get Started",
//           url: "#",
//         },
//         {
//           title: "Tutorials",
//           url: "#",
//         },
//         {
//           title: "Changelog",
//           url: "#",
//         },
//       ],
//     },
//     {
//       title: "Settings",
//       url: "#",
//       icon: <Settings2Icon />,
//       items: [
//         {
//           title: "General",
//           url: "#",
//         },
//         {
//           title: "Team",
//           url: "#",
//         },
//         {
//           title: "Billing",
//           url: "#",
//         },
//         {
//           title: "Limits",
//           url: "#",
//         },
//       ],
//     },
//   ],
//   projects: [
//     {
//       name: "Design Engineering",
//       url: "#",
//       icon: <FrameIcon />,
//     },
//     {
//       name: "Sales & Marketing",
//       url: "#",
//       icon: <PieChartIcon />,
//     },
//     {
//       name: "Travel",
//       url: "#",
//       icon: <MapIcon />,
//     },
//   ],
// };

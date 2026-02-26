"use client";

import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser, NavUserData } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@vexcms/ui";
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
} from "lucide-react";
import { VexConfig } from "@vexcms/core";
import { ComponentProps, ReactNode, useMemo } from "react";

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

export function AppSidebar({
  config,
  user,
  ...props
}: { config: VexConfig; user?: NavUserData } & ComponentProps<typeof Sidebar>) {
  const nav = useMemo(() => {
    const collections: CollectionNavItem[] = config.collections
      .filter((c) => !c.config.admin?.group)
      .map((c) => ({
        title: c.config.fields[c.config.admin?.useAsTitle ?? c.slug],
        url: `${config.basePath}/${c.slug}`,
        slug: c.slug,
      }));

    const collectionGroups: CollectionNavGroup[] = [];
    config.collections.forEach((c) => {
      if (!c.config.admin?.group) return;
      const index = collectionGroups.findIndex(
        (cg) => cg.title === c.config.admin!.group,
      );
      if (index < 0) {
        collectionGroups.push({
          title: c.config.admin!.group,
          items: [
            {
              title: c.slug,
              url: `${config.basePath}/${c.slug}`,
              slug: c.slug,
            },
          ],
        });
      } else {
        collectionGroups[index].items.push({
          title: c.slug,
          url: `${config.basePath}/${c.slug}`,
          slug: c.slug,
        });
      }
    });
    return {
      collections,
      groups: collectionGroups,
    };
  }, [config.collections]);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader> */}
      {/*   <TeamSwitcher teams={data.teams} /> */}
      {/* </SidebarHeader> */}
      <SidebarContent>
        <NavMain items={nav.groups} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} />
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

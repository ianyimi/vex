"use client";

import { CRUD_ACTIONS, hasPermission, PERMISSION_SCOPES } from "@vexcms/core";
import { useVexAuth } from "../auth";
import { useVexAccess } from "../config";
import { useVexConfig } from "../config/VexConfigContext";
import { adminHref } from "../admin/adminHref";
import { AdminCardSection } from "../admin/AdminCardSection";
import { AdminIndexEmptyState } from "../admin/AdminIndexEmptyState";

/**
 * Landing page listing every READABLE configured global as a clickable card, at
 * `/admin/globals`.
 *
 * Permission-filtered via `hasPermission` (`read`, `scope: "any"`) — the SAME check
 * `DashboardView`'s own Globals section already runs, now ALSO run here directly
 * (developer-reported: this page used to render every configured global unconditionally,
 * relying entirely on the sidebar/dashboard never linking to one the caller couldn't
 * read — not a real boundary, since the route itself is reachable directly by URL for
 * any caller, including an anonymous one via `anonRole`). Card markup is shared with
 * `DashboardView`/`CollectionsIndexView` via `AdminCardSection`.
 *
 * Each card links to `/admin/globals/{slug}` for that global's edit view.
 *
 * @returns The grid of global cards.
 */
export function GlobalsListView() {
  const config = useVexConfig();
  const access = useVexAccess();
  const { user, organization } = useVexAuth();

  const globals = config.globals.filter((g) =>
    hasPermission({
      access,
      user,
      organization,
      resource: g.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );

  return (
    <div className="relative">
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-2xl font-bold">Globals</h1>
        </div>
      </div>

      {globals.length === 0 ? (
        <AdminIndexEmptyState
          title="No globals available"
          detail="You don't have read access to any global yet."
        />
      ) : (
        <AdminCardSection
          title="Globals"
          headingClassName="sr-only"
          items={globals}
          resolveItem={(global) => ({
            key: global.slug,
            href: adminHref({ type: "global", slug: global.slug }, config.basePath),
            title: global.label,
            description: "Edit Global",
            icon: global.admin.icon,
          })}
        />
      )}
    </div>
  );
}

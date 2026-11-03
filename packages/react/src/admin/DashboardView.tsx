"use client";

import { CRUD_ACTIONS, hasPermission, PERMISSION_SCOPES } from "@vexcms/core";
import { useVexAuth } from "../auth";
import { useVexAccess } from "../config";
import { useVexConfig } from "../config/VexConfigContext";
import { adminHref } from "./adminHref";
import { AdminCardSection } from "./AdminCardSection";

/**
 * Admin dashboard content component.
 *
 * Renders a card grid with one card per registered VexCMS collection, media collection,
 * and global, each permission-filtered via `hasPermission` (`read`, `scope: "any"`) — a
 * caller never sees a card for something they can't read at all, row-level filtering
 * happening separately once they're inside. Section markup (`AdminCardSection`) is
 * shared with `GlobalsListView` and `CollectionsIndexView`, the collections-only and
 * globals-only index pages at `/admin/collections` and `/admin/globals`.
 *
 * This component renders the *content area only* — it does not include the
 * sidebar or layout shell. `VexAdminPage` in `@vexcms/next` wraps it with
 * `AdminLayout`.
 *
 * @returns <DashboardView />
 *
 * @example
 * ```tsx
 * <DashboardView />
 * ```
 */
export function DashboardView() {
  const config = useVexConfig();
  const access = useVexAccess();
  const { user, organization } = useVexAuth();

  const collections = config.collections.filter((c) =>
    hasPermission({
      access,
      user,
      organization,
      resource: c.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );

  const mediaCollections = config.mediaCollections.filter((mc) =>
    hasPermission({
      access,
      user,
      organization,
      resource: mc.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );

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
    <div>
      <h1 className="pt-4 pb-2 text-2xl font-bold">Dashboard</h1>
      <AdminCardSection
        title="Collections"
        headingClassName="px-4 pb-2 text-center font-semibold"
        items={collections}
        resolveItem={(collection) => ({
          key: collection.slug,
          href: adminHref({ type: "collection", slug: collection.slug }, config.basePath),
          title: collection.labels.plural,
          description: `Manage ${collection.labels.plural.toLowerCase()}`,
          icon: collection.admin.icon,
        })}
      />
      <AdminCardSection
        title="Media"
        headingClassName="p-4 pb-2 text-center font-semibold"
        items={mediaCollections}
        resolveItem={(collection) => ({
          key: collection.slug,
          href: adminHref({ type: "collection", slug: collection.slug }, config.basePath),
          title: collection.labels.plural,
          description: `Manage ${collection.labels.plural.toLowerCase()}`,
          icon: collection.admin.icon,
        })}
      />
      <AdminCardSection
        title="Globals"
        headingClassName="p-4 pb-2 text-center font-semibold"
        items={globals}
        resolveItem={(global) => ({
          key: global.slug,
          href: adminHref({ type: "global", slug: global.slug }, config.basePath),
          title: global.label,
          description: `Manage ${global.label.toLowerCase()}`,
          icon: global.admin.icon,
        })}
      />
    </div>
  );
}

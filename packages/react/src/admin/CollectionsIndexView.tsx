"use client";

import { CRUD_ACTIONS, hasPermission, PERMISSION_SCOPES } from "@vexcms/core";
import { useVexAuth } from "../auth";
import { useVexAccess } from "../config";
import { useVexConfig } from "../config/VexConfigContext";
import { adminHref } from "./adminHref";
import { AdminCardSection } from "./AdminCardSection";
import { AdminIndexEmptyState } from "./AdminIndexEmptyState";

/**
 * Landing page listing every READABLE registered collection (and media collection) as a
 * clickable card, at `/admin/collections` — the SAME Collections/Media sections
 * `DashboardView` already renders, without its own Globals section, for a caller who
 * wants just the collections index (e.g. from a "Collections" breadcrumb/sidebar
 * heading, or directly by URL).
 *
 * Permission-filtered via `hasPermission` (`read`, `scope: "any"`) — the identical check
 * `DashboardView`'s own Collections/Media sections run, so an anonymous caller (via
 * `anonRole`) sees only what their role can read here too, same as everywhere else.
 * Section markup is shared with `DashboardView`/`GlobalsListView` via
 * `AdminCardSection`.
 *
 * This component renders the *content area only* — `NextAdminPage` wraps it with the
 * admin shell, the same way it wraps `DashboardView`/`GlobalsListView`.
 *
 * @returns The grid of collection and media-collection cards.
 *
 * @example
 * ```tsx
 * <CollectionsIndexView />
 * ```
 */
export function CollectionsIndexView() {
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

  return (
    <div>
      <h1 className="pt-4 pb-2 text-2xl font-bold">Collections</h1>
      {collections.length === 0 && mediaCollections.length === 0 ? (
        <AdminIndexEmptyState
          title="No collections available"
          detail="You don't have read access to any collection yet."
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

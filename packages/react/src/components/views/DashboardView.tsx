"use client";

import { CRUD_ACTIONS, hasPermission, PERMISSION_SCOPES, type DashboardProps } from "@vexcms/core";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useVexAuth } from "../../context";
import { useVexAccess } from "../../context";
import { Activity } from "react";

/**
 * Admin dashboard content component.
 *
 * Renders a card grid with one card per registered VexCMS collection.
 * Each card links to the collection's list view at `/admin/:slug`.
 *
 * This component renders the *content area only* — it does not include the
 * sidebar or layout shell. `VexAdminPage` in `@vexcms/next` wraps it with
 * `AdminLayout`.
 *
 * @param props - Dashboard props
 * @param props.config - The full resolved VexCMS configuration
 * @returns <DashboardView config={vexConfig} />
 *
 * @example
 * ```tsx
 * <DashboardView config={vexConfig} />
 * ```
 */
export function DashboardView(props: DashboardProps) {
  const access = useVexAccess();
  const { user, organization } = useVexAuth();

  const collections = props.config.collections.filter((c) =>
    hasPermission({
      access,
      user,
      organization,
      resource: c.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );

  const mediaCollections = props.config.mediaCollections.filter((mc) =>
    hasPermission({
      access,
      user,
      organization,
      resource: mc.slug,
      action: CRUD_ACTIONS.read,
      scope: PERMISSION_SCOPES.any,
    }),
  );

  const globals = props.config.globals.filter((g) =>
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
      <Activity mode={collections.length > 0 ? "visible" : "hidden"}>
        <h2 className="px-4 pb-2 text-center font-semibold">Collections</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <a key={collection.slug} href={`/admin/${collection.slug}`} className="group block">
              <Card className="cursor-pointer transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <CardTitle>{collection.labels.plural}</CardTitle>
                  <CardDescription>Manage {collection.labels.plural.toLowerCase()}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      </Activity>
      <Activity mode={mediaCollections.length > 0 ? "visible" : "hidden"}>
        <h2 className="p-4 pb-2 text-center font-semibold">Media</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mediaCollections.map((collection) => (
            <a key={collection.slug} href={`/admin/${collection.slug}`} className="group block">
              <Card className="cursor-pointer transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <CardTitle>{collection.labels.plural}</CardTitle>
                  <CardDescription>Manage {collection.labels.plural.toLowerCase()}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      </Activity>
      <Activity mode={globals.length > 0 ? "visible" : "hidden"}>
        <h2 className="p-4 pb-2 text-center font-semibold">Globals</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.config.globals.map((global) => (
            <a key={global.slug} href={`/admin/globals/${global.slug}`} className="group block">
              <Card className="cursor-pointer transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <CardTitle>{global.label}</CardTitle>
                  <CardDescription>Manage {global.label.toLowerCase()}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      </Activity>
    </div>
  );
}

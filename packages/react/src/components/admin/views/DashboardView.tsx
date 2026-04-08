"use client";

import type { DashboardProps } from "@vexcms/core";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";

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
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {props.config.collections.map((collection) => (
          <a
            key={collection.slug}
            href={`/admin/${collection.slug}`}
            className="block group"
          >
            <Card className="transition-shadow group-hover:shadow-md cursor-pointer">
              <CardHeader>
                <CardTitle>{collection.labels.plural}</CardTitle>
                <CardDescription>
                  Manage {collection.labels.plural.toLowerCase()}
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}

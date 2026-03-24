"use client";

import Link from "next/link";
import type { ClientVexConfig } from "@vexcms/core";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";

interface DashboardViewProps {
  config: ClientVexConfig;
  initialCounts?: Record<string, number>;
}

function CollectionCard({ collection, basePath, initialCount }: {
  collection: ClientVexConfig["collections"][number];
  basePath: string;
  initialCount?: number;
}) {
  const countQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.countDocuments, {
      collectionSlug: collection.slug,
    }),
    initialData: initialCount,
  });

  const count = countQuery.data as number | undefined;
  const label =
    collection.labels?.plural ??
    collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1);

  return (
    <Link
      href={`${basePath}/${collection.slug}`}
      className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
    >
      <h2 className="font-semibold">{label}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {count !== undefined
          ? `${count} ${count === 1 ? "document" : "documents"}`
          : "Loading..."}
      </p>
    </Link>
  );
}

export function DashboardView({ config, initialCounts }: DashboardViewProps) {
  const basePath = config.basePath ?? "/admin";

  // Combine user collections + media collections
  const allCollections = [
    ...config.collections,
    ...(config.media?.collections ?? []),
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome to Vex CMS</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allCollections.map((collection) => (
          <CollectionCard
            key={collection.slug}
            collection={collection}
            basePath={basePath}
            initialCount={initialCounts?.[collection.slug]}
          />
        ))}
      </div>
    </div>
  );
}

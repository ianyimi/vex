"use client";

import type { VexConfig } from "@vexcms/core";
import { DashboardView } from "../views/DashboardView";
import { NotFoundView } from "../views/NotFoundView";

interface AdminPageProps {
  config: VexConfig;
  path?: string[];
}

export function AdminPage({ config, path = [] }: AdminPageProps) {
  const [collectionSlug, documentId] = path;

  // Dashboard
  if (!collectionSlug) {
    return <DashboardView config={config} />;
  }

  // Find collection
  const collection = config.collections.find((c) => c.slug === collectionSlug);
  if (!collection) {
    return <NotFoundView />;
  }

  // TODO: Implement collection list and document edit views
  // For now, show a placeholder
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        {collection.config.labels?.plural ?? collection.slug}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {documentId
          ? `Editing document: ${documentId}`
          : "Collection list view coming soon"}
      </p>
    </div>
  );
}

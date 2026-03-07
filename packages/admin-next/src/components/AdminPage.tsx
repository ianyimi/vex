"use client";

import type { VexConfig } from "@vexcms/core";
import { DashboardView } from "../views/DashboardView";
import { NotFoundView } from "../views/NotFoundView";
import CollectionsView from "../views/CollectionsView";
import CollectionEditView from "../views/CollectionEditView";

interface AdminPageProps {
  config: VexConfig;
  path?: string[];
}

export function AdminPage({ config, path = [] }: AdminPageProps) {
  const [collectionSlug, documentID] = path;

  // Dashboard
  if (!collectionSlug) {
    return <DashboardView config={config} />;
  }

  // Find collection
  const collection = config.collections.find((c) => c.slug === collectionSlug);
  if (!collection) {
    return <NotFoundView />;
  }

  if (!documentID) {
    return <CollectionsView config={config} collection={collection} />;
  }

  return (
    <CollectionEditView
      config={config}
      collection={collection}
      documentID={documentID}
    />
  );
}

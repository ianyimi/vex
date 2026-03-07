"use client";

import type { VexConfig, AnyVexCollection } from "@vexcms/core";
import { mergeAuthCollectionWithUserCollection } from "@vexcms/core";
import { DashboardView } from "../views/DashboardView";
import { NotFoundView } from "../views/NotFoundView";
import CollectionsView from "../views/CollectionsView";
import CollectionEditView from "../views/CollectionEditView";

/**
 * Resolves a collection by slug, merging auth fields when the slug
 * matches both a user-defined collection and an auth collection.
 * If only an auth collection exists (no user override), returns it as-is.
 */
function resolveCollection(
  config: VexConfig,
  slug: string,
): AnyVexCollection | undefined {
  const userCollection = config.collections.find((c) => c.slug === slug);
  const authCollection = config.auth?.collections.find((c) => c.slug === slug);

  if (userCollection && authCollection) {
    // Merge: auth fields + user admin config
    const merged = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection,
    });
    return {
      slug: userCollection.slug,
      config: {
        ...userCollection.config,
        fields: merged.fields,
      },
    } as AnyVexCollection;
  }

  // Auth-only collection (no user override)
  if (authCollection) {
    return authCollection;
  }

  // User-only collection (no auth involvement)
  return userCollection;
}

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

  // Find collection (merges auth + user fields when applicable)
  const collection = resolveCollection(config, collectionSlug);
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

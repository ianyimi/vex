"use client";

import React, { Suspense } from "react";
import type { ClientVexConfig, VexCollection } from "@vexcms/core";
import { mergeAuthCollectionWithUserCollection, isMediaCollection } from "@vexcms/core";
import { DashboardView } from "../views/DashboardView";
import { NotFoundView } from "../views/NotFoundView";
import CollectionsView from "../views/CollectionsView";
import CollectionEditView from "../views/CollectionEditView";
import MediaCollectionsView from "../views/MediaCollectionsView";
import MediaCollectionEditView from "../views/MediaCollectionEditView";

/**
 * Resolves a collection by slug, merging auth fields when the slug
 * matches both a user-defined collection and an auth collection.
 * If only an auth collection exists (no user override), returns it as-is.
 */
function resolveCollection(
  config: ClientVexConfig,
  slug: string,
): VexCollection | undefined {
  const userCollection = config.collections.find((c) => c.slug === slug);
  const authCollection = config.auth?.collections.find((c) => c.slug === slug);

  if (userCollection && authCollection) {
    const merged = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection,
    });
    return {
      ...userCollection,
      fields: merged.fields,
    } as VexCollection;
  }

  if (authCollection) {
    return authCollection;
  }

  const mediaCollection = config.media?.collections.find((c) => c.slug === slug);
  if (mediaCollection) {
    return mediaCollection;
  }

  return userCollection;
}

interface AdminPageProps {
  config: ClientVexConfig;
  path?: string[];
  /** Custom renderer for richtext fields in edit forms. */
  renderRichTextField?: (props: Record<string, any>) => React.ReactNode;
  /** Map of collection slug → { url } for collections with function-based preview URLs */
  livePreviewConfigs?: Record<string, { url: (doc: { _id: string; [key: string]: any }) => string }>;
}

export function AdminPage({ config, path = [], renderRichTextField, livePreviewConfigs }: AdminPageProps) {
  const [collectionSlug, documentID] = path;

  if (!collectionSlug) {
    return <DashboardView config={config} />;
  }

  const collection = resolveCollection(config, collectionSlug);
  if (!collection) {
    return <NotFoundView />;
  }

  const isMedia = isMediaCollection({ collection, config });

  if (!documentID) {
    if (isMedia) {
      return (
        <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
          <MediaCollectionsView config={config} collection={collection} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
        <CollectionsView config={config} collection={collection} />
      </Suspense>
    );
  }

  if (isMedia) {
    return (
      <MediaCollectionEditView
        key={documentID}
        config={config}
        collection={collection}
        documentID={documentID}
      />
    );
  }

  return (
    <CollectionEditView
      key={documentID}
      config={config}
      collection={collection}
      documentID={documentID}
      renderRichTextField={renderRichTextField}
      livePreviewConfigs={livePreviewConfigs}
    />
  );
}

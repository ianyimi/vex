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
import GlobalEditView from "../views/GlobalEditView";

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

export interface AdminInitialData {
  /** Prefetched document for edit views */
  document?: Record<string, unknown> | null;
  /** Prefetched global document */
  globalDocument?: Record<string, unknown> | null;
  /** Prefetched collection counts for dashboard — keyed by collection slug */
  counts?: Record<string, number>;
  /** Prefetched count for a single collection list view */
  count?: number;
}

interface AdminPageProps {
  config: ClientVexConfig;
  path?: string[];
  /** Custom renderer for richtext fields in edit forms. */
  renderRichTextField?: (props: Record<string, any>) => React.ReactNode;
  /** Map of collection slug → { url } for collections with function-based preview URLs */
  livePreviewConfigs?: Record<string, { url: (doc: { _id: string; [key: string]: any }) => string }>;
  /** Server-prefetched data to pass as initialData to views */
  initialData?: AdminInitialData;
}

export function AdminPage({ config, path = [], renderRichTextField, livePreviewConfigs, initialData }: AdminPageProps) {
  const [collectionSlug, documentID] = path;

  if (!collectionSlug) {
    return <DashboardView config={config} initialCounts={initialData?.counts} />;
  }

  // Check if this is a global
  const global = config.globals?.find((g) => g.slug === collectionSlug);
  if (global) {
    const globalAsCollection = {
      ...global,
      labels: { singular: global.label ?? global.slug, plural: global.label ?? global.slug },
    } as unknown as VexCollection;

    if (documentID) {
      // Direct link to the global's document
      return (
        <CollectionEditView
          key={documentID}
          config={config}
          collection={globalAsCollection}
          documentID={documentID}
          renderRichTextField={renderRichTextField}
          initialData={initialData?.document}
        />
      );
    }

    // No document ID — auto-resolve the single document
    return (
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
        <GlobalEditView config={config} collection={globalAsCollection} renderRichTextField={renderRichTextField} initialData={initialData?.globalDocument} />
      </Suspense>
    );
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
          <MediaCollectionsView config={config} collection={collection} initialCount={initialData?.count} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
        <CollectionsView config={config} collection={collection} renderRichTextField={renderRichTextField} initialCount={initialData?.count} />
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
        initialData={initialData?.document}
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
      initialData={initialData?.document}
    />
  );
}

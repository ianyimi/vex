"use client";

import type { VexCollection, ClientVexConfig } from "@vexcms/core";
import { useQuery, useMutation } from "convex/react";
import { anyApi } from "convex/server";
import CollectionEditView from "./CollectionEditView";

interface GlobalEditViewProps {
  config: ClientVexConfig;
  collection: VexCollection;
  renderRichTextField?: (props: Record<string, any>) => React.ReactNode;
}

/**
 * GlobalEditView — automatically finds or creates the single document
 * for a global, then renders the CollectionEditView for it.
 */
export default function GlobalEditView({ config, collection, renderRichTextField }: GlobalEditViewProps) {
  const slug = collection.slug;

  // Use globals.get to fetch the single document
  const doc = useQuery(anyApi.vex.globals?.get, {
    globalSlug: slug,
  }) as Record<string, unknown> | null | undefined;

  const createDocument = useMutation(anyApi.vex.collections.createDocument);

  // Still loading
  if (doc === undefined) {
    return (
      <div className="p-6 text-muted-foreground">Loading...</div>
    );
  }

  // No document exists yet — prompt to create
  if (doc === null) {
    return (
      <GlobalCreatePrompt
        collection={collection}
        onCreate={async () => {
          await createDocument({
            collectionSlug: slug,
            fields: {},
          });
        }}
      />
    );
  }

  // Render the edit view for the single document
  return (
    <CollectionEditView
      key={doc._id as string}
      config={config}
      collection={collection}
      documentID={doc._id as string}
      renderRichTextField={renderRichTextField}
    />
  );
}

function GlobalCreatePrompt({ collection, onCreate }: {
  collection: VexCollection;
  onCreate: () => Promise<void>;
}) {
  const label = collection.labels?.singular ?? collection.slug;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="text-sm text-muted-foreground">
        This global has not been initialized yet.
      </p>
      <button
        onClick={onCreate}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Initialize {label}
      </button>
    </div>
  );
}

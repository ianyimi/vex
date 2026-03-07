"use client";

import { useMemo, useState } from "react";
import type { AnyVexCollection, VexConfig, VexField } from "@vexcms/core";
import { generateFormSchema } from "@vexcms/core";
import { AppForm, type FieldEntry } from "@vexcms/ui";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";

export default function CollectionEditView({
  config,
  collection,
  documentID,
}: {
  config: VexConfig;
  collection: AnyVexCollection;
  documentID: string;
}) {
  // Fetch the document reactively
  const documentQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.getDocument, {
      collectionSlug: collection.slug,
      documentId: documentID,
    }),
  });

  const document = documentQuery.data as Record<string, unknown> | null | undefined;

  // Set up the mutation via Convex's useMutation
  const updateDocument = useMutation(anyApi.vex.collections.updateDocument);
  const [isSaving, setIsSaving] = useState(false);

  // Generate Zod schema from collection fields
  const schema = useMemo(
    () => generateFormSchema({ fields: collection.config.fields as Record<string, VexField> }),
    [collection],
  );

  // Build field entries (excluding hidden fields)
  const fieldEntries: FieldEntry[] = useMemo(
    () =>
      Object.entries(collection.config.fields as Record<string, VexField>)
        .filter(([, field]) => !field._meta.admin?.hidden)
        .map(([name, field]) => ({ name, field })),
    [collection],
  );

  // Build default values from the fetched document
  const defaultValues = useMemo(() => {
    if (!document) return {};
    const values: Record<string, unknown> = {};
    for (const entry of fieldEntries) {
      values[entry.name] = document[entry.name];
    }
    return values;
  }, [document, fieldEntries]);

  const handleSubmit = async (changedFields: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await updateDocument({
        collectionSlug: collection.slug,
        documentId: documentID,
        fields: changedFields,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = documentQuery.isPending;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {collection.config.labels?.singular ?? collection.slug}
        </h1>
        <p className="text-sm text-muted-foreground">{documentID}</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {!isLoading && document == null && (
        <p className="text-muted-foreground">Document not found.</p>
      )}

      {!isLoading && document != null && (
        <div className="max-w-2xl" key={documentID}>
          <AppForm
            schema={schema}
            fieldEntries={fieldEntries}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}

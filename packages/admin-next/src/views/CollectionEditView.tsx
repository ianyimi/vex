"use client";

import { useMemo, useState } from "react";
import type { AnyVexCollection, VexConfig, VexField } from "@vexcms/core";
import { generateFormSchema } from "@vexcms/core";
import {
  AppForm,
  type FieldEntry,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@vexcms/ui";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import Link from "next/link";

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

  const document = documentQuery.data as
    | Record<string, unknown>
    | null
    | undefined;

  // Set up the mutation via Convex's useMutation
  const updateDocument = useMutation(anyApi.vex.collections.updateDocument);
  const [isSaving, setIsSaving] = useState(false);

  // Generate Zod schema from collection fields
  const schema = useMemo(
    () =>
      generateFormSchema({
        fields: collection.config.fields as Record<string, VexField>,
      }),
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

  const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  const documentTitle =
    useAsTitle && document
      ? (document[useAsTitle] as string | undefined)
      : undefined;
  const pluralLabel = collection.config.labels?.plural ?? collection.slug;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={config.basePath} />}>
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    <Link href={`${config.basePath}/${collection.slug}`} />
                  }
                >
                  {pluralLabel}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{documentTitle || documentID}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            type="submit"
            form="collection-edit-form"
            disabled={isSaving || fieldEntries.length === 0}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <p className="text-muted-foreground">Loading...</p>}

        {!isLoading && document == null && (
          <p className="text-muted-foreground">Document not found.</p>
        )}

        {!isLoading && document != null && (
          <div className="" key={documentID}>
            <AppForm
              formId="collection-edit-form"
              schema={schema}
              fieldEntries={fieldEntries}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import type { ColumnDef } from "@tanstack/react-table";
import type { VexAuthAdapter, VexCollection, VexField } from "../types";
import { textColumnDef } from "../fields/text/columnDef";
import { numberColumnDef } from "../fields/number/columnDef";
import { checkboxColumnDef } from "../fields/checkbox/columnDef";
import { selectColumnDef } from "../fields/select/columnDef";
import { dateColumnDef } from "../fields/date/columnDef";
import { imageUrlColumnDef } from "../fields/imageUrl/columnDef";
import { relationshipColumnDef } from "../fields/relationship/columnDef";
import { jsonColumnDef } from "../fields/json/columnDef";
import { arrayColumnDef } from "../fields/array/columnDef";
import { toTitleCase } from "../utils";

/**
 * Generates an array of ColumnDef objects from a VexCollection's field configs.
 *
 * @param props.collection - The collection to generate columns for
 * @param props.auth - Optional auth adapter. When provided, auth fields (e.g. createdAt)
 *   get proper columnDef dispatch instead of falling back to plain text columns.
 * @returns Array of ColumnDef objects for use with @tanstack/react-table
 */
export function generateColumns(props: {
  collection: VexCollection;
  auth?: VexAuthAdapter;
}): ColumnDef<Record<string, unknown>>[] {
  const { collection, auth } = props;
  const columns: ColumnDef<Record<string, unknown>>[] = [];
  const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  const defaultColumns = collection.config.admin?.defaultColumns as
    | string[]
    | undefined;
  const fields = collection.config.fields;

  // Build a lookup of auth fields for this collection's slug
  const authFields: Record<string, VexField> = {};
  if (auth) {
    const authCollection = auth.collections.find(
      (c: VexCollection) => c.slug === collection.slug,
    );
    if (authCollection) {
      for (const [k, v] of Object.entries(authCollection.config.fields) as [
        string,
        VexField,
      ][]) {
        authFields[k] = v;
      }
    }
  }

  if (defaultColumns) {
    for (const fieldKey of defaultColumns) {
      if (fieldKey === "_id") {
        columns.push({ accessorKey: "_id", header: "ID" });
        continue;
      }

      const field = (fields[fieldKey] ?? authFields[fieldKey]) as
        | VexField
        | undefined;

      if (!field) {
        columns.push({ accessorKey: fieldKey, header: toTitleCase(fieldKey) });
        continue;
      }

      if (field._meta.admin?.hidden) continue;

      let col = buildColumnDef(fieldKey, field);

      if (useAsTitle && fieldKey === useAsTitle) {
        col.meta = { ...col.meta, isTitle: true };
      }

      columns.push(col);
    }
  } else {
    columns.push({ accessorKey: "_id", header: "ID" });

    // Collect all field keys: user fields first, then auth-only fields
    const allFieldKeys = new Set(Object.keys(fields));
    for (const k of Object.keys(authFields)) {
      allFieldKeys.add(k);
    }

    for (const fieldKey of allFieldKeys) {
      const field = (fields[fieldKey] ?? authFields[fieldKey]) as VexField;
      if (field._meta.admin?.hidden) continue;

      let col = buildColumnDef(fieldKey, field);

      if (useAsTitle && fieldKey === useAsTitle) {
        col.meta = { ...col.meta, isTitle: true };
      }

      columns.push(col);
    }
  }

  return columns;
}

function buildColumnDef(
  fieldKey: string,
  field: VexField,
): ColumnDef<Record<string, unknown>> {
  switch (field._meta.type) {
    case "text":
      return textColumnDef({ fieldKey, meta: field._meta });
    case "number":
      return numberColumnDef({ fieldKey, meta: field._meta });
    case "checkbox":
      return checkboxColumnDef({ fieldKey, meta: field._meta });
    case "select":
      return selectColumnDef({ fieldKey, meta: field._meta });
    case "date":
      return dateColumnDef({ fieldKey, meta: field._meta });
    case "imageUrl":
      return imageUrlColumnDef({ fieldKey, meta: field._meta });
    case "relationship":
      return relationshipColumnDef({ fieldKey, meta: field._meta });
    case "json":
      return jsonColumnDef({ fieldKey, meta: field._meta });
    case "array":
      return arrayColumnDef({ fieldKey, meta: field._meta });
    default:
      return {
        accessorKey: fieldKey,
        header: toTitleCase(fieldKey),
      };
  }
}

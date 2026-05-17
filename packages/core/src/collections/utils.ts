import { z, type ZodType } from "zod";
import type { CollectionConfig } from "./types";
import { adminFieldToInputSchema } from "../fields";
import type { TDocument } from "../convex";

/**
 * Builds the `defaultValues` object for a TanStack Form instance from a collection.
 *
 * When `document` is provided, uses the document's field values (edit mode).
 * When omitted, falls back to each field's `defaultValue` (create mode).
 * The returned object's keys match the collection field keys.
 *
 * @param props - Input props.
 * @param props.collection - The collection whose fields define the form shape.
 * @param props.document - Optional existing document to populate values from when editing.
 * @returns A `Record<fieldKey, value>` ready to pass to `useForm({ defaultValues })`.
 *
 * @example
 * ```ts
 * // New document — uses field defaults
 * getCollectionDefaultValues({ collection: postsCollection })
 * // → { title: "", slug: "" }
 *
 * // Existing document — uses document values
 * getCollectionDefaultValues({ collection: postsCollection, document: doc })
 * // → { title: "Hello world", slug: "hello-world" }
 * ```
 */
export function getCollectionDefaultValues(props: {
  collection: CollectionConfig;
  document?: TDocument;
}) {
  const res: Record<string, unknown> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.collection.fields)) {
    if (props.document && props.document[fieldKey] !== undefined) {
      res[fieldKey] = props.document[fieldKey];
    } else {
      res[fieldKey] = fieldDef.defaultValue;
    }
  }
  return res;
}

/**
 * Builds a Zod object schema for validating all fields in a collection.
 *
 * Calls `adminFieldToInputSchema` for each field and combines the results
 * into a `z.object({...})`. Used by `useCollectionForm` as the TanStack Form
 * `onSubmitAsync` / `onBlurAsync` validator.
 *
 * @param props - Input props.
 * @param props.collection - The collection whose fields define the schema shape.
 * @returns A `z.object` schema with one key per collection field.
 *
 * @example
 * ```ts
 * const schema = getCollectionInputSchema({ collection: postsCollection })
 * // → z.object({ title: z.string().min(1), slug: z.string().min(3).max(100) })
 * schema.parse({ title: "Hello", slug: "hello" }) // passes
 * ```
 */
export function getCollectionInputSchema(props: {
  collection: CollectionConfig;
}) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.collection.fields)) {
    res[fieldKey] = adminFieldToInputSchema({ field: fieldDef });
  }
  return z.object({ ...res });
}

/**
 * Converts a collection slug to a PascalCase identifier for use in type names.
 *
 * Splits on underscores and hyphens and capitalizes each segment.
 *
 * @param props - Input props.
 * @param props.slug - The collection slug, e.g. `"blog_posts"`, `"authors"`.
 * @returns PascalCase string, e.g. `"BlogPosts"`, `"Authors"`.
 *
 * @example
 * ```ts
 * slugToPascalCase({ slug: "blog_posts" }) // → "BlogPosts"
 * slugToPascalCase({ slug: "authors" })    // → "Authors"
 */
export function slugToPascalCase(props: { slug: string }): string {
  return props.slug
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

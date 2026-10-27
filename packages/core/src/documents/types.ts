import { VERSION_SYSTEM_FIELDS, VexVersionStatus } from "../versions/constants";

/**
 * Base type for all VexCMS documents as returned from Convex queries.
 *
 * All documents include the Convex system fields `_id` and `_creationTime`,
 * plus whatever field values are defined in the collection's schema.
 *
 * Framework adapters use this as the `initialData` type in view component
 * props — the actual field values are accessed via string keys.
 *
 * @example
 * ```ts
 * const title = typeof doc.title === "string" ? doc.title : "";
 * ```
 *
 * @see {@link vexConvexApi} for the query functions that return this type
 */
export interface VexDocument {
  /** Convex document ID string. */
  _id: string;
  /** Unix timestamp (milliseconds) when the document was created. */
  _creationTime: number;
  /** Field values defined by the collection schema. */
  [key: string]: unknown;
}

/**
 * Alias for `VexDocument` that also satisfies `Record<string, unknown>`.
 *
 * Use this type when a generic `Record` index signature is required alongside
 * the Convex system fields — for example, as the `data` type in TanStack Table
 * or as the form `defaultValues` record.
 *
 * @see {@link VexDocument} for the base type
 */
export type TDocument<TShape = {}> = Record<string, unknown> & TShape & VexDocument;

/**
 * Type for versioned documents returned from Convex queries.
 *
 * Extends `VexDocument` with all required version fields: vex_status, vex_publishedId,
 * vex_publishedA. Use this instead of `TDocument` in versioned collection views to
 * avoid casting fields like `row.vex_status as string`.
 *
 * @example
 * ```ts
 * const src = doc.src; // string | undefined, no cast needed
 * const alt = doc.alt ?? "";
 * ```
 *
 * @see {@link TDocument} for the base document type with custom shape support
 */
export interface VexVersionDocument extends VexDocument {
  [VERSION_SYSTEM_FIELDS.status.slug]: VexVersionStatus;
  [VERSION_SYSTEM_FIELDS.publishedId.slug]?: string;
  [VERSION_SYSTEM_FIELDS.publishedAt.slug]?: number;
  [VERSION_SYSTEM_FIELDS.activeVersion.slug]?: number;
}

/**
 * Type for media documents returned from Convex queries.
 *
 * Extends `VexDocument` with all required media fields: alt, filename,
 * mimeType, size, storageId, deleted, src (the file URL), and optional
 * width/height. Use this instead of `TDocument` in media collection views to
 * avoid casting fields like `row.original.src as string`.
 *
 * @example
 * ```ts
 * const src = doc.src; // string | undefined, no cast needed
 * const alt = doc.alt ?? "";
 * ```
 *
 * @see {@link TDocument} for the base document type with custom shape support
 */
export interface VexMediaDocument extends VexDocument {
  /** Alt text for accessibility and SEO. */
  alt: string;
  /** Original filename of the uploaded file. */
  filename: string;
  /** MIME type (e.g., "image/jpeg", "application/pdf"). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Storage adapter ID for the uploaded file. */
  storageId: string;
  /** Whether this media item has been soft-deleted. */
  deleted: boolean;
  /** URL to the file. */
  src: string;
  /** Image width in pixels (if applicable). */
  width?: number;
  /** Image height in pixels (if applicable). */
  height?: number;
}

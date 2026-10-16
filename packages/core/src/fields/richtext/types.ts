import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";
import type { MediaCollectionSlug, VexResourceSlug } from "../../types/generated";

/**
 * A single text leaf in a {@link RichTextDocument} — the editor's smallest
 * editable unit. `text` is the leaf's literal content; any other key is a
 * mark applied to it (e.g. `bold: true`, `italic: true`) set by whichever
 * editor plugins are enabled.
 */
export interface RichTextText {
  /** The leaf's literal text content. */
  text: string;
  /** Marks applied to this leaf (bold, italic, code, …), set by editor plugins. */
  [mark: string]: unknown;
}

/**
 * A single block or inline node in a {@link RichTextDocument}. `type`
 * identifies the node kind (`"p"`, `"h1"`, `"img"`, `"a"`, `"table"`, …) and
 * `children` holds its nested nodes or text leaves. Any other key is a
 * node-specific property (e.g. an image's `url`, a link's `target`) set by
 * whichever editor plugins are enabled — narrow with a specific element
 * interface (e.g. `richtext-plate`'s `ImageElement`) to access them.
 */
export interface RichTextElement {
  /** The node kind, e.g. `"p"`, `"h1"`, `"img"`, `"a"`, `"table"`. */
  type: string;
  /** Nested nodes or text leaves. */
  children: (RichTextElement | RichTextText)[];
  /** Node-specific properties set by editor plugins. */
  [prop: string]: unknown;
}

/**
 * A complete rich text value — an ordered list of top-level
 * {@link RichTextElement} nodes. Locale-agnostic: a richtext field stores
 * exactly one `RichTextDocument`, never a per-locale map (Design Decision 1).
 * This is the `interfaceType` generated for every `richtext()` field and the
 * value type both `VexEditorComponentProps.value` and
 * `VexRenderComponentProps.content` carry.
 */
export type RichTextDocument = RichTextElement[];

/**
 * Configuration input for a `richtext()` field.
 *
 * Richtext fields store a single locale-agnostic {@link RichTextDocument} — an
 * array of block-level nodes. Shape is validated structurally on save (array of
 * `{ type, children }` elements and `{ text }` leaves, any depth); the specific
 * node catalogue (headings, links, images, tables, …) is owned by whichever
 * `editor` adapter is configured on `VexClientConfig`, never by core.
 *
 * **Defaults applied by `richtext()`:**
 * ```ts
 * {
 *   type:     "richtext",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   defaultValue: [],   // empty document
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // excerpt aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Body")
 * body: richtext()
 *
 * // Required — at least one node's plain-text excerpt must be non-empty
 * summary: richtext({ required: true })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface RichTextFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect existing database values.
   */
  /**
   * The slug of the media collection inline images upload into. Absent means
   * the richtext editor's image feature is hidden entirely — no dropzone, no
   * paste/drag-and-drop upload, no "insert image" toolbar button — rather
   * than rendering a feature that would immediately fail every upload.
   *
   * Must match a media collection declared on `defineConfig({ mediaCollections })`,
   * exactly like `upload()`'s `to`; an unknown slug throws `VexStorageConfigError`
   * at `defineConfig()` time. Unlike `to`, it is optional — a richtext field
   * without inline images is a normal, supported field.
   *
   * @example
   * ```ts
   * richtext({ label: "Body", mediaCollectionSlug: "images" })
   * ```
   */
  mediaCollectionSlug?: MediaCollectionSlug;
  defaultValue?: RichTextDocument;
  /** Server-only async validation with `value` typed as `RichTextDocument`. @see {@link FieldValidate} */
  validate?(
    props: FieldValidateProps<TCollectionSlug, RichTextDocument>,
  ): Promise<void> | void;
}

/**
 * Resolved configuration for a `richtext()` field, after all defaults are applied.
 *
 * This is the type framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<RichTextField>` and
 * `CellComponentProps<RichTextField>` is this type.
 *
 * @see {@link RichTextFieldInput} for the user-facing input type
 * @see {@link richtext} for the config function that produces this type
 */
export interface RichTextField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.richtext.type;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Defaults to `[]` — an empty document.
   */
  /** The field's configured inline-image target collection, if any. */
  mediaCollectionSlug?: MediaCollectionSlug;
  defaultValue?: RichTextDocument;
  /** Server-only async validation with `value` typed as `RichTextDocument`. @see {@link FieldValidate} */
  validate?(
    props: FieldValidateProps<TCollectionSlug, RichTextDocument>,
  ): Promise<void> | void;
}

import type { ComponentHKT, ApplyComponent } from "../components/types";
import type { RichTextDocument } from "../fields/richtext/types";
import type { MediaCollectionSlug } from "../types/generated";
import type { VexMediaDocument } from "../media";

/**
 * Props the react Input passes to a richtext editor adapter's
 * `editorComponent` for one form field.
 *
 * `mediaCollectionSlug` and the `media*`/`onMedia*`/`generateUploadUrl`/
 * `createMediaDocument` props are present only when the field declares
 * `mediaCollectionSlug` (Design Decision 6); an adapter that doesn't support
 * inline images may ignore all of them.
 */
export interface VexEditorComponentProps {
  /** The field's current value. */
  value: RichTextDocument;
  /** Called with the new value on every edit. */
  onChange: (value: RichTextDocument) => void;
  /** Whether the field is read-only (versions/preview contexts). */
  readOnly?: boolean;
  /** The field's name, used for accessibility attributes. */
  name: string;
  /**
   * The field's label — for the editor's accessible name. The host field
   * input already renders it visibly; an adapter must not render it again.
   */
  label?: string;
  /**
   * The field's description/help text. Rendered visibly by the host field
   * input; an adapter must not render it again.
   */
  description?: string;
  /** Placeholder text shown when the document is empty. */
  placeholder?: string;
  /** The field's configured inline-image target collection, if any. */
  mediaCollectionSlug?: MediaCollectionSlug;
  /**
   * Whether the media collection's `alt` field is required — the adapter's
   * upload UI should enforce it before creating the document, exactly as the
   * upload field's own form does.
   */
  mediaAltRequired?: boolean;
  /** Search results from the media collection, for the image picker. */
  mediaResults?: VexMediaDocument[];
  /** The image picker's current search term. */
  mediaSearchTerm?: string;
  /** Called when the image picker's search term changes. */
  onMediaSearchChange?: (term: string) => void;
  /** Whether the image picker has more results to page in. */
  mediaCanLoadMore?: boolean;
  /** Called when the image picker should load its next page of results. */
  onMediaLoadMore?: () => void;
  /** Whether the image picker's search results are loading. */
  mediaIsLoading?: boolean;
  /** Called when the user chooses to upload a new file instead of picking one. */
  onUploadNew?: () => void;
  /** Mints a presigned upload URL for a new file, resolving to that URL. */
  generateUploadUrl?: () => Promise<string>;
  /**
   * Creates the uploaded file's media document, resolving to its id and —
   * when the storage adapter resolves one synchronously at doc-creation
   * time (the Convex adapter does, via `ctx.storage.getUrl()`) — its
   * stored URL. An adapter without a synchronous URL omits it; callers
   * fall back to a temporary local URL only as a last resort.
   */
  createMediaDocument?: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<{ mediaId: string; url?: string }>;
}

/**
 * Props a richtext editor adapter's `renderComponent` receives to render a
 * stored value outside the editor (front-end pages, read-only cells).
 */
export interface VexRenderComponentProps {
  /** The document to render. */
  content: RichTextDocument;
  /** Optional wrapper class name. */
  className?: string;
  /**
   * Resolves a media id referenced by an inline image node to its stored
   * URL. Omit to render whatever `url` is already embedded in the node.
   */
  resolveMedia?: (mediaId: string) => Promise<string | undefined>;
}

/**
 * A pluggable rich text editor backend, set as `editor:` on
 * `VexClientConfigInput` (ADR-013). `type` identifies the adapter
 * (`"plate"`); `editorComponent` renders the interactive form field;
 * `renderComponent` renders a stored value read-only. Resolved against a
 * concrete `ComponentHKT` (`ReactHKT` in `@vexcms/react`) the same way
 * `RelationshipFieldAdminInput.components.preview` resolves its component
 * slot.
 */
export interface VexEditorAdapter<
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** Identifies the adapter, e.g. `"plate"`. */
  type: string;
  /** Renders the interactive editor for one form field. */
  editorComponent: ApplyComponent<TComponent, VexEditorComponentProps>;
  /** Renders a stored value read-only. */
  renderComponent: ApplyComponent<TComponent, VexRenderComponentProps>;
}

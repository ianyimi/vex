import type { ComponentType } from "react";

/**
 * A rich text document is an array of Slate/Plate element nodes.
 * This is the canonical type for all rich text content stored in VEX.
 *
 * Each element has a `type` (e.g., "p", "h1", "img") and `children`
 * (nested elements or text nodes with formatting marks).
 *
 * @example
 * ```ts
 * const doc: RichTextDocument = [
 *   { type: "h1", children: [{ text: "Hello" }] },
 *   { type: "p", children: [{ text: "World", bold: true }] },
 * ];
 * ```
 */
export type RichTextDocument = RichTextElement[];

/** A single element node in a rich text document. */
export interface RichTextElement {
  /** Node type identifier (e.g., "p", "h1", "img", "table") */
  type: string;
  /** Child nodes — nested elements or text leaves */
  children: (RichTextElement | RichTextText)[];
  /** URL for link/image elements */
  url?: string;
  /** Alt text for image elements */
  alt?: string;
  /** Media collection document ID for image elements (ID-based resolution) */
  mediaId?: string;
  /** Additional node-specific properties (alignment, colspan, etc.) */
  [key: string]: unknown;
}

/** A text leaf node with optional formatting marks. */
export interface RichTextText {
  /** The text content */
  text: string;
  /** Bold formatting */
  bold?: boolean;
  /** Italic formatting */
  italic?: boolean;
  /** Underline formatting */
  underline?: boolean;
  /** Strikethrough formatting */
  strikethrough?: boolean;
  /** Inline code formatting */
  code?: boolean;
}

/**
 * Adapter interface for rich text editors.
 * Allows swapping Plate for Tiptap, Lexical, or any custom editor.
 *
 * Implement this interface and pass it to `defineConfig({ editor: ... })`
 * or to individual `richtext({ editor: ... })` fields.
 *
 * @example
 * ```ts
 * // Using the built-in Plate adapter
 * import { plateEditor } from "@vexcms/richtext/editor"
 * defineConfig({ editor: plateEditor() })
 *
 * // Building a custom adapter
 * const myAdapter: VexEditorAdapter = {
 *   type: "custom",
 *   editorComponent: MyEditorComponent,
 *   renderComponent: MyRenderComponent,
 * }
 * ```
 */
export interface VexEditorAdapter {
  /**
   * Unique identifier for this editor adapter (e.g., "plate", "tiptap", "lexical").
   * Used for debugging and distinguishing between different editor implementations.
   */
  type: string;

  /**
   * React component that renders the editor in the admin form.
   *
   * Receives the current `RichTextDocument` value and an `onChange` callback.
   * Must support `readOnly` mode for document preview.
   * The component manages its own internal editor state and calls `onChange`
   * when the user makes edits.
   */
  editorComponent: ComponentType<VexEditorComponentProps>;

  /**
   * React component that renders rich text content on the frontend.
   *
   * Receives the stored `RichTextDocument` and renders it as React elements.
   * Must be safe for server-side rendering (no browser APIs).
   * Optionally supports `resolveMedia` for image URL resolution.
   */
  renderComponent: ComponentType<VexRenderComponentProps>;
}

/**
 * Props passed to the editor component in the admin form.
 */
export interface VexEditorComponentProps {
  /**
   * Current editor value as a `RichTextDocument` (Slate/Plate JSON array).
   * May be `null` or empty array `[]` for new documents.
   */
  value: RichTextDocument | null;
  /**
   * Callback to update the editor value.
   * Called whenever the user makes edits. The new value replaces the old one entirely.
   */
  onChange: (value: RichTextDocument) => void;
  /**
   * Whether the field is read-only (e.g., user lacks update permission).
   * When true, hide the toolbar and disable editing.
   * @default false
   */
  readOnly?: boolean;
  /** Placeholder text shown when the editor is empty. */
  placeholder?: string;
  /** Field label rendered above the editor. */
  label?: string;
  /** Helper text rendered below the editor. */
  description?: string;
  /** Field name (key) — used for form binding and accessibility. */
  name: string;
  /**
   * Media collection slug for image uploads.
   * When set, the editor can pick images from the specified media collection.
   * When not set, only URL input and direct file upload are available.
   */
  mediaCollection?: string;
}

/**
 * Props passed to the render component on the frontend.
 *
 * @example
 * ```tsx
 * import { RichText } from "@vexcms/richtext/render"
 *
 * <RichText content={document.content} className="prose" />
 *
 * // With media ID resolution
 * <RichText
 *   content={document.content}
 *   resolveMedia={async (id) => getMediaUrl(id)}
 * />
 * ```
 */
export interface VexRenderComponentProps {
  /**
   * The stored rich text content as a `RichTextDocument` (Slate/Plate JSON array).
   * Pass `null` or `[]` for empty content — the component will render nothing.
   */
  content: RichTextDocument | null;
  /**
   * Optional async resolver for media IDs → URLs.
   * When provided, image nodes with a `mediaId` property will have their
   * `url` resolved by calling this function before rendering.
   *
   * @param mediaId - The media collection document ID from the image node
   * @returns The resolved URL, or `null` if the media could not be found
   */
  resolveMedia?: (mediaId: string) => Promise<string | null>;
  /**
   * CSS class name applied to the root element.
   * Useful for applying prose styles (e.g., Tailwind's `prose` class).
   */
  className?: string;
}

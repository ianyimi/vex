/**
 * A feature that can be enabled in the rich text editor.
 * Features map to Plate plugins and UI components.
 */
export interface VexEditorFeature {
  /** Unique key for this feature (e.g., "bold", "heading", "table") */
  key: string;
  /** Human-readable label for feature discovery */
  label: string;
  /** Plate plugins this feature enables. */
  plugins: string[];
}

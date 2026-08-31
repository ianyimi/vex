import { TDocument, type CellComponentProps, type ColorField } from "@vexcms/core";

/**
 * Colour field cell component for the data-table list view.
 *
 * Renders a swatch beside the stored value. `backgroundColor` is set from the
 * raw value, so a `var(--token)` reference resolves through CSS and the swatch
 * follows the active colour scheme for free.
 *
 * @param props - Component props.
 * @param props.value - Raw colour value from the document — hex or `var(--token)`.
 * @returns The cell component for this field type, or `null` for an empty value.
 *
 * @example
 * ```tsx
 * <ColorFieldCell value={doc.primaryLight} fieldDef={primaryLightField} row={row} isTitleField={false} />
 * ```
 */
export function ColorFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<ColorField, TData>,
) {
  if (!props.value) return null;
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded border border-border"
        style={{ backgroundColor: props.value }}
      />
      <span className="font-mono text-xs">{props.value}</span>
    </span>
  );
}
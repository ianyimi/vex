import {
  addLeadingSlash,
  TDocument,
  type CellComponentProps,
  type ColorField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Colour field cell component for the data-table list view.
 *
 * Renders a swatch beside the stored value. `backgroundColor` is set from the
 * raw value, so a `var(--token)` reference resolves through CSS and the swatch
 * follows the active colour scheme for free. Null, undefined, and empty values
 * show an em-dash placeholder.
 *
 * @param props - Component props.
 * @param props.value - Raw colour value from the document — hex or `var(--token)`.
 * @param props.isTitleField - When `true`, wraps the swatch in an edit-page link.
 * @returns The cell component for this field type, or an em-dash placeholder for an empty value.
 *
 * @example
 * ```tsx
 * <ColorFieldCell value={doc.primaryLight} fieldDef={primaryLightField} row={row} isTitleField={false} />
 * ```
 */
export function ColorFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<ColorField, TData>,
) {
  if (props.value === undefined || props.value === null || props.value === "") return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const content = (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded border border-border"
        style={{ backgroundColor: props.value }}
      />
      <span className="font-mono text-xs">{props.value}</span>
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
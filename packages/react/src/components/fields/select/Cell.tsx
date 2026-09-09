import {
  addLeadingSlash,
  TDocument,
  type CellComponentProps,
  type SelectField,
} from "@vexcms/core";
import { Badge, VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Select field cell component for the data-table list view.
 *
 * Renders each selected option as a `Badge`. Options not present in the stored
 * value are omitted. Renders an empty `div` when the value is empty or undefined.
 *
 * @param props - Component props
 * @param props.value - Array of selected option values from the document
 * @param props.fieldDef - Resolved `SelectField` definition
 * @returns A row of Badge components, one per selected option
 *
 * @example
 * ```tsx
 * <SelectFieldCell value={doc.tags} fieldDef={tagsField} row={row} />
 * ```
 */
export function SelectFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<SelectField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const fields = props.value
    .map((v) => props.fieldDef.options.find((o) => o.value === v))
    .filter((option): option is SelectField["options"][number] => option != null);
  const joinedLabels = fields.map((f) => f.label).join(", ");
  const content = (
    <div className="flex gap-1" title={joinedLabels}>
      {fields.map((f, index) => (
        <Badge key={`${f.value}-${index}`}>{f.label}</Badge>
      ))}
    </div>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}

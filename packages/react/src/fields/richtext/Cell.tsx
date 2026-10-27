import {
  richTextToPlainText,
  TDocument,
  type CellComponentProps,
  type RichTextField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/** Max characters shown in the cell's visible excerpt — matches `text/Cell.tsx`'s own cutoff. */
const RICHTEXT_CELL_EXCERPT_LENGTH = 77;

/**
 * Rich text field cell component for the data-table list view.
 *
 * Renders a plain-text excerpt of the stored document — never markup (Design
 * Decision 5) — via `richTextToPlainText`. The visible text is cut to
 * {@link RICHTEXT_CELL_EXCERPT_LENGTH} characters; the full plain-text
 * conversion is kept on the `title` attribute for hover, same contract as
 * `text/Cell.tsx`. An empty or missing document shows an em-dash.
 *
 * @param props - Component props.
 * @param props.value - Raw `RichTextDocument` from the document (may be null/undefined).
 * @param props.fieldDef - Resolved `RichTextField` definition.
 * @returns The cell component for this field type, or an em-dash placeholder for an empty value.
 *
 * @example
 * ```tsx
 * <RichTextFieldCell value={doc.body} fieldDef={bodyField} row={row} isTitleField={false} />
 * ```
 */
export function RichTextFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<RichTextField, TData>,
) {
  const config = useVexConfig();
  const fullText = props.value
    ? richTextToPlainText({ document: props.value })
    : "";
  if (!fullText) return <span>—</span>;
  const excerpt =
    fullText.length > RICHTEXT_CELL_EXCERPT_LENGTH
      ? richTextToPlainText({
          document: props.value as NonNullable<typeof props.value>,
          maxLength: RICHTEXT_CELL_EXCERPT_LENGTH,
        })
      : fullText;
  const content = <span title={fullText}>{excerpt}</span>;
  if (!props.isTitleField) return content;
  return (
    <VexLink
      href={adminHref(
        { type: "document", slug: props.collection.slug, id: props.row.original._id },
        config.basePath,
      )}
    >
      {content}
    </VexLink>
  );
}

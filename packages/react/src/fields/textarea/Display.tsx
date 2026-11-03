import { type DisplayComponentProps, type TDocument, type TextareaField } from "@vexcms/core";

/**
 * Textarea field read-only display, registered as
 * `reactAdapter.fields.textarea.display`.
 *
 * Shows the FULL value, wrapped, with a trailing character count — the
 * same "long text" presentation the peek's Fields tab used before this
 * round, now the registered default for every caller of
 * `fieldToDisplayComponent`.
 *
 * @param props - Component props.
 * @returns The full text value plus its character count, or an em-dash for an empty value.
 */
export function TextareaFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<TextareaField, TData>,
) {
  const text = typeof props.value === "string" ? props.value : "";
  if (!text) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-1">
      <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
      <p className="text-xs text-muted-foreground">
        {text.length} character{text.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

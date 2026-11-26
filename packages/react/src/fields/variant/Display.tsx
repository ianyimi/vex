"use client";

import {
  isDisplayValueEmpty,
  stringifyConvexValue,
  type DisplayComponentProps,
  type VariantField,
  type TDocument,
} from "@vexcms/core";
import { DisplayFieldList } from "../DisplayFieldList";

/**
 * Variant field read-only display, registered as `reactAdapter.fields.variant.display`.
 *
 * Discriminated: the active variant's label plus its own fields via
 * `DisplayFieldList` (the same recursive body `group`/`blocks` use).
 * Primitive: the bigint/ArrayBuffer-safe serialized value.
 *
 * @param props - Component props.
 * @returns The variant's label + fields, or the member value, or an em-dash when absent.
 */
export function VariantFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<VariantField, TData>,
) {
  if (isDisplayValueEmpty(props.value)) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (props.field.discriminator !== undefined) {
    const value = props.value as Record<string, unknown>;
    const key = value[props.field.discriminator];
    const member = typeof key === "string" ? props.field.variants[key] : undefined;
    return (
      <div className="rounded-md border border-border/60 px-2 py-1.5">
        <p className="text-xs font-medium text-muted-foreground">{member?.label ?? String(key)}</p>
        <div className="mt-1">
          {member ? (
            <DisplayFieldList
              fields={member.fields}
              values={value}
              document={props.document}
              collection={props.collection}
            />
          ) : (
            <span className="text-sm text-muted-foreground">Unknown variant — not configured on this field.</span>
          )}
        </div>
      </div>
    );
  }

  const preview = stringifyConvexValue({ value: props.value });
  return (
    <span className="text-sm" title={preview}>
      {preview}
    </span>
  );
}

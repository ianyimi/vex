"use client";

import {
  classifyVariantValueKind,
  stringifyConvexValue,
  type CellComponentProps,
  type VariantField,
  type TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * Variant field cell component for the admin list-table view.
 *
 * Discriminated: the active variant's label (falling back to its raw key).
 * Primitive: the active member's runtime kind. Both carry the full
 * bigint/ArrayBuffer-safe serialized value as the hover `title`.
 *
 * @param props - Component props.
 * @returns The variant label/kind, or an em-dash placeholder when absent.
 */
export function VariantFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<VariantField, TData>,
) {
  const config = useVexConfig();

  if (props.value === null || props.value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const preview = stringifyConvexValue({ value: props.value });
  let label: string;
  if (props.fieldDef.discriminator !== undefined) {
    const value = props.value as Record<string, unknown>;
    const key = value[props.fieldDef.discriminator];
    const member = typeof key === "string" ? props.fieldDef.variants[key] : undefined;
    label = member?.label ?? (typeof key === "string" ? key : "Unknown variant");
  } else {
    label = classifyVariantValueKind(props.value);
  }

  const content = (
    <span className="text-xs text-muted-foreground" title={preview}>
      {label}
    </span>
  );
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

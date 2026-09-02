import type {
  CollectionConfig,
  RelationshipField,
  RelationshipPreviewProps,
} from "@vexcms/core";
import type { ComponentType } from "react";

/**
 * Resolves which preview component to use for a relationship rendering context.
 *
 * Precedence: field-level override > target collection's preview > default.
 * The default renders `doc[useAsTitle] ?? doc._id` as plain text.
 *
 * @param props - Input props.
 * @param props.fieldDef - The resolved relationship field definition.
 * @param props.targetCollection - The resolved target collection config, or `undefined` in list-cell context.
 * @returns A `ComponentType` ready to render with `RelationshipPreviewProps`.
 */
export function resolveRelationshipPreview(props: {
  fieldDef: RelationshipField;
  targetCollection: CollectionConfig | undefined;
}): ComponentType<RelationshipPreviewProps> {
  return (props.fieldDef.admin.components?.preview ??
    props.targetCollection?.admin.components?.preview ??
    DefaultRelationshipPreview) as ComponentType<RelationshipPreviewProps>;
}

function DefaultRelationshipPreview({ doc, config }: RelationshipPreviewProps) {
  const useAsTitle = config.admin.useAsTitle;
  const label = String((doc as Record<string, unknown>)[useAsTitle] ?? doc._id);
  return <span className="text-[13px] text-foreground">{label}</span>;
}

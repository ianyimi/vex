import type { UIFieldDef, FieldAdminConfig, FieldComponentProps } from "../../types";
import type { ComponentType } from "react";

/**
 * Creates a UI field — a non-persisted field that renders a custom component.
 * UI fields are skipped during schema generation, form validation, and column generation.
 * They are useful for computed displays, action buttons, and embedded widgets.
 *
 * @param props.label - Display label for the field
 * @param props.admin - Admin config. components.Field is required.
 * @param props.description - Helper text displayed below the field
 * @returns A UIFieldDef
 *
 * @example
 * ```ts
 * import { ui } from "@vexcms/core";
 * import WordCount from "~/components/admin/WordCount";
 *
 * const collection = defineCollection({
 *   slug: "posts",
 *   fields: {
 *     wordCount: ui({
 *       label: "Word Count",
 *       admin: {
 *         components: { Field: WordCount },
 *         position: "sidebar",
 *       },
 *     }),
 *   },
 * });
 * ```
 */
export function ui(props: {
  label?: string;
  admin: FieldAdminConfig & {
    components: {
      Field: ComponentType<FieldComponentProps>;
    };
  };
  description?: string;
}): UIFieldDef {
  return {
    type: "ui" as const,
    label: props.label,
    description: props.description,
    admin: props.admin,
  };
}

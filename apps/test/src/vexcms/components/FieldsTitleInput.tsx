"use client";

import type { FieldControlProps } from "@vexcms/core";
import type { ComponentType } from "react";

/**
 * `admin.components.Input` override smoke test (`fields.title`) — proves every
 * {@link FieldControlProps} field reaches the override (`id`, `value`, `onChange`,
 * `onBlur`, `readOnly`, `invalid`, `describedBy`) and that `renderDefault` still
 * renders the built-in control underneath, layout (label/description/error) kept
 * by `FormFieldLayout` (decision 12).
 */
export function FieldsTitleInputOverride(
  props: FieldControlProps<string> & { renderDefault: ComponentType<FieldControlProps<string>> },
) {
  const { renderDefault: Default, ...controlProps } = props;
  const { id, value, readOnly, invalid, describedBy } = controlProps;
  return (
    <div data-testid="title-input-override" className="space-y-1">
      <p
        className="text-xs text-muted-foreground"
        data-override-id={id}
        data-override-readonly={readOnly}
        data-override-invalid={invalid}
        data-override-described-by={describedBy ?? ""}
      >
        {(value ?? "").length} characters (admin.components.Input override)
      </p>
      <Default {...controlProps} />
    </div>
  );
}

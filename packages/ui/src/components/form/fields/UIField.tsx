"use client";

import type { UIFieldDef } from "@vexcms/core";

interface UIFieldProps {
  fieldDef: UIFieldDef;
  name: string;
}

/**
 * Renders a ui() field by delegating to its admin.components.Field component.
 * UI fields are non-persisted — they don't store data in the database.
 * They're used for computed displays, action buttons, and embedded widgets.
 */
function UIField(props: UIFieldProps) {
  const CustomComponent = props.fieldDef.admin.components.Field;
  return (
    <CustomComponent
      name={props.name}
      fieldDef={props.fieldDef}
      readOnly={false}
    />
  );
}

export { UIField };

"use client";

import type { FieldComponentProps } from "@vexcms/core";

/**
 * `field.beforeInput` contribution for the `contactPhone` field — renders
 * above the resolved Input override without the built-in Input needing any
 * change.
 */
export function PhoneBeforeInputHint(props: FieldComponentProps) {
  return (
    <p className="text-xs text-muted-foreground" data-testid={`${props.name}-before-input`}>
      Used for support escalations only.
    </p>
  );
}

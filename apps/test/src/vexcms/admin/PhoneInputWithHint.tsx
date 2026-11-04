"use client";

import type { FieldControlProps } from "@vexcms/core";
import type { ReactHKT, SlotOverrideProps } from "@vexcms/react";

/**
 * Per-field `admin.components.Input` override for the `contactPhone` field —
 * wraps the resolved built-in text control via `renderDefault` and adds a
 * static hint line below it. Proves the per-FIELD chain composes through
 * the same `resolveFieldInputComponent` call as the root per-type chain.
 */
export function PhoneInputWithHint(props: SlotOverrideProps<ReactHKT, FieldControlProps<string>>) {
  const { renderDefault, ...rest } = props;
  const RenderDefault = renderDefault;
  return (
    <div className="space-y-1">
      <RenderDefault {...rest} />
      <p className="text-xs text-muted-foreground">Include the country code for international numbers.</p>
    </div>
  );
}

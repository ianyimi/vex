"use client";

import type { FieldControlProps } from "@vexcms/core";
import type { ReactHKT, SlotOverrideProps } from "@vexcms/react";

/**
 * Root-level per-type override for every `text` field (S1/S7/S8): trims
 * leading/trailing whitespace from the typed value on blur, composed via
 * `renderDefault` so the built-in control still renders unchanged.
 */
export function TrimOnBlurTextInput(
  props: SlotOverrideProps<ReactHKT, FieldControlProps<string>>,
) {
  const { renderDefault, onBlur, onChange, value, ...rest } = props;
  const RenderDefault = renderDefault;
  return (
    <RenderDefault
      {...rest}
      value={value}
      onChange={onChange}
      onBlur={() => {
        if (typeof value === "string" && value !== value.trim()) {
          onChange(value.trim());
        }
        onBlur();
      }}
    />
  );
}

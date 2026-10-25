"use client";

import type { ComponentType, ReactNode } from "react";
import {
  resolveComponentOverrides,
  type ComponentOverrideInput,
  type SlotId,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";

/**
 * Renders an override chain's final composed component (S3) — used directly for `field.label`/
 * `field.description` (no built-in default; `defaultComponent` is a pure fallback, usually `() =>
 * null`). `field.input`/`field.cell`'s own chains compose through `resolveFieldInputComponent`/
 * `resolveFieldCellComponent` instead, since those DO have a real built-in to start from and are
 * consumed as a plain component (not JSX) by `FieldSlotOutlet`/the cell registry.
 *
 * @returns The override chain's final composed component, wrapped in a `ComponentErrorBoundary`.
 */
export function SlotOverrideOutlet<TProps extends {}>(props: {
  slotId: SlotId;
  overrides: ComponentOverrideInput<ReactHKT, TProps>[] | undefined;
  defaultComponent: ComponentType<TProps>;
  props: TProps;
}): ReactNode {
  const resolved = resolveComponentOverrides<ReactHKT, TProps>({
    slotId: props.slotId,
    overrides: props.overrides ?? [],
  });

  const Composed = resolved.reduce<ComponentType<TProps>>(
    (renderDefault, override) => {
      const Override = override.component;
      function Composed(p: TProps) {
        return <Override {...p} renderDefault={renderDefault} />;
      }
      Composed.displayName = `SlotOverride(${override.id})`;
      return Composed;
    },
    props.defaultComponent,
  );

  return (
    <ComponentErrorBoundary id={props.slotId}>
      <Composed {...props.props} />
    </ComponentErrorBoundary>
  );
}

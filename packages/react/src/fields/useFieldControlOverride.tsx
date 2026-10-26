"use client";

import { useContext, useMemo } from "react";
import type {
  ComponentOverrideInput,
  DataFieldType,
  FieldControlProps,
} from "@vexcms/core";
import type { RenderControl } from "../forms";
import type { ReactHKT } from "../adapter";
import { VexConfigContext } from "../config/VexConfigContext";

/**
 * Composes one field's `admin.components.Input` override chain into a single
 * `RenderControl<TValue>` ready to pass as a `@vexcms/react/form` field
 * component's `renderControl` prop (decision 5/12: "replaces the control,
 * layout kept").
 *
 * @param props.fieldType - The field's `DataFieldType` — reads the
 *   project-wide chain off `useVexConfig()`.
 * @param props.fieldOverrides - This field instance's own
 *   `admin.components.Input` chain (`fieldDef.admin.components.Input`).
 * @param props.defaultControl - This field's own bare-control fallback,
 *   reached only when the chain is non-empty and its innermost override
 *   calls `renderDefault`.
 * @returns A composed `RenderControl<TValue>`, or `undefined` when neither
 *   override list has an entry — the caller then omits `renderControl`.
 */
export function useFieldControlOverride<TValue>(props: {
  fieldType: DataFieldType;
  fieldOverrides: ComponentOverrideInput<ReactHKT, FieldControlProps<TValue>>[] | undefined;
  defaultControl: RenderControl<TValue>;
}): RenderControl<TValue> | undefined {
  const config = useContext(VexConfigContext);
  const rootOverrides = config?.admin.components?.fields?.[props.fieldType]?.Input as
    | ComponentOverrideInput<ReactHKT, FieldControlProps<TValue>>[]
    | undefined;
  return useMemo(() => {
    const fieldOverrideList = Array.isArray(props.fieldOverrides)
      ? props.fieldOverrides
      : props.fieldOverrides
        ? [props.fieldOverrides]
        : [];
    const chain = [...(rootOverrides ?? []), ...fieldOverrideList];
    if (chain.length === 0) return undefined;
    return chain.reduce<RenderControl<TValue>>((renderDefault, override) => {
      const Override = override.component;
      function Composed(controlProps: FieldControlProps<TValue>) {
        return <Override {...controlProps} renderDefault={renderDefault} />;
      }
      Composed.displayName = `FieldControlOverride(${override.id})`;
      return Composed;
    }, props.defaultControl);
  }, [rootOverrides, props.fieldOverrides, props.defaultControl]);
}

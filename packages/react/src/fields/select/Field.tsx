"use client";

import { type ComponentOverrideInput, type SelectField as SelectFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { SelectField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../../ui/multi-select";
import { useModalSurface } from "../../modals/useModalSurface";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Select admin field — maps `fieldDef` to `@vexcms/react/form`'s `SelectField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `SelectField`.
 * @returns `SelectField`, configured for this field instance.
 */
export function SelectFieldAdmin(props: FieldComponentProps<{}, SelectFieldDef> & { field?: AnyFieldApi }) {
  const isOnModalSurface = useModalSurface();
  function renderBareControl(controlProps: FieldControlProps<string[]>) {
    return (
      <MultiSelect
        modal={isOnModalSurface}
        onValuesChange={controlProps.onChange}
        single={!props.fieldDef.hasMany}
        values={controlProps.value}
      >
        <MultiSelectTrigger
          id={controlProps.id}
          className="w-full"
          onBlur={controlProps.onBlur}
          name={props.name}
          aria-required={props.fieldDef.required}
          aria-invalid={controlProps.invalid}
          aria-describedby={controlProps.describedBy}
          disabled={controlProps.readOnly}
        >
          <MultiSelectValue placeholder={props.fieldDef.admin.placeholder} />
        </MultiSelectTrigger>
        <MultiSelectContent
          onBlur={controlProps.onBlur}
          className="w-full"
          search={props.fieldDef.admin.searchable}
        >
          <MultiSelectGroup>
            {props.fieldDef.options.map((option, optionIndex) => (
              <MultiSelectItem value={option.value} key={`multi-select-item-${props.name}-${optionIndex}`}>
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
        </MultiSelectContent>
      </MultiSelect>
    );
  }
  const overrideControl = useFieldControlOverride<string[]>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<string[]>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <SelectField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        options={props.fieldDef.options}
        hasMany={props.fieldDef.hasMany}
        display={props.fieldDef.admin.display}
        searchable={props.fieldDef.admin.searchable}
        placeholder={props.fieldDef.admin.placeholder}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}

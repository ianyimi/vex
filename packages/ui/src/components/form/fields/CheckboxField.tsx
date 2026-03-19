"use client";

import type { CheckboxFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { CheckboxField as CheckboxInput } from "../../ui/checkbox-field";
import { Label } from "../../ui/label";
import { useVexField } from "../../../hooks/useVexField";

interface CheckboxFieldFormProps {
  /** Field name key */
  name: string;
  /**
   * TanStack Form field API (legacy prop — used when VexFormProvider is not available).
   * When omitted, useVexField() is used instead.
   */
  field?: any;
  fieldDef?: CheckboxFieldDef;
}

function CheckboxFieldForm({ name, field: legacyField, fieldDef: propFieldDef }: CheckboxFieldFormProps) {
  const vexField = legacyField ? null : useVexField<boolean>({ name });

  const value = legacyField ? legacyField.state.value : vexField!.value;
  const handleChange = legacyField
    ? (v: boolean) => legacyField.handleChange(v)
    : (v: boolean) => vexField!.setValue(v);
  const handleBlur = legacyField ? legacyField.handleBlur : vexField!.handleBlur;

  const fieldDef = (propFieldDef ?? vexField?.fieldDef) as CheckboxFieldDef | undefined;
  const label = fieldDef?.label ?? toTitleCase(name);
  const description = fieldDef?.admin?.description ?? fieldDef?.description;
  const disabled = legacyField
    ? fieldDef?.admin?.readOnly
    : vexField!.readOnly;

  const errors: string[] = legacyField
    ? normalizeErrors(legacyField.state.meta.errors)
    : vexField!.errors;
  const showError = legacyField ? errors.length > 0 : vexField!.showError;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CheckboxInput
          id={name}
          checked={value ?? false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.checked)
          }
          onBlur={handleBlur}
          disabled={disabled}
        />
        <Label htmlFor={name}>{label}</Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showError && errors.length > 0 && (
        <div>
          {errors.map((error, i) => (
            <p key={i} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeErrors(errors: unknown[] | undefined): string[] {
  if (!errors) return [];
  return errors.map((e) =>
    typeof e === "string" ? e : ((e as any)?.message ?? String(e)),
  );
}

export { CheckboxFieldForm };

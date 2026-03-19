"use client";

import type { NumberFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useVexField } from "../../../hooks/useVexField";

interface NumberFieldProps {
  /** Field name key */
  name: string;
  /**
   * TanStack Form field API (legacy prop — used when VexFormProvider is not available).
   * When omitted, useVexField() is used instead.
   */
  field?: any;
  fieldDef?: NumberFieldDef;
}

function NumberField({ name, field: legacyField, fieldDef: propFieldDef }: NumberFieldProps) {
  const vexField = legacyField ? null : useVexField<number | undefined>({ name });

  const value = legacyField ? legacyField.state.value : vexField!.value;
  const handleChange = legacyField
    ? (v: number | undefined) => legacyField.handleChange(v)
    : (v: number | undefined) => vexField!.setValue(v);
  const handleBlur = legacyField ? legacyField.handleBlur : vexField!.handleBlur;

  const fieldDef = (propFieldDef ?? vexField?.fieldDef) as NumberFieldDef | undefined;
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
      <Label htmlFor={name}>
        {label}
        {fieldDef?.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="number"
        value={value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value;
          if (raw === "") {
            handleChange(undefined);
            return;
          }
          const num = Number(raw);
          if (!Number.isNaN(num)) {
            handleChange(num);
          }
        }}
        onBlur={handleBlur}
        min={fieldDef?.min}
        max={fieldDef?.max}
        step={fieldDef?.step}
        disabled={disabled}
        placeholder={fieldDef?.admin?.placeholder}
      />
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

export { NumberField };

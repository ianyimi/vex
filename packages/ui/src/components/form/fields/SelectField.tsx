"use client";

import type { SelectFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select";
import { Label } from "../../ui/label";
import { useVexField } from "../../../hooks/useVexField";

interface SelectFieldProps {
  /** Field name key */
  name: string;
  /**
   * TanStack Form field API (legacy prop — used when VexFormProvider is not available).
   * When omitted, useVexField() is used instead.
   */
  field?: any;
  fieldDef?: SelectFieldDef;
}

function SelectField({ name, field: legacyField, fieldDef: propFieldDef }: SelectFieldProps) {
  const vexField = legacyField ? null : useVexField<string>({ name });

  const value = legacyField ? legacyField.state.value : vexField!.value;
  const handleChange = legacyField
    ? (v: string) => legacyField.handleChange(v)
    : (v: string) => vexField!.setValue(v);

  const fieldDef = (propFieldDef ?? vexField?.fieldDef) as SelectFieldDef | undefined;
  const label =
    (fieldDef?.hasMany ? fieldDef?.labels?.singular : (fieldDef as any)?.label) ??
    toTitleCase(name);
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
      <Select
        value={value ?? null}
        onValueChange={(val) => handleChange(val)}
        disabled={disabled}
        items={fieldDef?.options}
      >
        <SelectTrigger id={name}>
          <SelectValue
            placeholder={!fieldDef?.required ? "Select..." : undefined}
          />
        </SelectTrigger>
        <SelectContent>
          {fieldDef?.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

export { SelectField };

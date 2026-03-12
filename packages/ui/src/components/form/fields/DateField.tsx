"use client";

import type { DateFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { DatePicker } from "../../ui/date-picker";
import { Label } from "../../ui/label";

interface DateFieldProps {
  field: any;
  fieldDef: DateFieldDef;
  name: string;
}

function DateField({ field, fieldDef, name }: DateFieldProps) {
  const label = fieldDef.label ?? toTitleCase(name);
  const description = fieldDef.admin?.description ?? fieldDef.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  const value = field.state.value;
  const dateValue = value != null ? new Date(value as number) : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {fieldDef.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <DatePicker
        value={dateValue}
        onChange={(date) => {
          field.handleChange(date ? date.getTime() : undefined);
        }}
        disabled={fieldDef.admin?.readOnly}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errors.length > 0 && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string" ? error : (error as any)?.message ?? String(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { DateField };

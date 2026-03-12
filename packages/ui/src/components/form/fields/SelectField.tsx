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

interface SelectFieldProps {
  field: any;
  fieldDef: SelectFieldDef;
  name: string;
}

function SelectField({ field, fieldDef, name }: SelectFieldProps) {
  const label = (fieldDef.hasMany ? fieldDef.labels?.singular : fieldDef.label) ?? toTitleCase(name);
  const description = fieldDef.admin?.description ?? fieldDef.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {fieldDef.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={field.state.value ?? null}
        onValueChange={(val) => field.handleChange(val)}
        disabled={fieldDef.admin?.readOnly}
        items={fieldDef.options}
      >
        <SelectTrigger id={name}>
          <SelectValue placeholder={!fieldDef.required ? "Select..." : undefined} />
        </SelectTrigger>
        <SelectContent>
          {fieldDef.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

export { SelectField };

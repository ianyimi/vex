"use client";

import type { SelectFieldMeta } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { SelectNative } from "../../ui/select-native";
import { Label } from "../../ui/label";

interface SelectFieldProps {
  field: any;
  meta: SelectFieldMeta;
  name: string;
}

function SelectField({ field, meta, name }: SelectFieldProps) {
  const label = meta.label ?? toTitleCase(name);
  const description = meta.admin?.description ?? meta.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {meta.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <SelectNative
        id={name}
        value={field.state.value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        disabled={meta.admin?.readOnly}
        placeholder={!meta.required ? "Select..." : undefined}
      >
        {meta.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </SelectNative>
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

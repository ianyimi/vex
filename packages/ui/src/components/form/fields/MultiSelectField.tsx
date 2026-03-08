"use client";

import type { SelectFieldMeta } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Label } from "../../ui/label";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
} from "../../ui/multi-select";

interface MultiSelectFieldProps {
  field: any;
  meta: SelectFieldMeta;
  name: string;
}

function MultiSelectField({ field, meta, name }: MultiSelectFieldProps) {
  const label = meta.label ?? toTitleCase(name);
  const description = meta.admin?.description ?? meta.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {meta.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <MultiSelect
        values={Array.isArray(field.state.value) ? field.state.value : []}
        onValuesChange={(vals) => field.handleChange(vals)}
      >
        <MultiSelectTrigger id={name} disabled={meta.admin?.readOnly}>
          <MultiSelectValue placeholder="Select..." />
        </MultiSelectTrigger>
        <MultiSelectContent>
          {meta.options.map((opt) => (
            <MultiSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errors.length > 0 && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string"
                ? error
                : (error as any)?.message ?? String(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { MultiSelectField };

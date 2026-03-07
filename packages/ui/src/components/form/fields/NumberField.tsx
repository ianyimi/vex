"use client";

import type { NumberFieldMeta } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface NumberFieldProps {
  field: any;
  meta: NumberFieldMeta;
  name: string;
}

function NumberField({ field, meta, name }: NumberFieldProps) {
  const label = meta.label ?? toTitleCase(name);
  const description = meta.admin?.description ?? meta.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {meta.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="number"
        value={field.state.value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value;
          if (raw === "") {
            field.handleChange(undefined);
            return;
          }
          const num = Number(raw);
          if (!Number.isNaN(num)) {
            field.handleChange(num);
          }
        }}
        onBlur={field.handleBlur}
        min={meta.min}
        max={meta.max}
        step={meta.step}
        disabled={meta.admin?.readOnly}
        placeholder={meta.admin?.placeholder}
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

export { NumberField };

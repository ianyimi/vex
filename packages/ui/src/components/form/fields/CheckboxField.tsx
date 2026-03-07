"use client";

import type { CheckboxFieldMeta } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { CheckboxField as CheckboxInput } from "../../ui/checkbox-field";
import { Label } from "../../ui/label";

interface CheckboxFieldFormProps {
  field: any;
  meta: CheckboxFieldMeta;
  name: string;
}

function CheckboxFieldForm({ field, meta, name }: CheckboxFieldFormProps) {
  const label = meta.label ?? toTitleCase(name);
  const description = meta.admin?.description ?? meta.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CheckboxInput
          id={name}
          checked={field.state.value ?? false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.checked)}
          onBlur={field.handleBlur}
          disabled={meta.admin?.readOnly}
        />
        <Label htmlFor={name}>{label}</Label>
      </div>
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

export { CheckboxFieldForm };

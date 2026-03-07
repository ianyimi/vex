"use client";

import type { TextFieldMeta } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface TextFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FieldApi generic is too complex to express here
  field: any;
  meta: TextFieldMeta;
  name: string;
}

function TextField({ field, meta, name }: TextFieldProps) {
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
        value={field.state.value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={meta.admin?.placeholder}
        disabled={meta.admin?.readOnly}
        maxLength={meta.maxLength}
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

export { TextField };

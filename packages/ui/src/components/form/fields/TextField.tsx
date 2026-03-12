"use client";

import type { TextFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface TextFieldProps {
  field: any;
  fieldDef: TextFieldDef;
  name: string;
}

function TextField({ field, fieldDef, name }: TextFieldProps) {
  const label = fieldDef.label ?? toTitleCase(name);
  const description = fieldDef.admin?.description ?? fieldDef.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {fieldDef.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        value={field.state.value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          field.handleChange(e.target.value)
        }
        onBlur={field.handleBlur}
        placeholder={fieldDef.admin?.placeholder}
        disabled={fieldDef.admin?.readOnly}
        maxLength={fieldDef.maxLength}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errors.length > 0 && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string"
                ? error
                : ((error as any)?.message ?? String(error))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { TextField };

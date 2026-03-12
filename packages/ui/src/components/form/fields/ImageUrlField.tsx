"use client";

import * as React from "react";
import type { ImageUrlFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface ImageUrlFieldProps {
  field: any;
  fieldDef: ImageUrlFieldDef;
  name: string;
}

function ImageUrlField({ field, fieldDef, name }: ImageUrlFieldProps) {
  const label = fieldDef.label ?? toTitleCase(name);
  const description = fieldDef.admin?.description ?? fieldDef.description;
  const errors: unknown[] = field.state.meta.errors ?? [];
  const value = (field.state.value as string) ?? "";
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {fieldDef.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="url"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={fieldDef.admin?.placeholder ?? "https://..."}
        disabled={fieldDef.admin?.readOnly}
      />
      {value && !imgError && (
        <img
          src={value}
          alt=""
          className="h-16 w-16 rounded object-cover"
          onError={() => setImgError(true)}
        />
      )}
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

export { ImageUrlField };

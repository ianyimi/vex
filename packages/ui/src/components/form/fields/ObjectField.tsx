"use client";

import { useState } from "react";
import type { ObjectFieldDef, VexField } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
} from "../../ui/collapsible";

interface ObjectFieldProps {
  field: {
    state: { value: unknown };
    handleChange: (value: unknown) => void;
  };
  fieldDef: ObjectFieldDef;
  name: string;
  /** Render callback for sub-fields — provided by AppForm for recursive rendering */
  renderField?: (props: {
    fieldName: string;
    fieldPath: string;
    field: VexField;
  }) => React.ReactNode;
}

export function ObjectField({ field, fieldDef, name, renderField }: ObjectFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const label = fieldDef.label ?? toTitleCase(name);
  const description = fieldDef.admin?.description ?? fieldDef.description;
  const readOnly = fieldDef.admin?.readOnly ?? false;

  const value = (field.state.value as Record<string, unknown>) ?? {};

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen}>
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* Header */}
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium">{label}</span>
            {!isOpen && (
              <span className="text-xs text-muted-foreground ml-auto">
                {Object.keys(fieldDef.fields).length} field{Object.keys(fieldDef.fields).length === 1 ? "" : "s"}
              </span>
            )}
          </button>

          {/* Fields */}
          <CollapsibleContent>
            <div className="p-4 space-y-4 border-t">
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {renderField ? (
                // When renderField is provided (from AppForm), use it for recursive rendering
                Object.entries(fieldDef.fields).map(([subName, subFieldDef]) => (
                  <div key={subName}>
                    {renderField({
                      fieldName: subName,
                      fieldPath: `${name}.${subName}`,
                      field: subFieldDef as VexField,
                    })}
                  </div>
                ))
              ) : (
                // Fallback: simple inline rendering for basic field types
                Object.entries(fieldDef.fields).map(([subName, subFieldDef]) => {
                  const f = subFieldDef as VexField;
                  const subLabel = f.label ?? toTitleCase(subName);
                  const subValue = value[subName];

                  if (f.type === "text") {
                    return (
                      <div key={subName} className="space-y-2">
                        <label className="text-sm font-medium">
                          {subLabel}
                          {f.required && <span className="text-destructive ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={(subValue as string) ?? ""}
                          onChange={(e) => {
                            const next = { ...value, [subName]: e.target.value };
                            field.handleChange(next);
                          }}
                          disabled={readOnly}
                          className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={subName} className="space-y-2">
                      <label className="text-sm font-medium">{subLabel}</label>
                      <div className="rounded-md border p-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">
                          Field type &quot;{f.type}&quot; — use renderField for full support.
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

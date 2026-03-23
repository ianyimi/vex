"use client";

import { useState } from "react";
import type { VexField } from "@vexcms/core";

interface TabDef {
  label: string;
  slug?: string;
  fields: Record<string, VexField>;
}

interface TabsFieldProps {
  fieldDef: {
    label?: string;
    tabs: TabDef[];
  };
  name: string;
  /** Render function for a single sub-field within a tab */
  renderField: (props: {
    fieldName: string;
    fieldPath: string;
    field: VexField;
  }) => React.ReactNode;
}

/**
 * Renders a tabs field as a tabbed UI in the admin panel.
 * Each tab contains its sub-fields rendered by the parent form.
 */
export function TabsField({ fieldDef, name: _name, renderField }: TabsFieldProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!fieldDef.tabs || fieldDef.tabs.length === 0) return null;

  return (
    <div className="space-y-4">
      {fieldDef.label && (
        <label className="text-sm font-medium">{fieldDef.label}</label>
      )}

      {/* Tab buttons */}
      <div className="flex border-b">
        {fieldDef.tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="space-y-4 pt-2">
        {Object.entries(fieldDef.tabs[activeTab].fields).map(
          ([fieldName, subField]) => {
            if (subField.type === "ui") return null;

            // Build the field path: tab.slug.fieldName (e.g., "light.background")
            // Tabs expand their slugs as top-level keys on the document
            const tab = fieldDef.tabs[activeTab];
            const fieldPath = `${tab.slug}.${fieldName}`;

            return (
              <div key={fieldName}>
                {renderField({
                  fieldName,
                  fieldPath,
                  field: subField,
                })}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

"use client";

import { createContext, useContext, useMemo } from "react";
import type { FormApi } from "@tanstack/react-form";
import type { VexField } from "@vexcms/core";

// ---------- Types ----------

interface FieldEntry {
  name: string;
  field: VexField;
  readOnly?: boolean;
}

interface VexFormContextValue {
  /** The TanStack Form instance */
  form: FormApi<Record<string, any>, any>;
  /** Map of field name → VexField definition */
  fieldDefs: Record<string, VexField>;
  /** Map of field name → readOnly status */
  readOnlyMap: Record<string, boolean>;
}

// ---------- Context ----------

const VexFormContext = createContext<VexFormContextValue | null>(null);

/**
 * Access the VexForm context. Throws if used outside VexFormProvider.
 */
export function useVexFormContext(): VexFormContextValue {
  const ctx = useContext(VexFormContext);
  if (!ctx) {
    throw new Error(
      "useVexFormContext must be used within a VexFormProvider. " +
        "Wrap your form with <VexFormProvider> or use AppForm which includes it.",
    );
  }
  return ctx;
}

// ---------- Provider ----------

interface VexFormProviderProps {
  /** The TanStack Form instance */
  form: FormApi<Record<string, any>, any>;
  /** The field entries being rendered */
  fieldEntries: FieldEntry[];
  children: React.ReactNode;
}

/**
 * Provides form context for useVexField, useVexForm, and useVexFormFields hooks.
 * Wraps TanStack Form — does not replace it.
 *
 * AppForm creates this provider internally. Custom form layouts can use it directly.
 */
export function VexFormProvider(props: VexFormProviderProps) {
  const value = useMemo(() => {
    const fieldDefs: Record<string, VexField> = {};
    const readOnlyMap: Record<string, boolean> = {};

    for (const entry of props.fieldEntries) {
      fieldDefs[entry.name] = entry.field;
      readOnlyMap[entry.name] = entry.readOnly ?? false;
    }

    return { form: props.form, fieldDefs, readOnlyMap };
  }, [props.form, props.fieldEntries]);

  return (
    <VexFormContext.Provider value={value}>
      {props.children}
    </VexFormContext.Provider>
  );
}

export type { VexFormContextValue, VexFormProviderProps, FieldEntry };

"use client";

import {
  parseColor,
  serializeColor,
  type ColorField,
  type ColorFormat,
} from "@vexcms/core";
import Sketch from "@uiw/react-color-sketch";
import { useEffect, useMemo, useState } from "react";

import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { createFieldInput, FormDescription, FormLabel, FormError } from "../../form";
import { readThemeColorTokens, type ThemeColorToken } from "./utils";

/** Colour the picker opens on when the field holds no parseable value. */
const PICKER_FALLBACK = "#000000";

/** Placeholder shown per notation, so the expected shape is visible before typing. */
const FORMAT_PLACEHOLDERS: Record<ColorFormat, string> = {
  hex: "#E8622A",
  rgb: "rgb(232, 98, 42)",
  hsl: "hsl(17.7, 80.5%, 53.7%)",
  oklch: "oklch(65.73% 0.17941 40.85)",
};

/**
 * Colour field input component for the admin edit form.
 *
 * Renders a swatch button that opens a `Sketch` picker, alongside a text input
 * for pasting an exact value. All colour maths lives in `@vexcms/core` —
 * this component only bridges the picker's model to it, which is two calls:
 *
 * - **write** — `ColorResult.rgba` is already `{ r, g, b, a }`, so it goes
 *   straight into `serializeColor` with the field's `format`.
 * - **read** — `Sketch`'s `color` prop parses hex and nothing else (its
 *   `@uiw/color-convert` helper returns `{ hex: undefined }` for `rgb()`,
 *   `hsl()` and `oklch()` alike), so the stored value is normalised to hex by
 *   `serializeColor` first. That is what lets a field storing `oklch` reopen on
 *   its saved colour rather than black.
 *
 * With `fieldDef.themeColors` the popover gains a **Theme** tab listing the host
 * application's CSS custom properties; selecting one stores `var(--token)` so
 * the colour follows the active colour scheme.
 *
 * Notation validation lives in `colorFieldToInputSchema`, not here — the text
 * input accepts free text and reports on submit, so a half-typed value is not
 * fought character by character.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <ColorFieldInput name="primaryLight" fieldDef={primaryLightField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const ColorFieldInput = createFieldInput<string, {}, ColorField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [tokens, setTokens] = useState<ThemeColorToken[]>([]);

    const value = field.state.value ?? "";
    const disabled = readOnly || fieldDef.admin.readOnly;

    // Read on open rather than on mount: the host stylesheet is in place by
    // then, and a closed picker should not walk the CSSOM.
    useEffect(() => {
      if (!isOpen || !fieldDef.themeColors) return;
      setTokens(readThemeColorTokens());
    }, [isOpen, fieldDef.themeColors]);

    const filteredTokens = useMemo(() => {
      if (!search) return tokens;
      const query = search.toLowerCase();
      return tokens.filter((token) => token.name.toLowerCase().includes(query));
    }, [tokens, search]);

    // A `var(--token)` value has no literal colour, so the picker falls back.
    const pickerColor = useMemo(() => {
      const parsed = parseColor({ value });
      return parsed ? serializeColor({ color: parsed, format: "hex" }) : PICKER_FALLBACK;
    }, [value]);

    const picker = (
      <Sketch
        color={pickerColor}
        disableAlpha={false}
        onChange={(next) =>
          field.handleChange(serializeColor({ color: next.rgba, format: fieldDef.format }))
        }
      />
    );

    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <div className="flex items-center gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
              nativeButton={false}
              render={(triggerProps) => (
                <button
                  {...triggerProps}
                  type="button"
                  aria-label={`Pick a colour for ${fieldDef.label || name}`}
                  disabled={disabled}
                  className="size-9 shrink-0 rounded-md border border-input shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: value || "transparent" }}
                />
              )}
            />
            <PopoverContent className="w-auto p-2" align="start">
              {fieldDef.themeColors ? (
                <Tabs defaultValue="custom">
                  <TabsList>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                  </TabsList>
                  <TabsContent value="custom">{picker}</TabsContent>
                  <TabsContent value="theme">
                    <div className="flex w-72 flex-col gap-2">
                      <Input
                        type="text"
                        value={search}
                        placeholder="Search tokens..."
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {filteredTokens.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                          {tokens.length === 0 ? "No theme colours found" : "No matching tokens"}
                        </p>
                      ) : (
                        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                          {filteredTokens.map((token) => (
                            <button
                              key={token.name}
                              type="button"
                              onClick={() => {
                                field.handleChange(token.reference);
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                              title={
                                token.darkValue
                                  ? `Light: ${token.lightValue} / Dark: ${token.darkValue}`
                                  : token.lightValue
                              }
                            >
                              <span className="relative size-4 shrink-0 overflow-hidden rounded border border-border">
                                <span
                                  className="absolute inset-0"
                                  style={{ backgroundColor: token.lightValue }}
                                />
                                {token.darkValue ? (
                                  <span
                                    className="absolute inset-0"
                                    style={{
                                      backgroundColor: token.darkValue,
                                      clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                                    }}
                                  />
                                ) : null}
                              </span>
                              <span className="truncate font-mono">{token.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                picker
              )}
            </PopoverContent>
          </Popover>
          <Input
            id={name}
            type="text"
            className="font-mono"
            disabled={disabled}
            value={value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder || FORMAT_PLACEHOLDERS[fieldDef.format]}
            readOnly={fieldDef.admin.readOnly}
          />
        </div>
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);

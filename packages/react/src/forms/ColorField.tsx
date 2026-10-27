"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@tanstack/react-form";
import Sketch from "@uiw/react-color-sketch";
import { parseColor, serializeColor, type ColorFormat } from "@vexcms/core";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { BaseFormFieldProps } from "./types";

/** Colour the picker opens on when the field holds no parseable value. */
const PICKER_FALLBACK = "#000000";

const FORMAT_PLACEHOLDERS: Record<ColorFormat, string> = {
  hex: "#E8622A",
  rgb: "rgb(232, 98, 42)",
  hsl: "hsl(17.7, 80.5%, 53.7%)",
  oklch: "oklch(65.73% 0.17941 40.85)",
};

/** Selectors that declare light-scheme tokens. Anchored: a compound selector such as `:root.dark` must not be read as a light declaration. */
const LIGHT_SELECTOR = /^(?::root|html)$/;

/** Selectors that declare dark-scheme tokens. Anchored so Tailwind's `dark:` utilities — whose `selectorText` is `.dark\:bg-red-500` — are excluded. */
const DARK_SELECTOR = /^(?:html|:root)?\.dark$/;

/** CSS colour notations a token may use, matched by notation rather than `CSS.supports` (jsdom does not implement it). Named colours are excluded deliberately. */
const COLOR_VALUE =
  /^(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\()/;

/** A value that is entirely one custom-property reference: `var(--primary)`. */
const VAR_REFERENCE = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/;

/** Tailwind's `@theme inline` block re-declares every token under a `--color-` namespace as `var(--<token>)`; those are aliases, not tokens. */
const TAILWIND_ALIAS_PREFIX = "--color-";

/** Maximum `var()` hops followed when resolving a declared value. */
const MAX_VAR_DEPTH = 4;

/** One CSS custom property discovered on the host stylesheet. */
export interface ColorFieldThemeToken {
  /** The custom-property name, including the leading dashes: `"--primary"`. */
  name: string;
  /** The value stored when this token is selected: `"var(--primary)"`. */
  reference: string;
  /** The value declared for the light colour scheme. */
  lightValue: string;
  /** The value declared under `.dark`, or `null` when the token has no dark variant. */
  darkValue: string | null;
}

/**
 * Reads a stylesheet's rules, returning an empty list when access throws
 * (a cross-origin stylesheet with no CORS header).
 *
 * @returns The stylesheet's CSS rules, or an empty array on access failure.
 */
function safeCssRules(props: { sheet: CSSStyleSheet }): CSSRule[] {
  try {
    return Array.from(props.sheet.cssRules);
  } catch {
    return [];
  }
}

/**
 * Recursively collects declared custom properties into the light and dark
 * maps. Grouping rules (`@layer`, `@media`, `@supports`) carry their own
 * `cssRules` and are descended into — Tailwind v4 emits `:root` inside
 * `@layer base`, so skipping them would find nothing.
 */
function collectDeclarations(props: {
  rules: CSSRule[];
  light: Map<string, string>;
  dark: Map<string, string>;
}): void {
  for (const rule of props.rules) {
    const grouping = rule as CSSRule & { cssRules?: CSSRuleList };
    if (grouping.cssRules) {
      collectDeclarations({ rules: Array.from(grouping.cssRules), light: props.light, dark: props.dark });
      continue;
    }

    const styleRule = rule as CSSStyleRule;
    if (!styleRule.selectorText || !styleRule.style) continue;

    const selectors = styleRule.selectorText.split(",").map((s) => s.trim());
    const isLight = selectors.some((s) => LIGHT_SELECTOR.test(s));
    const isDark = selectors.some((s) => DARK_SELECTOR.test(s));
    if (!isLight && !isDark) continue;

    // Indexed access, not `.item(i)`: jsdom's `CSSStyleDeclaration` does not
    // implement `item`, so `.item(i)` throws under vitest (measured).
    for (let i = 0; i < styleRule.style.length; i += 1) {
      const name = styleRule.style[i];
      if (!name.startsWith("--")) continue;
      const value = styleRule.style.getPropertyValue(name).trim();
      if (!value) continue;
      if (isLight) props.light.set(name, value);
      if (isDark) props.dark.set(name, value);
    }
  }
}

/**
 * Resolves a declared value through up to {@link MAX_VAR_DEPTH} `var()` hops.
 *
 * @returns The resolved value, or the original `props.value` when it is not a `var()` reference or the hop limit is reached.
 */
function resolveValue(props: { value: string; declared: Map<string, string>; depth?: number }): string {
  const depth = props.depth ?? 0;
  const match = VAR_REFERENCE.exec(props.value);
  if (!match || depth >= MAX_VAR_DEPTH) return props.value;
  const target = props.declared.get(match[1]);
  if (target === undefined) return props.value;
  return resolveValue({ value: target, declared: props.declared, depth: depth + 1 });
}

/**
 * Walks the host document's stylesheets for colour-looking CSS custom
 * properties, pairing a light-scheme declaration with its dark-scheme
 * override when one exists. Ported wholesale from the deleted admin
 * `components/fields/color/utils.ts` — it never read `fieldDef`.
 *
 * Reads **declared** values out of the CSSOM rather than calling
 * `getComputedStyle` on the live tree: the admin panel may itself be in
 * dark mode, in which case computed values would report the dark palette
 * twice.
 *
 * @returns Every discovered token, sorted by name. Empty when there is no
 * `document` (SSR) or when no stylesheet declares a colour-valued custom property.
 */
function readThemeColorTokens(): ColorFieldThemeToken[] {
  if (typeof document === "undefined") return [];

  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  for (const sheet of Array.from(document.styleSheets)) {
    collectDeclarations({ rules: safeCssRules({ sheet }), light, dark });
  }

  const tokens: ColorFieldThemeToken[] = [];
  for (const [name, declared] of light) {
    if (name.startsWith(TAILWIND_ALIAS_PREFIX)) continue;
    const lightValue = resolveValue({ value: declared, declared: light });
    if (!COLOR_VALUE.test(lightValue)) continue;

    const declaredDark = dark.get(name);
    const darkValue = declaredDark === undefined ? null : resolveValue({ value: declaredDark, declared: dark });

    tokens.push({ name, reference: `var(${name})`, lightValue, darkValue });
  }

  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}

/** Props for {@link ColorField}. */
export interface ColorFieldProps extends BaseFormFieldProps<string> {
  format: ColorFormat;
  /** Adds a **Theme** tab listing the host app's CSS custom properties. */
  themeColors?: boolean;
  placeholder?: string;
}

/**
 * A colour field bound to the nearest `<form.AppField name="...">`: a swatch
 * button opening a `Sketch` picker, beside a text input for pasting an exact
 * value. All colour maths is `@vexcms/core`'s `parseColor`/`serializeColor` —
 * plain, framework-agnostic conversions, not admin config.
 *
 * @param props - See {@link ColorFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled swatch + text control, description and error.
 */
export function ColorField(props: ColorFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tokens, setTokens] = useState<ColorFieldThemeToken[]>([]);

  const value = field.state.value ?? "";

  // Read on open rather than on mount: the host stylesheet is in place by
  // then, and a closed picker should not walk the CSSOM.
  useEffect(() => {
    if (!isOpen || !props.themeColors) return;
    setTokens(readThemeColorTokens());
  }, [isOpen, props.themeColors]);

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
      onChange={(next) => field.handleChange(serializeColor({ color: next.rgba, format: props.format }))}
    />
  );

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid: isFieldShowingError({ field, submissionAttempts }),
      describedBy: fieldDescribedBy({
        id: field.name,
        hasDescription: Boolean(props.description),
        showError: isFieldShowingError({ field, submissionAttempts }),
      }),
    });
    return (
      <FormFieldLayout
        id={field.name}
        label={props.label}
        required={props.required}
        description={props.description}
        index={props.index}
        field={field}
        submissionAttempts={submissionAttempts}
        className={props.className}
      >
        {control}
      </FormFieldLayout>
    );
  }

  const row = (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          nativeButton={true}
          render={(triggerProps) => (
            <button
              {...triggerProps}
              type="button"
              aria-label={`Pick a colour for ${props.label ?? field.name}`}
              disabled={props.readOnly}
              className="size-9 shrink-0 rounded-md border border-input shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: value || "transparent" }}
            />
          )}
        />
        <PopoverContent className="w-auto p-2" align="start">
          {props.themeColors ? (
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
                            <span className="absolute inset-0" style={{ backgroundColor: token.lightValue }} />
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
        id={field.name}
        type="text"
        className="font-mono"
        disabled={props.readOnly}
        value={value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={props.placeholder || FORMAT_PLACEHOLDERS[props.format]}
        aria-required={props.required}
        aria-invalid={isFieldShowingError({ field, submissionAttempts })}
        aria-describedby={fieldDescribedBy({
          id: field.name,
          hasDescription: Boolean(props.description),
          showError: isFieldShowingError({ field, submissionAttempts }),
        })}
      />
    </div>
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
    >
      {row}
    </FormFieldLayout>
  );
}

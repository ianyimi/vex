"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Sketch from "@uiw/react-color-sketch";

interface ColorFieldProps {
  field: {
    state: { value: unknown };
    handleChange: (value: string) => void;
  };
  fieldDef: {
    label?: string;
    format?: "hex" | "hsl" | "oklch";
    themeColors?: boolean;
    required?: boolean;
    admin?: { readOnly?: boolean; description?: string };
  };
  name: string;
}

export function ColorField({ field, fieldDef, name }: ColorFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"custom" | "theme">("custom");
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const value = (field.state.value as string) ?? "";
  const disabled = fieldDef.admin?.readOnly ?? false;
  const showThemeTab = fieldDef.themeColors ?? false;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleColorChange = useCallback(
    (color: { hex: string }) => {
      if (disabled) return;
      field.handleChange(color.hex);
    },
    [field, disabled],
  );

  // Read theme colors from DOM
  const [themeColors, setThemeColors] = useState<
    { name: string; lightValue: string; darkValue: string | null }[]
  >([]);

  useEffect(() => {
    if (!showThemeTab || typeof document === "undefined") return;

    const colors: { name: string; lightValue: string; darkValue: string | null }[] = [];
    const rootStyles = getComputedStyle(document.documentElement);

    const colorVarNames = [
      "background", "foreground", "card", "card-foreground",
      "popover", "popover-foreground", "primary", "primary-foreground",
      "secondary", "secondary-foreground", "muted", "muted-foreground",
      "accent", "accent-foreground", "destructive", "destructive-foreground",
      "border", "input", "ring",
      "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
      "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
      "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
    ];

    const darkValues = new Map<string, string>();
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSStyleRule && rule.selectorText?.includes(".dark")) {
              for (const varName of colorVarNames) {
                const v = rule.style.getPropertyValue(`--${varName}`).trim();
                if (v) darkValues.set(varName, v);
              }
            }
          }
        } catch { /* cross-origin */ }
      }
    } catch { /* no access */ }

    for (const varName of colorVarNames) {
      const lightValue = rootStyles.getPropertyValue(`--${varName}`).trim();
      if (!lightValue) continue;
      colors.push({ name: varName, lightValue, darkValue: darkValues.get(varName) ?? null });
    }

    setThemeColors(colors);
  }, [showThemeTab]);

  const filteredThemeColors = useMemo(() => {
    if (!search) return themeColors;
    const q = search.toLowerCase();
    return themeColors.filter((c) => c.name.toLowerCase().includes(q));
  }, [themeColors, search]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {fieldDef.label ?? name}
        {fieldDef.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {fieldDef.admin?.description && (
        <p className="text-xs text-muted-foreground">{fieldDef.admin.description}</p>
      )}

      <div className="relative" ref={popoverRef}>
        {/* Color swatch trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          <div
            className="h-5 w-5 rounded border"
            style={{ backgroundColor: value || "transparent" }}
          />
          <span className="text-muted-foreground font-mono text-xs">{value || "No color"}</span>
        </button>

        {/* Popover */}
        {isOpen && (
          <div className="absolute z-50 mt-1 rounded-lg border bg-popover p-3 shadow-lg w-fit">
            {/* Tabs */}
            {showThemeTab && (
              <div className="flex gap-1 mb-3 border-b pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("custom")}
                  className={`px-3 py-1 text-xs rounded-md ${
                    activeTab === "custom"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Custom
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("theme")}
                  className={`px-3 py-1 text-xs rounded-md ${
                    activeTab === "theme"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Theme Colors
                </button>
              </div>
            )}

            {/* Custom color picker */}
            {activeTab === "custom" && (
              <Sketch
                color={value || "#000000"}
                onChange={handleColorChange}
                disableAlpha
              />
            )}

            {/* Theme colors grid */}
            {activeTab === "theme" && showThemeTab && (
              <div className="w-[280px]">
                <input
                  type="text"
                  placeholder="Search colors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border px-2 py-1 text-xs mb-2"
                />
                {filteredThemeColors.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    {themeColors.length === 0
                      ? "No theme colors found"
                      : "No matching colors"}
                  </p>
                ) : (
                  <div className="max-h-[240px] overflow-y-auto space-y-1">
                    {filteredThemeColors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          field.handleChange(c.lightValue);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs hover:bg-accent"
                      >
                        <div
                          className="h-5 w-5 rounded border overflow-hidden relative flex-shrink-0"
                          title={`Light: ${c.lightValue}${c.darkValue ? ` / Dark: ${c.darkValue}` : ""}`}
                        >
                          <div className="absolute inset-0" style={{ backgroundColor: c.lightValue }} />
                          {c.darkValue && (
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundColor: c.darkValue,
                                clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                              }}
                            />
                          )}
                        </div>
                        <span className="font-mono truncate">--{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

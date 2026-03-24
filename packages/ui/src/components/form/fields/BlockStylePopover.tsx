"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type {
  StyleTier,
  BlockStylesData,
  BlockStyleValues,
  BreakpointConfig,
} from "@vexcms/core";
import {
  SPACING_PRESETS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_PRESETS,
  BORDER_RADIUS_PRESETS,
  BOX_SHADOW_PRESETS,
  OPACITY_PRESETS,
  WIDTH_PRESETS,
  MAX_WIDTH_PRESETS,
  LINE_HEIGHT_PRESETS,
  LETTER_SPACING_PRESETS,
  BORDER_WIDTH_PRESETS,
  ASPECT_RATIO_PRESETS,
  type StylePreset,
} from "@vexcms/core";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import {
  Info,
  Copy,
  ClipboardPaste,
  ChevronDown,
  ChevronRight,
  Trash2,
  GripHorizontal,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Style tier → allowed property names mapping
// ---------------------------------------------------------------------------

const CONTAINER_PROPERTIES: (keyof BlockStyleValues)[] = [
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "width",
  "maxWidth",
  "backgroundColor",
  "borderWidth",
  "borderColor",
  "borderStyle",
  "borderRadius",
  "boxShadow",
  "opacity",
  "display",
  "overflow",
];

const TEXT_PROPERTIES: (keyof BlockStyleValues)[] = [
  "textAlign",
  "fontSize",
  "fontWeight",
  "color",
  "lineHeight",
  "letterSpacing",
];

const LAYOUT_PROPERTIES: (keyof BlockStyleValues)[] = [
  "gap",
  "flexDirection",
  "alignItems",
  "justifyContent",
  "flexWrap",
];

const MEDIA_PROPERTIES: (keyof BlockStyleValues)[] = [
  "objectFit",
  "aspectRatio",
  "objectPosition",
];

const TIER_PROPERTIES: Record<StyleTier, (keyof BlockStyleValues)[]> = {
  container: CONTAINER_PROPERTIES,
  text: TEXT_PROPERTIES,
  layout: LAYOUT_PROPERTIES,
  media: MEDIA_PROPERTIES,
};

// ---------------------------------------------------------------------------
// localStorage helpers for copy/paste
// ---------------------------------------------------------------------------

const BLOCK_STYLES_CLIPBOARD_KEY = "vex-block-styles-clipboard";

function copyStylesToClipboard(props: { stylesJson: string }): void {
  try {
    localStorage.setItem(BLOCK_STYLES_CLIPBOARD_KEY, props.stylesJson);
  } catch {
    // Ignore quota errors
  }
}

function getClipboardStyles(): string | null {
  try {
    return localStorage.getItem(BLOCK_STYLES_CLIPBOARD_KEY);
  } catch {
    return null;
  }
}

function stripNonApplicableTiers(props: {
  data: BlockStylesData;
  tiers: StyleTier[];
}): BlockStylesData {
  const allowedKeys = new Set<string>();
  for (const tier of props.tiers) {
    for (const key of TIER_PROPERTIES[tier]) {
      allowedKeys.add(key);
    }
  }

  const result: BlockStylesData = {};
  for (const [bp, styles] of Object.entries(props.data)) {
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(styles)) {
      if (allowedKeys.has(key) && value !== undefined && value !== "") {
        filtered[key] = value;
      }
    }
    if (Object.keys(filtered).length > 0) {
      result[bp] = filtered as BlockStyleValues;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Preset Select Component
// ---------------------------------------------------------------------------

function PresetSelect(props: {
  label: string;
  value: string | undefined;
  presets: StylePreset[];
  onChange: (value: string | undefined) => void;
}) {
  const currentPreset = props.presets.find((p) => p.value === props.value);

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <select
        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        value={props.value ?? ""}
        onChange={(e) =>
          props.onChange(e.target.value === "" ? undefined : e.target.value)
        }
      >
        <option value="">—</option>
        {props.presets.map((preset) => (
          <option key={preset.value} value={preset.value} title={preset.hint}>
            {preset.label}
          </option>
        ))}
      </select>
      {currentPreset?.hint && (
        <span className="text-[10px] text-muted-foreground">
          {currentPreset.hint}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enum Select Component
// ---------------------------------------------------------------------------

function EnumSelect(props: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <select
        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        value={props.value ?? ""}
        onChange={(e) =>
          props.onChange(e.target.value === "" ? undefined : e.target.value)
        }
      >
        <option value="">—</option>
        {props.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color Input (simplified — text input with color swatch)
// ---------------------------------------------------------------------------

function StyleColorPicker(props: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="w-8 h-8 rounded border border-input cursor-pointer p-0"
          value={
            props.value?.startsWith("#")
              ? props.value
              : props.value
                ? "#000000"
                : "#000000"
          }
          onChange={(e) => props.onChange(e.target.value)}
        />
        <input
          type="text"
          className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="e.g. #3b82f6 or var(--primary)"
          value={props.value ?? ""}
          onChange={(e) =>
            props.onChange(e.target.value === "" ? undefined : e.target.value)
          }
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function StyleSection(props: {
  title: string;
  sectionKey: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-md">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
        onClick={() => props.onToggle(props.sectionKey)}
      >
        {props.isOpen ? (
          <ChevronDown className="size-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground" />
        )}
        {props.title}
      </button>
      {props.isOpen && (
        <div className="px-3 pb-3 space-y-3">{props.children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style Tier Sections
// ---------------------------------------------------------------------------

type StyleChangeHandler = (
  key: keyof BlockStyleValues,
  value: string | undefined,
) => void;

function ContainerStyleSection(props: {
  values: BlockStyleValues;
  onChange: StyleChangeHandler;
  isOpen: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <StyleSection title="Container" sectionKey="container" isOpen={props.isOpen} onToggle={props.onToggle}>
      {/* Spacing */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Margin
        </p>
        <PresetSelect
          label="All sides"
          value={props.values.margin}
          presets={SPACING_PRESETS}
          onChange={(v) => props.onChange("margin", v)}
        />
        <div className="grid grid-cols-2 gap-2">
          <PresetSelect
            label="Top"
            value={props.values.marginTop}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("marginTop", v)}
          />
          <PresetSelect
            label="Right"
            value={props.values.marginRight}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("marginRight", v)}
          />
          <PresetSelect
            label="Bottom"
            value={props.values.marginBottom}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("marginBottom", v)}
          />
          <PresetSelect
            label="Left"
            value={props.values.marginLeft}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("marginLeft", v)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Padding
        </p>
        <PresetSelect
          label="All sides"
          value={props.values.padding}
          presets={SPACING_PRESETS}
          onChange={(v) => props.onChange("padding", v)}
        />
        <div className="grid grid-cols-2 gap-2">
          <PresetSelect
            label="Top"
            value={props.values.paddingTop}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("paddingTop", v)}
          />
          <PresetSelect
            label="Right"
            value={props.values.paddingRight}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("paddingRight", v)}
          />
          <PresetSelect
            label="Bottom"
            value={props.values.paddingBottom}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("paddingBottom", v)}
          />
          <PresetSelect
            label="Left"
            value={props.values.paddingLeft}
            presets={SPACING_PRESETS}
            onChange={(v) => props.onChange("paddingLeft", v)}
          />
        </div>
      </div>

      {/* Sizing */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Sizing
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PresetSelect
            label="Width"
            value={props.values.width}
            presets={WIDTH_PRESETS}
            onChange={(v) => props.onChange("width", v)}
          />
          <PresetSelect
            label="Max Width"
            value={props.values.maxWidth}
            presets={MAX_WIDTH_PRESETS}
            onChange={(v) => props.onChange("maxWidth", v)}
          />
        </div>
      </div>

      {/* Background */}
      <StyleColorPicker
        label="Background Color"
        value={props.values.backgroundColor}
        onChange={(v) => props.onChange("backgroundColor", v)}
      />

      {/* Border */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Border
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PresetSelect
            label="Width"
            value={props.values.borderWidth}
            presets={BORDER_WIDTH_PRESETS}
            onChange={(v) => props.onChange("borderWidth", v)}
          />
          <EnumSelect
            label="Style"
            value={props.values.borderStyle}
            options={[
              { value: "solid", label: "Solid" },
              { value: "dashed", label: "Dashed" },
              { value: "dotted", label: "Dotted" },
              { value: "none", label: "None" },
            ]}
            onChange={(v) => props.onChange("borderStyle", v)}
          />
        </div>
        <StyleColorPicker
          label="Border Color"
          value={props.values.borderColor}
          onChange={(v) => props.onChange("borderColor", v)}
        />
        <PresetSelect
          label="Border Radius"
          value={props.values.borderRadius}
          presets={BORDER_RADIUS_PRESETS}
          onChange={(v) => props.onChange("borderRadius", v)}
        />
      </div>

      {/* Effects */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Effects
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PresetSelect
            label="Box Shadow"
            value={props.values.boxShadow}
            presets={BOX_SHADOW_PRESETS}
            onChange={(v) => props.onChange("boxShadow", v)}
          />
          <PresetSelect
            label="Opacity"
            value={props.values.opacity}
            presets={OPACITY_PRESETS}
            onChange={(v) => props.onChange("opacity", v)}
          />
        </div>
      </div>

      {/* Display */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Display
        </p>
        <div className="grid grid-cols-2 gap-2">
          <EnumSelect
            label="Display"
            value={props.values.display}
            options={[
              { value: "block", label: "Block" },
              { value: "flex", label: "Flex" },
              { value: "grid", label: "Grid" },
              { value: "inline-flex", label: "Inline Flex" },
              { value: "none", label: "None" },
            ]}
            onChange={(v) => props.onChange("display", v)}
          />
          <EnumSelect
            label="Overflow"
            value={props.values.overflow}
            options={[
              { value: "visible", label: "Visible" },
              { value: "hidden", label: "Hidden" },
              { value: "scroll", label: "Scroll" },
              { value: "auto", label: "Auto" },
            ]}
            onChange={(v) => props.onChange("overflow", v)}
          />
        </div>
      </div>
    </StyleSection>
  );
}

function TextStyleSection(props: {
  values: BlockStyleValues;
  onChange: StyleChangeHandler;
  isOpen: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <StyleSection title="Typography" sectionKey="text" isOpen={props.isOpen} onToggle={props.onToggle}>
      <EnumSelect
        label="Text Align"
        value={props.values.textAlign}
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
          { value: "justify", label: "Justify" },
        ]}
        onChange={(v) => props.onChange("textAlign", v)}
      />
      <div className="grid grid-cols-2 gap-2">
        <PresetSelect
          label="Font Size"
          value={props.values.fontSize}
          presets={FONT_SIZE_PRESETS}
          onChange={(v) => props.onChange("fontSize", v)}
        />
        <PresetSelect
          label="Font Weight"
          value={props.values.fontWeight}
          presets={FONT_WEIGHT_PRESETS}
          onChange={(v) => props.onChange("fontWeight", v)}
        />
      </div>
      <StyleColorPicker
        label="Text Color"
        value={props.values.color}
        onChange={(v) => props.onChange("color", v)}
      />
      <div className="grid grid-cols-2 gap-2">
        <PresetSelect
          label="Line Height"
          value={props.values.lineHeight}
          presets={LINE_HEIGHT_PRESETS}
          onChange={(v) => props.onChange("lineHeight", v)}
        />
        <PresetSelect
          label="Letter Spacing"
          value={props.values.letterSpacing}
          presets={LETTER_SPACING_PRESETS}
          onChange={(v) => props.onChange("letterSpacing", v)}
        />
      </div>
    </StyleSection>
  );
}

function LayoutStyleSection(props: {
  values: BlockStyleValues;
  onChange: StyleChangeHandler;
  isOpen: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <StyleSection title="Layout" sectionKey="layout" isOpen={props.isOpen} onToggle={props.onToggle}>
      <PresetSelect
        label="Gap"
        value={props.values.gap}
        presets={SPACING_PRESETS}
        onChange={(v) => props.onChange("gap", v)}
      />
      <EnumSelect
        label="Flex Direction"
        value={props.values.flexDirection}
        options={[
          { value: "row", label: "Row" },
          { value: "column", label: "Column" },
          { value: "row-reverse", label: "Row Reverse" },
          { value: "column-reverse", label: "Column Reverse" },
        ]}
        onChange={(v) => props.onChange("flexDirection", v)}
      />
      <div className="grid grid-cols-2 gap-2">
        <EnumSelect
          label="Align Items"
          value={props.values.alignItems}
          options={[
            { value: "start", label: "Start" },
            { value: "center", label: "Center" },
            { value: "end", label: "End" },
            { value: "stretch", label: "Stretch" },
            { value: "baseline", label: "Baseline" },
          ]}
          onChange={(v) => props.onChange("alignItems", v)}
        />
        <EnumSelect
          label="Justify Content"
          value={props.values.justifyContent}
          options={[
            { value: "start", label: "Start" },
            { value: "center", label: "Center" },
            { value: "end", label: "End" },
            { value: "between", label: "Between" },
            { value: "around", label: "Around" },
            { value: "evenly", label: "Evenly" },
          ]}
          onChange={(v) => props.onChange("justifyContent", v)}
        />
      </div>
      <EnumSelect
        label="Flex Wrap"
        value={props.values.flexWrap}
        options={[
          { value: "wrap", label: "Wrap" },
          { value: "nowrap", label: "No Wrap" },
          { value: "wrap-reverse", label: "Wrap Reverse" },
        ]}
        onChange={(v) => props.onChange("flexWrap", v)}
      />
    </StyleSection>
  );
}

function MediaStyleSection(props: {
  values: BlockStyleValues;
  onChange: StyleChangeHandler;
  isOpen: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <StyleSection title="Media" sectionKey="media" isOpen={props.isOpen} onToggle={props.onToggle}>
      <EnumSelect
        label="Object Fit"
        value={props.values.objectFit}
        options={[
          { value: "cover", label: "Cover" },
          { value: "contain", label: "Contain" },
          { value: "fill", label: "Fill" },
          { value: "none", label: "None" },
          { value: "scale-down", label: "Scale Down" },
        ]}
        onChange={(v) => props.onChange("objectFit", v)}
      />
      <PresetSelect
        label="Aspect Ratio"
        value={props.values.aspectRatio}
        presets={ASPECT_RATIO_PRESETS}
        onChange={(v) => props.onChange("aspectRatio", v)}
      />
      <EnumSelect
        label="Object Position"
        value={props.values.objectPosition}
        options={[
          { value: "center", label: "Center" },
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ]}
        onChange={(v) => props.onChange("objectPosition", v)}
      />
    </StyleSection>
  );
}

// ---------------------------------------------------------------------------
// Main Popover Component
// ---------------------------------------------------------------------------

export interface BlockStylePopoverProps {
  /** Current blockStyles JSON string (from the block instance). */
  blockStylesJson: string | undefined;
  /** Called when styles change. Pass the new JSON string, or undefined to clear. */
  onChange: (blockStylesJson: string | undefined) => void;
  /** Style tiers this block supports. */
  tiers: StyleTier[];
  /** Breakpoint config from vex.config.ts. If undefined, no breakpoint tabs shown. */
  breakpoints?: BreakpointConfig;
  /** Label shown in the floating panel header (block name or type). */
  blockLabel?: string;
}

// ---------------------------------------------------------------------------
// Floating panel (rendered via portal)
// ---------------------------------------------------------------------------

function FloatingStylePanel(props: {
  blockStylesJson: string | undefined;
  onChange: (blockStylesJson: string | undefined) => void;
  tiers: StyleTier[];
  breakpoints?: BreakpointConfig;
  onClose: () => void;
  blockLabel: string;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  activeBreakpoint: string;
  onActiveBreakpointChange: (bp: string) => void;
  openSections: Set<string>;
  onToggleSection: (key: string) => void;
}) {

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: props.position.x,
        startPosY: props.position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [props.position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      props.onPositionChange({
        x: dragRef.current.startPosX + dx,
        y: dragRef.current.startPosY + dy,
      });
    },
    [props.onPositionChange],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Parse current styles
  const stylesData: BlockStylesData = useMemo(() => {
    if (!props.blockStylesJson) return { base: {} };
    try {
      return JSON.parse(props.blockStylesJson);
    } catch {
      return { base: {} };
    }
  }, [props.blockStylesJson]);

  // Compute breakpoint tabs
  const breakpointTabs = useMemo(() => {
    if (!props.breakpoints) return ["base"];
    const sorted = Object.entries(props.breakpoints)
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);
    return ["base", ...sorted];
  }, [props.breakpoints]);

  const hasMultipleBreakpoints = breakpointTabs.length > 1;
  const currentValues: BlockStyleValues =
    stylesData[props.activeBreakpoint] ?? {};

  // Handle property change
  const handleChange = useCallback(
    (key: keyof BlockStyleValues, value: string | undefined) => {
      const newData = { ...stylesData };
      const bpData = { ...newData[props.activeBreakpoint] } as Record<
        string,
        unknown
      >;

      if (value === undefined || value === "") {
        delete bpData[key];
      } else {
        bpData[key] = value;
      }

      if (Object.keys(bpData).length === 0) {
        delete newData[props.activeBreakpoint];
      } else {
        newData[props.activeBreakpoint] = bpData as BlockStyleValues;
      }

      const hasAnyStyles = Object.keys(newData).some(
        (k) => Object.keys(newData[k]).length > 0,
      );

      if (!hasAnyStyles) {
        props.onChange(undefined);
      } else {
        props.onChange(JSON.stringify(newData));
      }
    },
    [stylesData, props.activeBreakpoint, props.onChange],
  );

  const handleCopy = useCallback(() => {
    if (props.blockStylesJson) {
      copyStylesToClipboard({ stylesJson: props.blockStylesJson });
    }
  }, [props.blockStylesJson]);

  const handlePaste = useCallback(() => {
    const clipJson = getClipboardStyles();
    if (!clipJson) return;
    try {
      const clipData = JSON.parse(clipJson) as BlockStylesData;
      const stripped = stripNonApplicableTiers({
        data: clipData,
        tiers: props.tiers,
      });
      if (Object.keys(stripped).length > 0) {
        props.onChange(JSON.stringify(stripped));
      }
    } catch {
      // Invalid clipboard data
    }
  }, [props.tiers, props.onChange]);

  const handleClearAll = useCallback(() => {
    props.onChange(undefined);
  }, [props.onChange]);

  const hasStyles = props.blockStylesJson !== undefined;

  return createPortal(
    <div
      className="fixed z-[200] w-[380px] max-h-[80vh] flex flex-col rounded-lg border bg-popover text-popover-foreground shadow-xl"
      style={{
        left: `${props.position.x}px`,
        top: `${props.position.y}px`,
      }}
    >
      {/* Drag handle + header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate max-w-[160px]">
            {props.blockLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Copy styles"
            onClick={handleCopy}
            disabled={!hasStyles}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Paste styles"
            onClick={handlePaste}
            className="text-muted-foreground hover:text-foreground"
          >
            <ClipboardPaste className="size-3.5" />
          </Button>
          {hasStyles && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Clear all styles"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Close"
            onClick={props.onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Breakpoint tabs */}
      {hasMultipleBreakpoints && (
        <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto shrink-0">
          {breakpointTabs.map((bp) => {
            const isActive = bp === props.activeBreakpoint;
            const bpWidth =
              bp !== "base" && props.breakpoints
                ? props.breakpoints[bp]
                : undefined;
            return (
              <button
                key={bp}
                type="button"
                className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() => props.onActiveBreakpointChange(bp)}
              >
                {bp === "base" ? "Base" : bp}
                {bpWidth !== undefined && (
                  <span className="ml-1 opacity-70">({bpWidth}px)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {props.tiers.includes("container") && (
          <ContainerStyleSection
            values={currentValues}
            onChange={handleChange}
            isOpen={props.openSections.has("container")}
            onToggle={props.onToggleSection}
          />
        )}
        {props.tiers.includes("text") && (
          <TextStyleSection
            values={currentValues}
            onChange={handleChange}
            isOpen={props.openSections.has("text")}
            onToggle={props.onToggleSection}
          />
        )}
        {props.tiers.includes("layout") && (
          <LayoutStyleSection
            values={currentValues}
            onChange={handleChange}
            isOpen={props.openSections.has("layout")}
            onToggle={props.onToggleSection}
          />
        )}
        {props.tiers.includes("media") && (
          <MediaStyleSection
            values={currentValues}
            onChange={handleChange}
            isOpen={props.openSections.has("media")}
            onToggle={props.onToggleSection}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Main export — trigger button + floating panel
// ---------------------------------------------------------------------------

export function BlockStylePopover(props: BlockStylePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [activeBreakpoint, setActiveBreakpoint] = useState("base");
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(props.tiers),
  );

  const handleToggleSection = useCallback((key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const hasStyles = props.blockStylesJson !== undefined;

  // Lazy-init position on first open (needs window)
  const resolvedPosition = position ?? {
    x: typeof window !== "undefined" ? Math.max(window.innerWidth - 420, 100) : 100,
    y: 80,
  };

  return (
    <>
      <button
        type="button"
        className={`shrink-0 inline-flex items-center justify-center rounded-md size-6 ${hasStyles ? "text-primary" : "text-muted-foreground"} hover:text-foreground hover:bg-muted-foreground/10 transition-colors`}
        title="Block styles"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Info className="size-3.5" />
      </button>
      {isOpen && (
        <FloatingStylePanel
          blockStylesJson={props.blockStylesJson}
          onChange={props.onChange}
          tiers={props.tiers}
          breakpoints={props.breakpoints}
          onClose={() => setIsOpen(false)}
          blockLabel={props.blockLabel ?? "Block Styles"}
          position={resolvedPosition}
          onPositionChange={setPosition}
          activeBreakpoint={activeBreakpoint}
          onActiveBreakpointChange={setActiveBreakpoint}
          openSections={openSections}
          onToggleSection={handleToggleSection}
        />
      )}
    </>
  );
}

"use client"

import { useVexField } from "@vexcms/ui"
import { icons } from "lucide-react"
import { useMemo } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox"
import { Label } from "~/components/ui/label"
import { cn } from "~/lib/utils"

type IconName = keyof typeof icons

const iconNames = Object.keys(icons) as IconName[]

/**
 * Custom admin field component that renders a searchable icon picker.
 * Stores the selected icon name as a string (e.g. "Zap", "Shield", "Code").
 *
 * When used inside an array field, receives a `field` prop with synthetic
 * state/handleChange. When used at the top level, uses useVexField.
 */
export default function IconPickerField({
  name,
  field: syntheticField,
}: {
  name: string
  fieldDef?: any
  readOnly?: boolean
  field?: {
    state: { value: unknown }
    handleChange: (value: unknown) => void
  }
}) {
  // Use synthetic field from array context, or useVexField for top-level
  const vexField = useVexField<string>({ name })

  const value = syntheticField
    ? (syntheticField.state.value as string) ?? ""
    : vexField.value ?? ""

  const setValueFn = syntheticField
    ? (v: string) => syntheticField.handleChange(v)
    : (v: string) => vexField.setValue(v)

  const fieldDef = vexField.fieldDef
  const readOnly = vexField.readOnly

  const selectedIcon = value && value in icons ? value : null
  const SelectedIconComponent = selectedIcon
    ? icons[selectedIcon as IconName]
    : null

  // Sort items so the selected icon appears first
  const sortedItems = useMemo(() => {
    if (!selectedIcon) return iconNames
    return [
      selectedIcon as IconName,
      ...iconNames.filter((n) => n !== selectedIcon),
    ]
  }, [selectedIcon])

  return (
    <div className="space-y-2">
      <Label>{(fieldDef as any)?.label ?? "Icon"}</Label>
      <div className="flex items-start gap-2">
        {/* Icon preview square */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border bg-background",
            selectedIcon
              ? "text-foreground"
              : "text-muted-foreground/40"
          )}
        >
          {SelectedIconComponent ? (
            <SelectedIconComponent className="size-4" />
          ) : null}
        </div>

        {/* Combobox */}
        <div className="flex-1">
          <Combobox
            value={selectedIcon ?? ""}
            onValueChange={(val) => {
              // Toggle: clicking the already-selected icon deselects it
              if (val === selectedIcon) {
                setValueFn("")
              } else {
                setValueFn((val as string) ?? "")
              }
            }}
            items={sortedItems}
          >
            <ComboboxInput
              placeholder="Search icons..."
              disabled={readOnly}
            />
            <ComboboxContent>
              <ComboboxEmpty>No icons found</ComboboxEmpty>
              <ComboboxList>
                {(iconName) => {
                  const Icon = icons[iconName as IconName]
                  const isSelected = iconName === selectedIcon
                  return (
                    <ComboboxItem
                      key={iconName}
                      value={iconName}
                      className={cn(isSelected && "bg-accent")}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{iconName}</span>
                    </ComboboxItem>
                  )
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
      {(fieldDef as any)?.admin?.description && (
        <p className="text-muted-foreground text-xs">
          {(fieldDef as any).admin.description}
        </p>
      )}
    </div>
  )
}

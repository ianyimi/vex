# @vexcms/ui

The shared UI component library for [VEX CMS](https://github.com/ianyimi/vex). Provides form components, field renderers, UI primitives, and layout utilities used by the admin panel.

## Installation

```bash
pnpm add @vexcms/ui
```

## Form System

### AppForm

The main form component that renders collection fields with validation:

```tsx
import { AppForm } from "@vexcms/ui"

<AppForm
  schema={zodSchema}
  fieldEntries={fields}
  defaultValues={values}
  onSubmit={handleSubmit}
/>
```

**Props:** `schema`, `fieldEntries`, `defaultValues`, `onSubmit`, `submitAllFields`, `formId`, `uploadFieldStates`, `renderRichTextField`, `onDirtyChange`, `onValuesChange`, `getValuesRef`

### Form Hooks

| Hook | Description |
|------|-------------|
| `useVexField` | Access/modify individual field state (value, errors, readOnly) |
| `useVexForm` | Form-level state (submit, reset, isDirty, isValid) |
| `useVexFormFields` | Work with multiple fields at once |

### VexFormProvider

Context provider for form state management, wrapping TanStack React Form.

## Field Components

Auto-rendered by `AppForm` based on field type:

| Component | Field Type |
|-----------|-----------|
| `TextField` | `text` |
| `NumberField` | `number` |
| `CheckboxFieldForm` | `checkbox` |
| `SelectField` | `select` (single) |
| `MultiSelectField` | `select` (hasMany) |
| `DateField` | `date` |
| `ImageUrlField` | `imageUrl` |
| `UploadField` | `upload` |
| `BlocksField` | `blocks` (with drag-and-drop reordering) |
| `UIField` | `ui` (custom render) |

## UI Primitives

28 reusable components built on [Base UI](https://base-ui.com/):

**Inputs & Forms:** Button, Input, Label, CheckboxField, Select, SelectNative, MultiSelect, DatePicker, Calendar

**Layout:** Avatar, Badge, Breadcrumb, Separator, Skeleton, Sidebar, Sheet, Pagination

**Overlays:** Dialog, Popover, Tooltip, DropdownMenu, Collapsible

**Data:** DataTable (TanStack Table integration)

**Media:** MediaPicker, UploadDropzone, CreateMediaModal, FilePreview

## RenderBlocks

Renders an ordered list of blocks based on a component map:

```tsx
import { RenderBlocks } from "@vexcms/ui"

<RenderBlocks
  blocks={page.content}
  components={{ hero: HeroComponent, cta: CTAComponent }}
  fallback={UnknownBlockComponent}
/>
```

## Live Preview

Components for content preview during editing:

| Export | Description |
|--------|-------------|
| `LivePreviewPanel` | Iframe preview panel |
| `BreakpointSelector` | Responsive breakpoint controls |
| `PreviewToggleButton` | Toggle preview on/off |
| `useVexPreview` | Preview state management hook |

## Peer Dependencies

- `react` / `react-dom` — React 18+

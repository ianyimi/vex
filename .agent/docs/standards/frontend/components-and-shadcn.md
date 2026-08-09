---
applies_to: ["packages/react/src/components/**", "packages/next/src/**/*.tsx"]
---
# Components & shadcn/Base UI

- All UI is built on shadcn components (Tailwind styling atop Base UI primitives), copied into
  `packages/react/src/components/ui/` via `npx shadcn@latest add <component>`. Check
  `components/ui/index.ts` for what's installed BEFORE writing a custom primitive — never
  hand-roll tabs/dialogs/dropdowns when a shadcn component exists (ARIA + consistency).
  Installed set includes: button, input, dialog, accordion, tabs, select, textarea, skeleton,
  table, tooltip, separator, sheet, sidebar, label, multi-select, popover, scroll-area,
  dropdown-menu, badge, checkbox, command, alert-dialog, pagination.
- `packages/react/components.json` is configured with the `@wds` registry and `base-vega` style.
- Composition over configuration: composable parts (DialogTrigger/DialogContent/DialogHeader),
  Base UI `mergeProps()` for combining handlers/classNames.
- Variants via `class-variance-authority` + `VariantProps<typeof cva>`; conditional classes via
  `cn()` (`packages/react/src/styles/utils.ts` — twMerge + clsx).
- Base UI `Button` wrapping a non-`<button>` render element (e.g. a link) needs
  `nativeButton={false}` to suppress the accessibility warning.
- Component grouping prefixes: `Admin*` (shell: AdminLayout/AdminSidebar/AdminTopNav),
  `DataTable*` (table compounds), `Media*` (media features). Views end in `View`, modals in
  `Modal`, providers in `Provider`.

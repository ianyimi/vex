---
"@vexcms/core": patch
"@vexcms/react": patch
---

Breaking (pre-0.1.0): `@vexcms/core/convex` is removed — it was always an identical alias of
`@vexcms/core/server`. Import `collectionsApi`, `globalsApi`, `versionsApi`, `vexServerApi`,
`createVexCallbackApi` and every raw server function from `@vexcms/core/server` instead; no
export name changes, only the subpath goes away.

Internal: `src/api/` is dissolved — collection, global and version server operations now live
beside their domain (`collections/api/`, `globals/api/`, `versions/api/`), `media/api/` moved
to the same `<op>/server.ts` scheme, and the shared read/write pipeline moved to `src/db/`.
All four document shapes (`VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument`)
now live together in `src/documents/types.ts`, re-exported from `src/versions/`/`src/media/`
for feature-barrel importers; version constants never moved. `vexConvexApi` moved from
`api/convex.ts` to its own `src/vexConvexApi.ts`. No
public import path outside the removed `./convex` subpath changes.

Breaking (pre-0.1.0): `@vexcms/react`'s admin field components are renamed —
`TextFieldInput`/`EmailFieldInput`/`TextareaFieldInput`/`JsonFieldInput`/`UrlFieldInput`/
`NumberFieldInput`/`CheckboxFieldInput`/`SelectFieldInput`/`DateFieldInput`/`ColorFieldInput`/
`ArrayFieldInput`/`BlocksFieldInput`/`GroupFieldInput`/`RelationshipFieldInput`/
`UploadFieldInput`/`RichTextFieldInput` are now `TextFieldAdmin`/`EmailFieldAdmin`/…/
`RichTextFieldAdmin` (matching the existing `*FieldCell` pairing). The old `createFieldInput`
factory and its entire `components/form/` module (`AppForm`, `AppFormContext`, `FormArray`,
`FormBlocks`, `FormGroup`, `FormTabs`, `FormCollapsible`, `FormRow`, `FormUI`, `FormLabel`,
`FormError`, `FormDescription`, `RenderFields`, `FieldConditionGate`) are removed — every admin
field now composes through the new `@vexcms/react/form` entry (`useAppForm`, `AppForm`, the
`forms/*Field.tsx` components) instead. `useAppForm`/`AppForm` are now also re-exported from
`@vexcms/react`'s root for callers who only need the app form, not its full `/form` surface.

Breaking (pre-0.1.0): `@vexcms/core`'s `InputComponentProps` is removed — it was the per-field
edit-form props shape; `FieldComponentProps` now carries that same shape directly (no more
`extends InputComponentProps`), and the new `FieldControlProps` is the narrower shape an
`admin.components.Input` control-level override receives. `admin.components.Field` is a new
whole-field override slot, composed the same way `admin.components.Input` already was.

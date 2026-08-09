---
applies_to: ["packages/core/src/types/**", "packages/core/src/collections/**", "packages/core/src/fields/**"]
---
# Type Generation: Deep Generics vs Augmented-Module Codegen

Two complementary mechanisms; pick by WHERE the referenced data lives — mechanical rule,
not preference.

- **Same call site → deep generics + conditional types.** Constraint references fields
  defined in the SAME call: `defineCollection.admin.useAsTitle`, `defaultSort`,
  `select.defaultValue` vs its own `options[]`. Pattern: thread
  `TFields extends Record<string, AdminField>` through the signature; extract keys with
  `FieldKeysByType<TFields, "text"> = { [K in keyof TFields]: TFields[K] extends
  { type: "text" } ? K : never }[keyof TFields]`
  (`packages/core/src/collections/types.ts`).
- **Cross call site → augmented-module codegen.** The type system needs facts about a
  collection from elsewhere (document shape, slug union, populate keys, useAsTitle per
  slug): extend the `GeneratedVexTypes` pipeline — core declares the empty interface;
  `vex generate` augments it in the user's `vex.types.ts` via
  `declare module "@vexcms/core"` (`packages/core/src/types/generateVexTypes.ts:1-55`).
- Never force `as const` deep-generic inference across files — brittle, slow editor perf,
  errors at the wrong call site. Codegen mirrors the proven `DocumentBySlug`/`CollectionSlug`
  pattern.
- Generated/augmentation type files live in `packages/core/src/types/` (re-exported via
  `types/index.ts`), never at `src/` root. Interface generation lives in
  `collections/interfaceGen.ts` (name generators for WHAT they emit).
- Select fields emit `{FieldKey}Option` literal-union subtypes during interface generation
  (`packages/core/src/collections/interfaceGen.ts:76-81`); the field property references
  the subtype name.

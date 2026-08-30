---
"@vexcms/core": patch
"@vexcms/react": patch
---

Fix `LucideIconName` accepting ~4,100 names that render nothing.

`@vexcms/core` derived the type from a *default* import of `lucide-react`
(`import type icons from "lucide-react"`). `lucide-react` has no default export, so
TypeScript synthesized one from the module namespace and `keyof typeof icons` widened to
every module export — 5,843 members: alias exports (`AlertCircle`, `AlignCenter`), the
`*Icon`-suffixed duplicates (`UsersIcon`), and non-icon exports (`icons`,
`createLucideIcon`, `Icon`). None of those are keys of the `icons` map that
`<Icon>` indexes at render time, so they type-checked and then rendered `null`.

Both packages now derive the type from the `icons` map (`import type { icons }`), giving
the exact 1,702 canonical names that render. `@vexcms/react` re-exports the core type
instead of declaring its own, and the three `@ts-expect-error` directives in
`AdminSidebar` that masked the two definitions diverging are gone.

`<Icon>` still returns `null` for an unresolved name so untyped data cannot throw, but
outside production it now reports the miss once per name with `console.warn` instead of
failing invisibly.

Breaking for configs that used an alias or `*Icon` name in `admin.icon`: switch to the
canonical name from https://lucide.dev/icons (e.g. `"AlertCircle"` → `"CircleAlert"`,
`"UsersIcon"` → `"Users"`). Those values never rendered.

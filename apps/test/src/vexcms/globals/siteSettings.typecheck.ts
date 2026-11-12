import type { GetGlobalReturn } from "@vexcms/core";

/**
 * Compile-time pin: `getGlobal`'s return type (`GetGlobalReturn`) narrows a
 * populated/depth-populated relationship field to the real TARGET
 * collection's document — not the widened `Record<string, unknown>[]`
 * `GlobalPopulated` used to hardcode for every populated field regardless
 * of target (a real, confirmed core-package gap: `GlobalPopulated` detected
 * "is this a relationship field" by checking `GlobalDocumentBySlug[Slug][K]
 * extends string | undefined`, which never matched the real stored shape —
 * `Id<Target>[]` — so the branch it guarded (narrowing to the resolved
 * target doc) was unreachable code; `getGlobal({ populate: { activeTheme:
 * true } })` always returned the widened fallback).
 *
 * `siteSettings.activeTheme` (`~/vexcms/globals/siteSettings.ts`) is a
 * `relationship()` to `themes` — `Theme` (`~/vex.types.ts`) is the real
 * generated target. Checked purely at the type level (indexed access, no
 * runtime variable): a populated array element is `Theme | HiddenDocument`,
 * so a real property like `fontFamily` only exists on SOME union members —
 * excluding `HiddenDocument` (its own `code: "ACCESS_DENIED"` discriminant)
 * first, then indexing by `"fontFamily"`, is what proves the element really
 * is `Theme` (if it had widened to `Record<string, unknown>`, indexing by
 * `"fontFamily"` would resolve to `unknown`, which is NOT assignable to
 * `string | undefined` below).
 *
 * No test runner — `pnpm typecheck` IS the assertion, same convention as
 * `~/auth/access.typecheck.ts` / `~/vexcms/collections/fields.typecheck.ts`.
 */

type ArrayItem<T> = T extends (infer Item)[] ? Item : never;
type RealDoc<T> = Exclude<T, { code: "ACCESS_DENIED" }>;

// ── explicit `populate` ──────────────────────────────────────────────────────
type PopulatedTheme = RealDoc<ArrayItem<NonNullable<GetGlobalReturn<"siteSettings", { activeTheme: true }, 0>>["activeTheme"]>>;

const populatedFontFamily: string | undefined = {} as PopulatedTheme["fontFamily"];
// @ts-expect-error — `notAThemeField` is not a field of `Theme`
type _PopulatedTypoCheck = PopulatedTheme["notAThemeField"];

// ── `depth` (same narrowing `GetGlobalReturn`'s depth branch now shares) ────
type DepthedTheme = RealDoc<ArrayItem<NonNullable<GetGlobalReturn<"siteSettings", Record<string, never>, 1>>["activeTheme"]>>;

const depthedFontFamily: string | undefined = {} as DepthedTheme["fontFamily"];
// @ts-expect-error — `notAThemeField` is not a field of `Theme`
type _DepthedTypoCheck = DepthedTheme["notAThemeField"];

// Consumed so no-unused-vars stays quiet; the assignments above are the assertions.
export const siteSettingsGlobalPopulateTypePins = [populatedFontFamily, depthedFontFamily] as const;

import { tabs, text } from "@vexcms/core";

import { TABLE_SLUG_FIELDS } from "~/db/constants";

/**
 * Compile-time pin: a `tabs()` tab's `admin.condition` is typed against the
 * REAL generated `fields` document (`FieldsExample`, via `TABLE_SLUG_FIELDS`)
 * once `vex generate` has run. No test runner — `pnpm typecheck` IS the
 * assertion, same convention as `~/auth/access.typecheck.ts`.
 *
 * `showAdvanced` is a real field on `fields` (see
 * `~/vexcms/collections/fields.ts`), typed `boolean | undefined` on the
 * generated `FieldsExample` — the valid comparison below compiles, and
 * comparing it against a string literal does NOT (`boolean | undefined` and
 * `string` have no overlap), pinning that `data` really is `FieldsExample`
 * and not `any`.
 *
 * A field-NAME typo (`data.showAdvancedx`) does NOT currently fail to
 * compile here: `FieldsExample extends VexDocument`, and `VexDocument`
 * carries `[key: string]: unknown` (packages/core/src/api/convex.ts) for
 * generic `Record<string, unknown>` call sites (form state, slot props) —
 * every GENERATED per-collection document interface inherits that same
 * catch-all index signature, so any undeclared property name on ANY
 * generated document resolves to `unknown` instead of erroring. This is a
 * real, confirmed core-package gap (reported separately, not app-local), not
 * something this file can work around: removing the index signature from
 * generated interfaces breaks every `<T extends VexDocument>` /
 * `<TData extends TDocument>` generic constraint across `@vexcms/react`
 * (verified: both direct assignment and generic constraint satisfaction
 * fail the moment a generated interface loses the index signature). Until
 * that is fixed, this pin stops at the value-type-mismatch case below,
 * which is the strongest typo-adjacent proof achievable today.
 */
tabs<typeof TABLE_SLUG_FIELDS>({
  tabs: [
    {
      label: "Visibility",
      admin: {
        condition: ({ data }) => data.showAdvanced === true,
      },
      fields: { visibilityNote: text() },
    },
    {
      label: "Visibility (type mismatch)",
      admin: {
        // @ts-expect-error — "showAdvanced" is boolean | undefined; comparing
        // it to a string literal has no overlap and must fail to compile.
        condition: ({ data }) => data.showAdvanced === "yes",
      },
      fields: { visibilityNote: text() },
    },
  ],
});

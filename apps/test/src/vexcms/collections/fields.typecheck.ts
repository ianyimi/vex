import { relationship as reactRelationship } from "@vexcms/react";
import { tabs, text } from "@vexcms/core";

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_FIELDS, TABLE_SLUG_USERS } from "~/db/constants";
import type { Article } from "~/vex.types";

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
 * A field-NAME typo (`data.showAdvancedx`) NOW fails to compile too: every
 * GENERATED per-collection document interface used to inherit `VexDocument`'s
 * `[key: string]: unknown` catch-all (a real, confirmed core-package gap —
 * `packages/core/src/documents/types.ts`), which made any undeclared
 * property name on ANY generated document resolve to `unknown` instead of
 * erroring. Fixed: generated interfaces now extend the closed
 * `VexDocumentShape` (`_id`/`_creationTime` only, no index signature)
 * instead — `VexDocument` itself is unchanged and still backs every
 * generic/pre-generation consumer (`<T extends VexDocument>` across
 * `@vexcms/react`, verified unaffected by a full repo typecheck).
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
    {
      label: "Visibility (typo)",
      admin: {
        // @ts-expect-error — "showAdvancedx" does not exist on FieldsExample;
        // a closed generated interface (no index signature) now catches this.
        condition: ({ data }) => data.showAdvancedx === true,
      },
      fields: { visibilityNote: text() },
    },
  ],
});

// ── field index: additionalFields is typed to the collection's other fields ──
text<typeof TABLE_SLUG_ARTICLES, "slug">({ index: { name: "by_slug_status", additionalFields: ["status"] } });
// @ts-expect-error — a field cannot list itself in its own index
text<typeof TABLE_SLUG_ARTICLES, "slug">({ index: { name: "by_slug_x", additionalFields: ["slug"] } });
// @ts-expect-error — `nope` is not a field of articles
text<typeof TABLE_SLUG_ARTICLES, "slug">({ index: { name: "by_slug_x", additionalFields: ["nope"] } });
// Without the generics, additionalFields is typed against the union of every
// registered field key project-wide, not narrowed to one collection.
text({ index: { name: "by_slug_x", additionalFields: ["slug"] } });

// @ts-expect-error — `nope` is not a field of articles, through the React wrapper too
reactRelationship<typeof TABLE_SLUG_ARTICLES, "authorId">({ collection: { slug: TABLE_SLUG_USERS }, index: { name: "by_author_x", additionalFields: ["nope"] } });

/**
 * Compile-time pin: `Omit<Article, "body">["status"]` keeps `status`'s real
 * literal union (`vex.config.ts`'s `select()` options), instead of
 * widening to `unknown` — the exact symptom a generated interface's
 * inherited `VexDocument` index signature used to cause (see
 * `~/vexcms/collections/fields.typecheck.ts`'s header comment above, and
 * `@vexcms/core`'s `VexDocumentShape`).
 */
type ArticleStatusOmitBody = Omit<Article, "body">["status"];
const articleStatusOk: ArticleStatusOmitBody = ["draft", "published"];
// @ts-expect-error — "nonsense" is not a member of articles' status option union
const articleStatusBad: ArticleStatusOmitBody = ["nonsense"];

export const articleOmitStatusTypePins = [articleStatusOk, articleStatusBad] as const;


import { tabs, text } from "@vexcms/core";
import { TABLE_SLUG_PAGES } from "~/db/constants";

/**
 * P-008 compile-time pin: a `tabs()` tab's `admin.condition` typed against
 * the real generated `pages` document. No test runner — `pnpm --filter test
 * typecheck` IS the assertion.
 */

// A passing tab condition referencing a real `pages` field.
tabs<typeof TABLE_SLUG_PAGES>({
  tabs: [
    {
      label: "Content",
      fields: { title: text({ label: "Title" }) },
      admin: { condition: ({ data }) => data.title.length > 0 },
    },
  ],
});

tabs<typeof TABLE_SLUG_PAGES>({
  tabs: [
    {
      label: "Content",
      fields: { title: text({ label: "Title" }) },
      // @ts-expect-error — "titlee" is a typo; `pages` has no such field.
      admin: { condition: ({ data }) => data.titlee.length > 0 },
    },
  ],
});

import { api } from "@convex/_generated/api"

import { vex } from "~/lib/vex"

export const revalidate = 0

/**
 * Manual, browser-verifiable proof that `populate`/`depth` reach a
 * relationship/upload field nested inside a `blocks()` block, an
 * `array(group())` item, and a plain `group()` — the nested-populate work
 * this page exists to demonstrate.
 *
 * To see it resolve real documents instead of raw ids:
 * 1. Open `/admin/fields`, create (or edit) a "Fields Example" document.
 * 2. In the "Content" blocks field, add a "Container" block and set its
 *    "Related Article" relationship.
 * 3. In the "Content" blocks field, add a "Stat Group" block, add a stat,
 *    and set its "Icon" upload.
 * 4. In the "Info" group, set "Cover Image".
 * 5. Reload this page — each resolved field below renders the TARGET
 *    document's own data (article title, image filename), not a raw id.
 */
export default async function NestedPopulateDemoPage() {
  const docs = await vex.query(api.vex.find, {
    collection: "fields",
    limit: 1,
    populate: {
      content: {
        container: { relatedArticle: true },
        stat_group: { stats: { icon: true } },
      },
      info: { coverImage: true },
    },
  })

  const doc = (docs as Record<string, unknown>[] | undefined)?.[0]

  return (
    <main style={{ padding: 24, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
      <h1>Nested populate demo — &quot;fields&quot; collection</h1>
      {!doc ? (
        <p>
          No &quot;Fields Example&quot; document yet — create one at <code>/admin/fields</code> (see
          this page&apos;s source for the exact fields to fill in), then reload.
        </p>
      ) : (
        <pre>{JSON.stringify(doc, null, 2)}</pre>
      )}
    </main>
  )
}

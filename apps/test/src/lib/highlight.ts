import { createHighlighter, type Highlighter } from "shiki"

import { codeHighlightKey } from "./codeHighlightKey"

/** Languages the `language` select on CodeShowcase and Split can produce. */
export const CODE_LANGUAGES = ["bash", "json", "ts", "tsx"] as const

export type CodeLanguage = (typeof CODE_LANGUAGES)[number]

/**
 * Shiki theme for every code pane, server and browser alike.
 *
 * Tokyo Night supplies the token colours only: `highlightCode` discards
 * shiki's `<pre>` wrapper, which is where a theme's own background and
 * default foreground live, so the pane keeps the Stark Ember surface from
 * `--color-code-bg`/`--color-code-fg` and only the syntax colours change.
 */
export const CODE_THEME = "tokyo-night"

/**
 * Narrows an authored `language` value to one shiki is loaded for.
 *
 * The field is a `select`, so the value is an array and can also be a stale
 * string left by a hand-edit. Anything unrecognised falls back to `ts`, which
 * is what every pane in the seed uses.
 *
 * @param value - Raw field value.
 * @returns A language shiki has a grammar loaded for.
 */
export function toCodeLanguage(value: string | string[] | undefined): CodeLanguage {
  const raw = Array.isArray(value) ? value[0] : value
  return (CODE_LANGUAGES as readonly string[]).includes(raw ?? "")
    ? (raw as CodeLanguage)
    : "ts"
}

let highlighterPromise: null | Promise<Highlighter> = null

/**
 * Renders source to highlighted HTML in a server component.
 *
 * Shiki's own `<pre>` wrapper is discarded — the pane supplies its own
 * scrolling frame — so this returns only the inner markup.
 *
 * @param props - Input props.
 * @param props.code - Source text, exactly as authored in the CMS.
 * @param props.language - Grammar to highlight with.
 * @returns Highlighted inner HTML, safe to inject.
 */
export async function highlightCode(props: {
  code: string
  language: CodeLanguage
}): Promise<string> {
  const highlighter = await getHighlighter()
  const html = highlighter.codeToHtml(props.code, {
    lang: props.language,
    theme: CODE_THEME,
  })
  // `codeToHtml` returns `<pre …><code>…</code></pre>`; keep the inner code
  // element's contents and let the pane own the scroll container.
  const match = /<code[^>]*>([\s\S]*)<\/code>/.exec(html)
  return match?.[1] ?? html
}

/**
 * One process-wide highlighter, created lazily.
 *
 * Loaded with a single theme on purpose: code panes are fixed dark in both
 * light and dark site themes (see the `--color-code-*` tokens in
 * `globals.css`), so there is no second theme to switch between and the
 * client ships no highlighter at all.
 *
 * @returns The shared shiki highlighter.
 */
function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    langs: [...CODE_LANGUAGES],
    themes: [CODE_THEME],
  })
  return highlighterPromise
}

/**
 * Map of {@link codeHighlightKey} to highlighted inner HTML, built on the
 * server and handed to the client tree.
 */
export type CodeHighlightMap = Record<string, string>

/**
 * Pre-highlights every code pane a page's blocks contain.
 *
 * Exists because `PageContent` is a client component (live preview overlays
 * its query result), so nothing below it can `await` shiki. The server walks
 * the fetched document, highlights each pane, and passes plain strings across
 * the boundary; `CodePane` then renders synchronously.
 *
 * The walk is structural rather than block-type-aware: any object carrying a
 * string `code` is a pane, wherever a future block puts it, and its language
 * comes from a sibling `language`/`codeLanguage` field.
 *
 * @param blocks - The document's `blocks` array, as fetched.
 * @returns Highlighted HTML keyed by {@link codeHighlightKey}.
 */
export async function highlightPageBlocks(blocks: unknown): Promise<CodeHighlightMap> {
  const panes: { code: string; language: CodeLanguage }[] = []

  const collect = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(collect)
      return
    }
    if (node === null || typeof node !== "object") return

    const record = node as Record<string, unknown>
    if (typeof record.code === "string" && record.code.length > 0) {
      panes.push({
        code: record.code,
        language: toCodeLanguage(
          (record.language ?? record.codeLanguage) as string | string[] | undefined
        ),
      })
    }
    Object.values(record).forEach(collect)
  }
  collect(blocks)

  const highlighted: CodeHighlightMap = {}
  for (const pane of panes) {
    const key = codeHighlightKey(pane)
    if (highlighted[key] !== undefined) continue
    highlighted[key] = await highlightCode(pane)
  }
  return highlighted
}

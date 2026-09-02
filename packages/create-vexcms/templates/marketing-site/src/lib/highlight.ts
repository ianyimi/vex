import { createHighlighter, type Highlighter, type ThemeRegistrationRaw } from "shiki"

import starkEmber from "./shikiStarkEmber.json"

/** Languages the `language` select on CodeShowcase and Split can produce. */
export const CODE_LANGUAGES = ["bash", "json", "ts", "tsx"] as const

export type CodeLanguage = (typeof CODE_LANGUAGES)[number]

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
    theme: "stark-ember",
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
    themes: [starkEmber as unknown as ThemeRegistrationRaw],
  })
  return highlighterPromise
}

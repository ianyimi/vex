import type { Highlighter } from "shiki"

import { createHighlighter } from "shiki"

import type { CodeLanguage } from "./highlight"

import { CODE_LANGUAGES, CODE_THEME } from "./highlight"

let browserHighlighterPromise: null | Promise<Highlighter> = null

/**
 * Highlights code in the browser, for panes the server never saw.
 *
 * The only caller is `useCodeHighlight`'s miss branch — live preview, where
 * the editor's unsaved source exists nowhere but this tab. Loaded through a
 * dynamic import so shiki stays out of the page's main client chunk.
 *
 * @param props.code - Source text.
 * @param props.language - Grammar to highlight with.
 * @returns Highlighted inner HTML, matching `highlightCode`'s server output.
 */
export async function highlightCodeInBrowser(props: {
  code: string
  language: CodeLanguage
}): Promise<string> {
  browserHighlighterPromise ??= createHighlighter({
    langs: [...CODE_LANGUAGES],
    themes: [CODE_THEME],
  })
  const highlighter = await browserHighlighterPromise
  const html = highlighter.codeToHtml(props.code, {
    lang: props.language,
    theme: CODE_THEME,
  })
  const match = /<code[^>]*>([\s\S]*)<\/code>/.exec(html)
  return match?.[1] ?? html
}

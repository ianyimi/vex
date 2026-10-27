"use client"

import type { ReactNode } from "react"

import { createContext, useContext, useEffect, useState } from "react"

import type { CodeHighlightMap, CodeLanguage } from "~/lib/highlight"

import { codeHighlightKey } from "~/lib/codeHighlightKey"

const CodeHighlightContext = createContext<CodeHighlightMap>({})

/**
 * Supplies the server-built highlight map to the client tree.
 *
 * @param props.highlights - Map produced by `highlightPageBlocks` on the server.
 * @param props.children - The page subtree containing code panes.
 * @returns The provider.
 */
export function CodeHighlightProvider(props: {
  children: ReactNode
  highlights: CodeHighlightMap
}) {
  return (
    <CodeHighlightContext.Provider value={props.highlights}>
      {props.children}
    </CodeHighlightContext.Provider>
  )
}

/**
 * Resolves one pane's highlighted HTML.
 *
 * Server-rendered code hits the precomputed map and never touches a
 * highlighter. Code that only exists in the browser — what an editor is
 * typing right now in live preview — misses, so this lazily imports shiki and
 * highlights client-side. The import is dynamic and inside the miss branch, so
 * an ordinary visitor downloads no highlighter at all.
 *
 * @param props.code - Source text.
 * @param props.language - Resolved grammar name.
 * @returns The highlighted inner HTML, or `undefined` until it is available
 *   (render the raw source meanwhile).
 */
export function useCodeHighlight(props: {
  code: string
  language: CodeLanguage
}): string | undefined {
  const highlights = useContext(CodeHighlightContext)
  const key = codeHighlightKey(props)
  const precomputed = highlights[key]
  const [clientHighlighted, setClientHighlighted] = useState<Record<string, string>>({})

  useEffect(() => {
    if (precomputed !== undefined || clientHighlighted[key] !== undefined) return

    let cancelled = false
    void (async () => {
      // Dynamic on purpose, and the one case the static-import rule exempts:
      // a static import would pull shiki's grammars and wasm into the page's
      // main client chunk for every visitor, when only an editor previewing
      // freshly-typed code ever reaches this branch.
      const { highlightCodeInBrowser } = await import("~/lib/highlightClient")
      const html = await highlightCodeInBrowser(props)
      if (cancelled) return
      setClientHighlighted((previous) => ({ ...previous, [key]: html }))
    })()

    return () => {
      cancelled = true
    }
    // `props.code`/`props.language` are what `key` is derived from.
  }, [key, precomputed, clientHighlighted, props])

  return precomputed ?? clientHighlighted[key]
}

import type { IconNodeMap } from "@vexcms/react"

import { resolveIconNodes } from "@vexcms/react/server"

/**
 * Collects every string `icon` property in the given documents, at any depth.
 *
 * @param props.documents - Page, header or footer documents a route renders.
 * @returns The distinct icon names found.
 */
export function collectIconNames(props: { documents: unknown[] }): Set<string> {
  const names = new Set<string>()
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (value && typeof value === "object") {
      for (const [field, child] of Object.entries(value)) {
        if (field === "icon" && typeof child === "string") names.add(child)
        else visit(child)
      }
    }
  }
  for (const document of props.documents) visit(document)
  return names
}

/**
 * Resolves the icon nodes for the documents a route renders, so the page's
 * `Icon`s paint synchronously from the server HTML.
 *
 * @param props.documents - Documents whose icons the route renders.
 * @returns The map for `IconNodeProvider`.
 */
export async function resolveDocumentIconNodes(props: { documents: unknown[] }): Promise<IconNodeMap> {
  return resolveIconNodes({ names: collectIconNames({ documents: props.documents }) })
}

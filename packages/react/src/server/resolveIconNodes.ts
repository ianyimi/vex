import type { IconNode } from "lucide-react";

import { dynamicIconImports, iconKeyOf, type IconKey } from "../ui/iconKey";

/**
 * Resolves Lucide icon names to their serializable `IconNode`s on the server,
 * for `IconNodeProvider`. Unknown names are skipped; duplicates load once.
 *
 * @param props.names - Icon names collected from the documents a page renders.
 * @returns A map keyed by lucide key, safe to pass across the RSC boundary.
 */
export async function resolveIconNodes(props: { names: Iterable<string> }): Promise<Partial<Record<IconKey, IconNode>>> {
  const keys = new Set<IconKey>();
  for (const name of props.names) {
    const key = iconKeyOf({ name });
    if (key) keys.add(key);
  }
  const entries = await Promise.all(
    [...keys].map(async (key) => {
      const iconModule = (await dynamicIconImports[key]()) as { __iconNode: IconNode };
      return [key, iconModule.__iconNode] as const;
    }),
  );
  return Object.fromEntries(entries);
}

import type { VexConfig, VexField, BlockDef } from "../types";
import { mergeAuthCollectionWithUserCollection } from "../valueTypes/merge";
import { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "../types/media";
import { fieldToTypeString } from "./fieldToTypeString";
import { slugToInterfaceName } from "./slugToInterfaceName";
import { VexError } from "../errors";

/**
 * Generate the complete TypeScript source for `vex.types.ts`.
 *
 * @param props.config - The resolved VexConfig
 * @returns TypeScript source code string
 */
export function generateVexTypes(props: { config: VexConfig }): string {
  const config = props.config;
  const parts: string[] = [];

  // ── 1. Collect all blocks and build name maps ──

  const blocksBySlug = new Map<string, BlockDef>();
  const blockInterfaceNames = new Map<string, string>();

  function collectBlocks(fields: Record<string, VexField>) {
    for (const field of Object.values(fields)) {
      if (field.type === "blocks") {
        for (const block of field.blocks) {
          if (!blocksBySlug.has(block.slug)) {
            blocksBySlug.set(block.slug, block);
            collectBlocks(block.fields as Record<string, VexField>);
          }
        }
      }
    }
  }

  for (const col of config.collections) {
    collectBlocks(col.fields as Record<string, VexField>);
  }
  if (config.media?.collections) {
    for (const col of config.media.collections) {
      collectBlocks(col.fields as Record<string, VexField>);
    }
  }
  for (const g of config.globals) {
    collectBlocks(g.fields as Record<string, VexField>);
  }

  for (const [slug, block] of blocksBySlug) {
    blockInterfaceNames.set(
      slug,
      block.interfaceName ?? slugToInterfaceName({ slug }),
    );
  }

  // ── 2. Build collection & global name maps, check for duplicates ──

  const allNames = new Map<string, string>(); // name → source description

  function registerName(name: string, source: string) {
    if (allNames.has(name)) {
      throw new VexError(
        `Duplicate interface name "${name}" — used by ${allNames.get(name)} and ${source}. ` +
          `Set a unique \`interfaceName\` on one of them.`,
      );
    }
    allNames.set(name, source);
  }

  const collectionNames = new Map<string, string>(); // slug → interfaceName
  for (const col of config.collections) {
    const name = col.interfaceName ?? slugToInterfaceName({ slug: col.slug });
    registerName(name, `collection "${col.slug}"`);
    collectionNames.set(col.slug, name);
  }

  if (config.media?.collections) {
    for (const col of config.media.collections) {
      const name = col.interfaceName ?? slugToInterfaceName({ slug: col.slug });
      registerName(name, `media collection "${col.slug}"`);
      collectionNames.set(col.slug, name);
    }
  }

  // Auth-only collections (not matched to user collections)
  const authCollectionMap = new Map(
    config.auth.collections.map((c) => [c.slug, c]),
  );
  const userCollectionSlugs = new Set(config.collections.map((c) => c.slug));
  const mediaSlugs = new Set(
    (config.media?.collections ?? []).map((c) => c.slug),
  );
  for (const authCol of config.auth.collections) {
    if (!userCollectionSlugs.has(authCol.slug) && !mediaSlugs.has(authCol.slug)) {
      const name = authCol.interfaceName ?? slugToInterfaceName({ slug: authCol.slug });
      registerName(name, `auth collection "${authCol.slug}"`);
      collectionNames.set(authCol.slug, name);
    }
  }

  const globalNames = new Map<string, string>();
  for (const g of config.globals) {
    const name = g.interfaceName ?? slugToInterfaceName({ slug: g.slug });
    registerName(name, `global "${g.slug}"`);
    globalNames.set(g.slug, name);
  }

  for (const [slug, name] of blockInterfaceNames) {
    registerName(name, `block "${slug}"`);
  }

  // ── 3. Check if Id import is needed ──

  let needsIdImport = false;
  function checkForIdFields(fields: Record<string, VexField>) {
    for (const field of Object.values(fields)) {
      if (field.type === "relationship" || field.type === "upload") {
        needsIdImport = true;
      }
    }
  }
  for (const col of config.collections) {
    checkForIdFields(col.fields as Record<string, VexField>);
  }
  if (config.media?.collections) {
    for (const col of config.media.collections) {
      checkForIdFields(col.fields as Record<string, VexField>);
    }
  }
  for (const g of config.globals) {
    checkForIdFields(g.fields as Record<string, VexField>);
  }
  for (const block of blocksBySlug.values()) {
    checkForIdFields(block.fields as Record<string, VexField>);
  }
  // Collections always have _id which is Id<slug>, so always need it
  if (config.collections.length > 0 || (config.media?.collections?.length ?? 0) > 0 || config.globals.length > 0) {
    needsIdImport = true;
  }

  // Check if RichTextDocument import is needed
  let needsRichTextImport = false;
  function checkForRichTextFields(fields: Record<string, VexField>) {
    for (const field of Object.values(fields)) {
      if (field.type === "richtext") {
        needsRichTextImport = true;
      }
    }
  }
  for (const col of config.collections) {
    checkForRichTextFields(col.fields as Record<string, VexField>);
  }
  if (config.media?.collections) {
    for (const col of config.media.collections) {
      checkForRichTextFields(col.fields as Record<string, VexField>);
    }
  }
  for (const g of config.globals) {
    checkForRichTextFields(g.fields as Record<string, VexField>);
  }
  for (const block of blocksBySlug.values()) {
    checkForRichTextFields(block.fields as Record<string, VexField>);
  }

  // ── 4. File header ──

  parts.push("// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️");
  parts.push("");
  if (needsIdImport) {
    parts.push("import type { Id } from './_generated/dataModel';");
  }
  if (needsRichTextImport) {
    parts.push("import type { RichTextDocument } from '@vexcms/core';");
  }
  if (needsIdImport || needsRichTextImport) {
    parts.push("");
  }

  // ── 5. Block interfaces ──

  const sortedBlockSlugs = [...blocksBySlug.keys()].sort();
  for (const slug of sortedBlockSlugs) {
    const block = blocksBySlug.get(slug)!;
    const name = blockInterfaceNames.get(slug)!;
    parts.push(generateBlockInterface({ block, name, blockInterfaceNames }));
    parts.push("");
  }

  // ── 6. Collection interfaces ──

  for (const col of config.collections) {
    const name = collectionNames.get(col.slug)!;
    const authCol = authCollectionMap.get(col.slug);
    let fields: Record<string, VexField>;

    if (authCol) {
      const merged = mergeAuthCollectionWithUserCollection({
        authCollection: authCol,
        userCollection: col,
      });
      fields = merged.fields;
    } else {
      fields = col.fields as Record<string, VexField>;
    }

    const isVersioned = !!(col as any).versions?.drafts;
    parts.push(
      generateCollectionInterface({
        name,
        slug: col.slug,
        fields,
        isVersioned,
        blockInterfaceNames,
      }),
    );
    parts.push("");
  }

  // Auth-only collections
  for (const authCol of config.auth.collections) {
    if (userCollectionSlugs.has(authCol.slug) || mediaSlugs.has(authCol.slug)) continue;
    const name = collectionNames.get(authCol.slug)!;
    parts.push(
      generateCollectionInterface({
        name,
        slug: authCol.slug,
        fields: authCol.fields as Record<string, VexField>,
        isVersioned: false,
        blockInterfaceNames,
      }),
    );
    parts.push("");
  }

  // Media collections
  if (config.media?.collections) {
    for (const col of config.media.collections) {
      const name = collectionNames.get(col.slug)!;
      parts.push(
        generateMediaCollectionInterface({
          name,
          slug: col.slug,
          userFields: col.fields as Record<string, VexField>,
          blockInterfaceNames,
        }),
      );
      parts.push("");
    }
  }

  // ── 7. Global interfaces ──

  for (const g of config.globals) {
    const name = globalNames.get(g.slug)!;
    parts.push(
      generateGlobalInterface({
        name,
        slug: g.slug,
        fields: g.fields as Record<string, VexField>,
        blockInterfaceNames,
      }),
    );
    parts.push("");
  }

  // ── 8. Barrel types ──

  if (collectionNames.size > 0) {
    const entries = [...collectionNames.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, name]) => `  ${slug}: ${name};`)
      .join("\n");
    parts.push(`export interface VexCollectionTypes {\n${entries}\n}`);
    parts.push("");
  }

  if (globalNames.size > 0) {
    const entries = [...globalNames.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, name]) => `  ${slug}: ${name};`)
      .join("\n");
    parts.push(`export interface VexGlobalTypes {\n${entries}\n}`);
    parts.push("");
  }

  return parts.join("\n");
}

// ── Helpers ──

function generateBlockInterface(props: {
  block: BlockDef;
  name: string;
  blockInterfaceNames: Map<string, string>;
}): string {
  const lines: string[] = [];
  lines.push(`export interface ${props.name} {`);
  lines.push(`  blockType: '${props.block.slug}';`);
  lines.push(`  blockName?: string;`);
  lines.push(`  _key: string;`);

  for (const [fieldName, field] of Object.entries(props.block.fields)) {
    const f = field as VexField;
    if (f.type === "ui") continue;
    const label = f.label;
    if (label) lines.push(`  /** ${label} */`);
    const optional = f.required ? "" : "?";
    const typeStr = fieldToTypeString({
      field: f,
      blockInterfaceNames: props.blockInterfaceNames,
    });
    lines.push(`  ${fieldName}${optional}: ${typeStr};`);
  }

  lines.push("}");
  return lines.join("\n");
}

function generateCollectionInterface(props: {
  name: string;
  slug: string;
  fields: Record<string, VexField>;
  isVersioned: boolean;
  blockInterfaceNames: Map<string, string>;
}): string {
  const lines: string[] = [];
  lines.push(`export interface ${props.name} {`);
  lines.push(`  _id: Id<'${props.slug}'>;`);
  lines.push(`  _creationTime: number;`);

  if (props.isVersioned) {
    lines.push(`  vex_status?: 'draft' | 'published';`);
    lines.push(`  vex_version?: number;`);
    lines.push(`  vex_publishedAt?: number;`);
  }

  for (const [fieldName, field] of Object.entries(props.fields)) {
    const f = field as VexField;
    if (f.type === "ui") continue;
    const label = f.label;
    if (label) lines.push(`  /** ${label} */`);
    const optional = f.required ? "" : "?";
    const typeStr = fieldToTypeString({
      field: f,
      blockInterfaceNames: props.blockInterfaceNames,
    });
    lines.push(`  ${fieldName}${optional}: ${typeStr};`);
  }

  lines.push("}");
  return lines.join("\n");
}

function generateMediaCollectionInterface(props: {
  name: string;
  slug: string;
  userFields: Record<string, VexField>;
  blockInterfaceNames: Map<string, string>;
}): string {
  const lines: string[] = [];
  lines.push(`export interface ${props.name} {`);
  lines.push(`  _id: Id<'${props.slug}'>;`);
  lines.push(`  _creationTime: number;`);

  // Locked fields
  lines.push(`  storageId: string;`);
  lines.push(`  filename: string;`);
  lines.push(`  mimeType: string;`);
  lines.push(`  size: number;`);

  // Overridable fields (optional unless user defines them)
  lines.push(`  url?: string;`);
  lines.push(`  width?: number;`);
  lines.push(`  height?: number;`);

  // User-defined fields
  const lockedSet = new Set([...LOCKED_MEDIA_FIELDS, ...OVERRIDABLE_MEDIA_FIELDS]);
  for (const [fieldName, field] of Object.entries(props.userFields)) {
    if (lockedSet.has(fieldName as any)) continue;
    const f = field as VexField;
    if (f.type === "ui") continue;
    const label = f.label;
    if (label) lines.push(`  /** ${label} */`);
    const optional = f.required ? "" : "?";
    const typeStr = fieldToTypeString({
      field: f,
      blockInterfaceNames: props.blockInterfaceNames,
    });
    lines.push(`  ${fieldName}${optional}: ${typeStr};`);
  }

  lines.push("}");
  return lines.join("\n");
}

function generateGlobalInterface(props: {
  name: string;
  slug: string;
  fields: Record<string, VexField>;
  blockInterfaceNames: Map<string, string>;
}): string {
  const lines: string[] = [];
  lines.push(`export interface ${props.name} {`);
  lines.push(`  _id: Id<'vex_globals'>;`);
  lines.push(`  _creationTime: number;`);
  lines.push(`  vexGlobalSlug: '${props.slug}';`);

  for (const [fieldName, field] of Object.entries(props.fields)) {
    const f = field as VexField;
    if (f.type === "ui") continue;
    const label = f.label;
    if (label) lines.push(`  /** ${label} */`);
    const optional = f.required ? "" : "?";
    const typeStr = fieldToTypeString({
      field: f,
      blockInterfaceNames: props.blockInterfaceNames,
    });
    lines.push(`  ${fieldName}${optional}: ${typeStr};`);
  }

  lines.push("}");
  return lines.join("\n");
}

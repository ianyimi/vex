import {
  ADMIN_CUSTOM_SUBJECTS,
  ADMIN_FIELDS,
  type AdminDataField,
  type AdminField,
  type AdminUIField,
  type BlockConfig,
  type CollectionConfig,
  type GlobalConfig,
  type VexAccessConfig,
  type VexConfig,
} from "@vexcms/core";
import type { AnonymizedBlock, AnonymizedConfig, AnonymizedField, AnonymizedResource } from "./types";

interface BlockDefinition {
  id: string;
  paths: string[];
  defaultCollapsed?: boolean;
}

interface AnonymizeContext {
  collectionPaths: Map<string, string>;
  mediaPaths: Map<string, string>;
  blockDefinitions: Map<string, BlockDefinition>;
  blockCounter: { value: number };
  fields: AnonymizedField[];
  flags: { conditions: boolean; slots: boolean; inputMasks: boolean };
}

function buildSlugPathMap(props: { slugs: string[]; prefix: string }): Map<string, string> {
  const map = new Map<string, string>();
  props.slugs.forEach((slug, index) => {
    map.set(slug, `${props.prefix}${index + 1}`);
  });
  return map;
}

function isInjectedUpdatedAt(props: { key: string; field: AdminField }): boolean {
  const meta = props.field.meta as Record<string, unknown> | undefined;
  return (
    props.key === "updatedAt" &&
    props.field.type === ADMIN_FIELDS.commitTs.type &&
    meta?.locked !== true
  );
}

function hasSlotOverrides(components: {
  Input: unknown[];
  Field: unknown[];
  Cell: unknown[];
  Label: unknown[];
  Description: unknown[];
  beforeInput: unknown[];
  afterInput: unknown[];
}): boolean {
  return (
    components.Input.length > 0 ||
    components.Field.length > 0 ||
    components.Cell.length > 0 ||
    components.Label.length > 0 ||
    components.Description.length > 0 ||
    components.beforeInput.length > 0 ||
    components.afterInput.length > 0
  );
}

function hasRootSlotOverrides(admin: VexConfig["admin"]): boolean {
  const perTypeOverride = Object.values(admin.components.fields).some(
    (entry) => (entry?.Input.length ?? 0) > 0 || (entry?.Field.length ?? 0) > 0 || (entry?.Cell.length ?? 0) > 0,
  );
  return (
    perTypeOverride ||
    admin.components.blocks.itemActions.length > 0 ||
    admin.components.blocks.headerActions.length > 0 ||
    admin.components.array.itemActions.length > 0
  );
}

const RESOURCE_HOOK_NAMES = ["beforeChange", "beforeDelete", "afterChange", "afterDelete"] as const;

function buildHookCounts(hooks: object): AnonymizedResource["hookCounts"] {
  const record = hooks as Record<string, unknown>;
  return Object.fromEntries(
    RESOURCE_HOOK_NAMES.map((name) => [name, typeof record[name] === "function" ? 1 : 0]),
  ) as AnonymizedResource["hookCounts"];
}

const AUTH_ADAPTER_KINDS = {
  "better-auth": "betterAuth",
} as const;

function anonymizeAuthAdapter(auth: VexConfig["auth"]): "none" | "betterAuth" | "custom" {
  if (!auth) {
    return "none";
  }
  return AUTH_ADAPTER_KINDS[auth.adapter.name as keyof typeof AUTH_ADAPTER_KINDS] ?? "custom";
}

function anonymizeAccess(access: VexAccessConfig | undefined): AnonymizedConfig["features"]["access"] {
  if (!access) {
    return {
      enabled: false,
      roleCount: 0,
      ruleCount: 0,
      fieldPermissionRuleCount: 0,
      queryConstraintRuleCount: 0,
      callbackRuleCount: 0,
      customActionCount: 0,
      customResourceCount: 0,
      organizations: false,
    };
  }

  const knownSubjects = new Set<string>([
    ...access.resources.map((resource) => resource.slug),
    access.userCollectionSlug,
    ...(access.orgCollectionSlug ? [access.orgCollectionSlug] : []),
    ...Object.keys(ADMIN_CUSTOM_SUBJECTS),
  ]);
  const subjectKeys = new Set<string>();
  for (const subjectChecks of Object.values(access.permissions)) {
    for (const subjectKey of Object.keys(subjectChecks)) {
      subjectKeys.add(subjectKey);
    }
  }
  const customResourceCount = [...subjectKeys].filter((subjectKey) => !knownSubjects.has(subjectKey)).length;

  let ruleCount = 0;
  let fieldPermissionRuleCount = 0;
  let queryConstraintRuleCount = 0;
  let callbackRuleCount = 0;
  for (const subjectChecks of Object.values(access.permissions)) {
    for (const subjectValue of Object.values(subjectChecks)) {
      const checks =
        typeof subjectValue === "boolean" ? [subjectValue] : Object.values(subjectValue as Record<string, unknown>);
      for (const check of checks) {
        ruleCount += 1;
        if (typeof check === "function") {
          callbackRuleCount += 1;
        } else if (check !== null && typeof check === "object") {
          if ("where" in check || "withIndex" in check) {
            queryConstraintRuleCount += 1;
          } else {
            fieldPermissionRuleCount += 1;
          }
        }
      }
    }
  }

  const customActionCount = Object.values(access.customActions ?? {}).reduce(
    (sum, customAction) => sum + (customAction?.query?.length ?? 0) + (customAction?.mutation?.length ?? 0),
    0,
  );

  return {
    enabled: access.enabled,
    roleCount: access.roles.length,
    ruleCount,
    fieldPermissionRuleCount,
    queryConstraintRuleCount,
    callbackRuleCount,
    customActionCount,
    customResourceCount,
    organizations: access.organizations,
  };
}

function dataFieldBase(props: { field: AdminDataField; path: string; context: AnonymizeContext }): AnonymizedField {
  const { field, path, context } = props;
  if (typeof field.admin.condition === "function") {
    context.flags.conditions = true;
  }
  if (hasSlotOverrides(field.admin.components)) {
    context.flags.slots = true;
  }
  return {
    path,
    type: field.type,
    required: field.required,
    hidden: field.admin.hidden,
    readOnly: field.admin.readOnly,
    position: field.admin.position,
    cellAlignment: field.admin.cellAlignment,
    hasValidate: typeof field.validate === "function",
    hasIndex: field.index !== undefined,
    enableSorting: field.admin.enableSorting,
    enableHiding: field.admin.enableHiding,
  };
}

function uiFieldBase(props: { field: AdminUIField; path: string; context: AnonymizeContext }): AnonymizedField {
  const { field, path, context } = props;
  if (typeof field.admin.condition === "function") {
    context.flags.conditions = true;
  }
  return {
    path,
    type: field.type,
    hidden: field.admin.hidden,
    readOnly: field.admin.readOnly,
    position: field.admin.position,
  };
}

/**
 * Walks one field, pushing its flat {@link AnonymizedField} entry (keyed by
 * `path`) onto `context.fields`, then recurses into any children — an
 * array's single `items` row, a group/row/collapsible's child fields, a
 * tabs field's per-tab fields, or a blocks field's placements — extending
 * `path` per the grammar documented on {@link AnonymizedConfig}.
 * @returns Nothing — results are pushed onto `context.fields` (and, for
 *   blocks, registered onto `context.blockDefinitions`) as a side effect.
 */
function anonymizeField(props: { field: AdminField; context: AnonymizeContext; path: string }): void {
  const { field, context, path } = props;

  switch (field.type) {
    case ADMIN_FIELDS.text.type:
    case ADMIN_FIELDS.email.type: {
      const hasMask = field.admin.mask !== undefined && field.admin.mask !== false;
      if (hasMask) context.flags.inputMasks = true;
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMask,
        min: field.min?.[0],
        max: field.max?.[0],
        hasSearchIndex: field.searchIndex !== undefined,
      });
      return;
    }
    case ADMIN_FIELDS.url.type: {
      const hasMask = field.admin.mask !== undefined && field.admin.mask !== false;
      if (hasMask) context.flags.inputMasks = true;
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMask,
        min: field.min?.[0],
        max: field.max?.[0],
      });
      return;
    }
    case ADMIN_FIELDS.number.type: {
      const hasMask = field.admin.mask !== undefined && field.admin.mask !== false;
      if (hasMask) context.flags.inputMasks = true;
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMask,
        min: field.min?.[0],
        max: field.max?.[0],
        step: field.step,
      });
      return;
    }
    case ADMIN_FIELDS.textarea.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        min: field.min?.[0],
        max: field.max?.[0],
        rows: field.rows,
        hasSearchIndex: field.searchIndex !== undefined,
      });
      return;
    case ADMIN_FIELDS.color.type:
      context.fields.push({ ...dataFieldBase({ field, path, context }), format: field.format, themeColors: field.themeColors });
      return;
    case ADMIN_FIELDS.checkbox.type:
      context.fields.push({ ...dataFieldBase({ field, path, context }), defaultValue: field.defaultValue });
      return;
    case ADMIN_FIELDS.date.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        min: field.min?.[0],
        max: field.max?.[0],
        time: {
          hidden: field.time.hidden,
          use12HourFormat: field.time.use12HourFormat,
          timePicker: field.time.timePicker,
        },
      });
      return;
    case ADMIN_FIELDS.select.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMany: field.hasMany,
        optionCount: field.options.length,
        display: field.admin.display,
        searchable: field.admin.searchable,
      });
      return;
    case ADMIN_FIELDS.relationship.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMany: field.hasMany,
        min: field.min?.[0],
        max: field.max?.[0],
        target: context.collectionPaths.get(field.collection.slug),
      });
      return;
    case ADMIN_FIELDS.upload.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMany: field.hasMany,
        min: field.min?.[0],
        max: field.max?.[0],
        hasAccept: field.accept.length > 0,
        target: context.mediaPaths.get(field.to),
      });
      return;
    case ADMIN_FIELDS.richtext.type:
      context.fields.push({ ...dataFieldBase({ field, path, context }), hasMediaTarget: field.mediaCollectionSlug !== undefined });
      return;
    case ADMIN_FIELDS.json.type:
      context.fields.push(dataFieldBase({ field, path, context }));
      return;
    case ADMIN_FIELDS.array.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        min: field.min?.[0],
        max: field.max?.[0],
      });
      anonymizeField({ field: field.items, context, path: `${path}.i` });
      return;
    case ADMIN_FIELDS.group.type:
      context.fields.push({ ...dataFieldBase({ field, path, context }), defaultCollapsed: field.admin.defaultCollapsed });
      walkFields({ fields: field.fields, context, parentPath: path });
      return;
    case ADMIN_FIELDS.blocks.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        defaultCollapsed: field.admin.defaultCollapsed,
        min: field.min?.[0],
        max: field.max?.[0],
      });
      field.blocks.forEach((block, index) => {
        registerBlockPlacement({ block, context, placementPath: `${path}.b${index + 1}` });
      });
      return;
    case ADMIN_FIELDS.tabs.type:
      context.fields.push({ ...uiFieldBase({ field, path, context }), tabCount: field.tabs.length });
      field.tabs.forEach((tab, index) => {
        if (typeof tab.admin?.condition === "function") {
          context.flags.conditions = true;
        }
        walkFields({ fields: tab.fields, context, parentPath: `${path}.t${index + 1}` });
      });
      return;
    case ADMIN_FIELDS.row.type:
      context.fields.push(uiFieldBase({ field, path, context }));
      walkFields({ fields: field.fields, context, parentPath: path });
      return;
    case ADMIN_FIELDS.collapsible.type:
      context.fields.push({ ...uiFieldBase({ field, path, context }), defaultCollapsed: field.admin.defaultCollapsed });
      walkFields({ fields: field.fields, context, parentPath: path });
      return;
    case ADMIN_FIELDS.ui.type:
      context.fields.push({ ...uiFieldBase({ field, path, context }), hasCustomCell: typeof field.admin.components.Cell === "function" });
      return;
    case ADMIN_FIELDS.commitTs.type:
      context.fields.push({ ...dataFieldBase({ field, path, context }), on: field.on, format: field.admin.format });
      return;
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}

/** Walks every (non-injected-`updatedAt`) field in `fields`, assigning each the next local `.fN` under `parentPath`. */
function walkFields(props: { fields: Record<string, AdminField>; context: AnonymizeContext; parentPath: string }): void {
  const entries = Object.entries(props.fields).filter(([key, field]) => !isInjectedUpdatedAt({ key, field }));
  entries.forEach(([, field], index) => {
    anonymizeField({ field, context: props.context, path: `${props.parentPath}.f${index + 1}` });
  });
}

/**
 * Registers one `blocks()` field placement against its block DEFINITION,
 * keyed by `blockType` (the unique discriminant `BlockConfig` stores on
 * every block item — blocks have no `slug`): the first placement assigns
 * the definition its `k<n>` id and walks its fields once (rooted at
 * `${id}.fN`); every placement — including the first — appends
 * `placementPath` to the definition's `paths`.
 */
function registerBlockPlacement(props: { block: BlockConfig; context: AnonymizeContext; placementPath: string }): void {
  const { block, context, placementPath } = props;
  let definition = context.blockDefinitions.get(block.blockType);
  if (!definition) {
    context.blockCounter.value += 1;
    definition = { id: `k${context.blockCounter.value}`, paths: [], defaultCollapsed: block.admin?.defaultCollapsed };
    context.blockDefinitions.set(block.blockType, definition);
    walkFields({ fields: block.fields, context, parentPath: definition.id });
  }
  definition.paths.push(placementPath);
}

function hasTimestamps(fields: Record<string, AdminField>): boolean {
  return Object.entries(fields).some(([key, field]) => isInjectedUpdatedAt({ key, field }));
}

function anonymizeCollectionLike(props: {
  resource: CollectionConfig;
  path: string;
  kind: "collection" | "media";
  context: AnonymizeContext;
  storageAdapterKind?: AnonymizedResource["storageAdapterKind"];
}): AnonymizedResource {
  const { resource, path, kind, context, storageAdapterKind } = props;
  walkFields({ fields: resource.fields, context, parentPath: path });
  return {
    path,
    kind,
    drafts: resource.versions.drafts,
    livePreview: resource.admin.livePreview !== undefined,
    indexCount: resource.indexes?.length ?? 0,
    timestamps: hasTimestamps(resource.fields),
    savedViewCount: resource.admin.views?.length ?? 0,
    defaultSortIsCustom: resource.admin.view.state.sort.field !== "_creationTime",
    bulkDelete: resource.admin.view.state.bulkActions.delete,
    hookCounts: buildHookCounts(resource.hooks),
    storageAdapterKind,
  };
}

function anonymizeGlobal(props: { global: GlobalConfig; path: string; context: AnonymizeContext }): AnonymizedResource {
  const { global, path, context } = props;
  walkFields({ fields: global.fields, context, parentPath: path });
  return {
    path,
    kind: "global",
    drafts: global.versions.drafts,
    livePreview: global.admin.livePreview !== undefined,
    timestamps: hasTimestamps(global.fields),
    hookCounts: buildHookCounts(global.hooks),
  };
}

/**
 * Reduces a resolved `VexConfig` to the privacy-reviewed shape sent as
 * `TelemetryEvent.config` — every collection/global/media/block/field name
 * replaced by a generated path, allowlisted booleans/numbers/enums, and
 * top-level feature flags. No collection, field, block, or role name ever
 * appears in the result.
 *
 * @param props.config - The project's fully-resolved `VexConfig`.
 * @returns The anonymized payload.
 */
export function anonymizeConfig(props: { config: VexConfig }): AnonymizedConfig {
  const { config } = props;
  const collectionPaths = buildSlugPathMap({
    slugs: config.collections.map((collection) => collection.slug),
    prefix: "c",
  });
  const mediaPaths = buildSlugPathMap({
    slugs: config.mediaCollections.map((media) => media.slug),
    prefix: "m",
  });
  const context: AnonymizeContext = {
    collectionPaths,
    mediaPaths,
    blockDefinitions: new Map(),
    blockCounter: { value: 0 },
    fields: [],
    flags: { conditions: false, slots: false, inputMasks: false },
  };

  const resources: AnonymizedResource[] = [
    ...config.collections.map((collection) =>
      anonymizeCollectionLike({
        resource: collection,
        path: collectionPaths.get(collection.slug) as string,
        kind: "collection",
        context,
      }),
    ),
    ...config.globals.map((global, index) => anonymizeGlobal({ global, path: `g${index + 1}`, context })),
    ...config.mediaCollections.map((media) => {
      const adapter = config.storage.adapters.find((candidate) => candidate.name === media.meta.storageAdapter);
      return anonymizeCollectionLike({
        resource: media,
        path: mediaPaths.get(media.slug) as string,
        kind: "media",
        context,
        storageAdapterKind: adapter?.type,
      });
    }),
  ];

  const blocks: AnonymizedBlock[] = [...context.blockDefinitions.values()];
  const nonMediaResources = resources.filter((resource) => resource.kind !== "media");

  return {
    collectionCount: config.collections.length,
    globalCount: config.globals.length,
    mediaCollectionCount: config.mediaCollections.length,
    blockCount: blocks.length,
    fieldCount: context.fields.length,
    resources,
    blocks,
    fields: context.fields,
    features: {
      drafts: nonMediaResources.some((resource) => resource.drafts),
      livePreview:
        config.admin.livePreview.allowedOrigins.length > 0 ||
        Object.keys(config.admin.livePreview.collections).length > 0 ||
        Object.keys(config.admin.livePreview.globals).length > 0 ||
        nonMediaResources.some((resource) => resource.livePreview),
      conditions: context.flags.conditions,
      slots: context.flags.slots || hasRootSlotOverrides(config.admin),
      inputMasks: context.flags.inputMasks || Object.keys(config.fields.inputMasks).length > 0,
      localization: false,
      auth: config.auth !== undefined,
      authAdapter: anonymizeAuthAdapter(config.auth),
      access: anonymizeAccess(config.access),
      hookCount: resources.reduce(
        (sum, resource) => sum + Object.values(resource.hookCounts).reduce((a, b) => a + b, 0),
        0,
      ),
    },
    storageAdapterKinds: [...new Set(config.storage.adapters.map((adapter) => adapter.type))],
  };
}

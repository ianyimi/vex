import { ADMIN_FIELDS, checkbox, date, defineCollection, json, number, select, text } from "@vexcms/core";

import { TABLE_SLUG_TELEMETRY_PROJECTS } from "~/db/constants";

export const telemetryProjects = defineCollection({
  slug: TABLE_SLUG_TELEMETRY_PROJECTS,
  interfaceName: "TelemetryProject",
  timestamps: false,
  labels: {
    singular: "Telemetry Project",
    plural: "Telemetry Projects",
  },
  admin: {
    useAsTitle: "projectId",
    icon: "Gauge",
    view: {
      sort: { field: "lastSeenAt", order: "desc" },
      columns: [
        { field: "projectId", pinned: "left", width: 220 },
        { field: "framework", width: 110 },
        { field: "packageManager", width: 110 },
        { field: "devEventCount", width: 90 },
        { field: "deployEventCount", width: 100 },
        { field: "createEventCount", width: 100 },
        { field: "failedEventCount", width: 90 },
        { field: "lastOutcomeStatus", width: 110 },
        { field: "collectionCount", width: 100 },
        { field: "fieldCount", width: 90 },
        { field: "lastSeenAt", width: 170 },
      ],
      bulkActions: { delete: false },
    },
    views: [
      {
        viewId: "recently-active",
        name: "Recently Active",
        description: "Every known project, newest activity first.",
        state: {
          sort: { field: "lastSeenAt", order: "desc" },
          columns: [
            "projectId",
            "framework",
            "devEventCount",
            "deployEventCount",
            "createEventCount",
            "lastOutcomeStatus",
            "lastSeenAt",
          ],
        },
      },
      {
        viewId: "failing-setups",
        name: "Failing Setups",
        description: "Projects whose most recent event failed.",
        state: {
          where: { field: "lastOutcomeStatus", op: "eq", value: "failed" },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "framework", "lastFailureStage", "lastErrorCode", "failedEventCount", "lastSeenAt"],
        },
      },
      {
        viewId: "uses-drafts",
        name: "Uses Drafts",
        description: "Projects with at least one draft-enabled collection or global.",
        state: {
          where: { field: "featureDrafts", op: "eq", value: true },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "framework", "collectionCount", "fieldCount", "lastSeenAt"],
        },
      },
      {
        viewId: "uses-rbac",
        name: "Uses RBAC",
        description: "Projects with access control enabled.",
        state: {
          where: { field: "accessEnabled", op: "eq", value: true },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "framework", "accessRoleCount", "accessRuleCount", "lastSeenAt"],
        },
      },
      {
        viewId: "query-constraint-access",
        name: "Query-Constraint Access",
        description: "Projects declaring at least one query-constraint access rule.",
        state: {
          where: { field: "accessQueryConstraintRuleCount", op: "gt", value: 0 },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "accessQueryConstraintRuleCount", "accessRuleCount", "lastSeenAt"],
        },
      },
      {
        viewId: "largest-apps",
        name: "Largest Apps",
        description: "Projects ranked by field count.",
        state: {
          sort: { field: "fieldCount", order: "desc" },
          columns: [
            "projectId",
            "collectionCount",
            "fieldCount",
            "globalCount",
            "mediaCollectionCount",
            "blockCount",
            "lastSeenAt",
          ],
        },
      },
      {
        viewId: "most-collections",
        name: "Most Collections",
        description: "Projects ranked by collection count.",
        state: {
          sort: { field: "collectionCount", order: "desc" },
          columns: ["projectId", "collectionCount", "framework", "lastSeenAt"],
        },
      },
      {
        viewId: "most-globals",
        name: "Most Globals",
        description: "Projects ranked by global count.",
        state: {
          sort: { field: "globalCount", order: "desc" },
          columns: ["projectId", "globalCount", "framework", "lastSeenAt"],
        },
      },
      {
        viewId: "nextjs",
        name: "Next.js",
        description: "Projects running the Next.js framework.",
        state: {
          where: { field: "framework", op: "eq", value: "next" },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "packageManager", "devEventCount", "lastSeenAt"],
        },
      },
      {
        viewId: "tanstack",
        name: "TanStack",
        description: "Projects running the TanStack Start framework.",
        state: {
          where: { field: "framework", op: "eq", value: "tanstack" },
          sort: { field: "lastSeenAt", order: "desc" },
          columns: ["projectId", "packageManager", "devEventCount", "lastSeenAt"],
        },
      },
      {
        viewId: "custom-hooks",
        name: "Custom Hooks",
        description: "Projects declaring at least one collection/global lifecycle hook.",
        state: {
          where: { field: "hookCount", op: "gt", value: 0 },
          sort: { field: "hookCount", order: "desc" },
          columns: ["projectId", "hookCount", "framework", "lastSeenAt"],
        },
      },
    ],
  },
  fields: {
    projectId: text({
      label: "Project ID",
      required: true,
      index: "by_projectId",
    }),
    firstSeenAt: date({
      label: "First Seen At",
      required: true,
    }),
    lastSeenAt: date({
      label: "Last Seen At",
      required: true,
      index: "by_lastSeenAt",
      admin: { enableSorting: true },
    }),
    devEventCount: number({
      label: "Dev Event Count",
      required: true,
    }),
    deployEventCount: number({
      label: "Deploy Event Count",
      required: true,
    }),
    createEventCount: number({
      label: "Create Event Count",
      required: true,
    }),
    failedEventCount: number({
      label: "Failed Event Count",
      required: true,
    }),
    lastEvent: select({
      label: "Last Event",
      required: true,
      options: [
        { label: "Dev", value: "dev" },
        { label: "Deploy", value: "deploy" },
        { label: "Create", value: "create" },
      ],
    }),
    lastOutcomeStatus: select({
      label: "Last Outcome",
      required: true,
      options: [
        { label: "Ok", value: "ok" },
        { label: "Failed", value: "failed" },
      ],
    }),
    lastFailureStage: select({
      label: "Last Failure Stage",
      options: [
        { label: "Resolve Config", value: "resolveConfig" },
        { label: "Load Config", value: "loadConfig" },
        { label: "Generate Schema", value: "generateSchema" },
        { label: "Scaffold", value: "scaffold" },
      ],
    }),
    lastErrorCode: select({
      label: "Last Error Code",
      options: [
        { label: "Config Error", value: "configError" },
        { label: "Access Config Error", value: "accessConfigError" },
        { label: "Auth Config Error", value: "authConfigError" },
        { label: "Component Config Error", value: "componentConfigError" },
        { label: "Storage Config Error", value: "storageConfigError" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    framework: select({
      label: "Framework",
      required: true,
      options: [
        { label: "Next.js", value: "next" },
        { label: "TanStack", value: "tanstack" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    packageManager: select({
      label: "Package Manager",
      required: true,
      options: [
        { label: "pnpm", value: "pnpm" },
        { label: "npm", value: "npm" },
        { label: "Yarn", value: "yarn" },
        { label: "Bun", value: "bun" },
        { label: "Unknown", value: "unknown" },
      ],
    }),
    os: text({
      label: "OS",
      required: true,
    }),
    nodeMajor: number({
      label: "Node Major Version",
      required: true,
    }),
    vexCoreVersion: text({
      label: "vex Core Version",
    }),
    scaffoldTemplate: select({
      label: "Scaffold Template",
      options: [
        { label: "Base", value: "base" },
        { label: "Marketing", value: "marketing" },
      ],
    }),
    scaffoldBare: checkbox({
      label: "Scaffold Bare",
    }),
    scaffoldMonorepo: checkbox({
      label: "Scaffold Monorepo",
    }),
    scaffoldEmailPassword: checkbox({
      label: "Scaffold Email/Password Auth",
    }),
    scaffoldOauthProviderCount: number({
      label: "Scaffold OAuth Provider Count",
    }),
    scaffoldOrgs: checkbox({
      label: "Scaffold Organizations",
    }),
    collectionCount: number({
      label: "Collection Count",
      index: "by_collectionCount",
      admin: { enableSorting: true },
    }),
    globalCount: number({
      label: "Global Count",
      index: "by_globalCount",
      admin: { enableSorting: true },
    }),
    mediaCollectionCount: number({
      label: "Media Collection Count",
      index: "by_mediaCollectionCount",
      admin: { enableSorting: true },
    }),
    blockCount: number({
      label: "Block Count",
      index: "by_blockCount",
      admin: { enableSorting: true },
    }),
    fieldCount: number({
      label: "Field Count",
      index: "by_fieldCount",
      admin: { enableSorting: true },
    }),
    fieldTypes: select({
      label: "Field Types",
      hasMany: true,
      options: Object.values(ADMIN_FIELDS).map((field) => ({ label: `${field.type}()`, value: field.type })),
    }),
    featureDrafts: checkbox({
      label: "Uses Drafts",
    }),
    featureLivePreview: checkbox({
      label: "Uses Live Preview",
    }),
    featureConditions: checkbox({
      label: "Uses Conditional Fields",
    }),
    featureSlots: checkbox({
      label: "Uses Admin Slots",
    }),
    featureInputMasks: checkbox({
      label: "Uses Input Masks",
    }),
    featureAuth: checkbox({
      label: "Uses Auth",
    }),
    authAdapter: select({
      label: "Auth Adapter",
      options: [
        { label: "None", value: "none" },
        { label: "Better Auth", value: "betterAuth" },
        { label: "Custom", value: "custom" },
      ],
    }),
    hookCount: number({
      label: "Hook Count",
      index: "by_hookCount",
      admin: { enableSorting: true },
    }),
    accessEnabled: checkbox({
      label: "Access Enabled",
    }),
    accessRoleCount: number({
      label: "Access Role Count",
    }),
    accessRuleCount: number({
      label: "Access Rule Count",
      index: "by_accessRuleCount",
      admin: { enableSorting: true },
    }),
    accessFieldPermissionRuleCount: number({
      label: "Access Field-Permission Rule Count",
    }),
    accessQueryConstraintRuleCount: number({
      label: "Access Query-Constraint Rule Count",
    }),
    accessCallbackRuleCount: number({
      label: "Access Callback Rule Count",
    }),
    accessCustomActionCount: number({
      label: "Access Custom Action Count",
    }),
    accessCustomResourceCount: number({
      label: "Access Custom Resource Count",
    }),
    accessOrganizations: checkbox({
      label: "Access Organizations",
    }),
    storageUsesPresignedUrl: checkbox({
      label: "Storage Uses Presigned URL",
    }),
    configTruncated: checkbox({
      label: "Config Truncated",
    }),
    latestConfig: json({
      label: "Latest Config",
    }),
  },
});

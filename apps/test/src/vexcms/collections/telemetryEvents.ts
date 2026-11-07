import { defineCollection, json, number, select, text } from "@vexcms/core";

import { TABLE_SLUG_TELEMETRY_EVENTS } from "~/db/constants";

export const telemetryEvents = defineCollection({
  slug: TABLE_SLUG_TELEMETRY_EVENTS,
  interfaceName: "TelemetryEvent",
  timestamps: false,
  labels: {
    singular: "Telemetry Event",
    plural: "Telemetry Events",
  },
  admin: {
    useAsTitle: "event",
    icon: "Radar",
    view: {
      sort: { field: "_creationTime", order: "desc" },
      columns: [
        { field: "event", width: 110 },
        { field: "projectId", width: 220 },
        { field: "outcomeStatus", width: 110 },
        { field: "failureStage", width: 150 },
        { field: "errorCode", width: 170 },
        { field: "framework", width: 110 },
        { field: "vexCoreVersion", width: 150 },
        { field: "machineId", hidden: true },
        { field: "schemaVersion", hidden: true },
      ],
      bulkActions: { delete: false },
    },
  },
  fields: {
    event: select({
      label: "Event",
      required: true,
      options: [
        { label: "Dev", value: "dev" },
        { label: "Deploy", value: "deploy" },
        { label: "Create", value: "create" },
      ],
    }),
    schemaVersion: number({
      label: "Schema Version",
      required: true,
    }),
    machineId: text({
      label: "Machine ID",
      required: true,
    }),
    projectId: text({
      label: "Project ID",
      required: true,
      index: "by_projectId",
    }),
    outcomeStatus: select({
      label: "Outcome",
      required: true,
      options: [
        { label: "Ok", value: "ok" },
        { label: "Failed", value: "failed" },
      ],
    }),
    failureStage: select({
      label: "Failure Stage",
      options: [
        { label: "Resolve Config", value: "resolveConfig" },
        { label: "Load Config", value: "loadConfig" },
        { label: "Generate Schema", value: "generateSchema" },
        { label: "Scaffold", value: "scaffold" },
      ],
    }),
    errorCode: select({
      label: "Error Code",
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
    vexCoreVersion: text({
      label: "vex Core Version",
    }),
    payload: json({
      label: "Payload",
      required: true,
    }),
  },
});

export {
  diffSchema,
  makeFieldsOptional,
  addRemovedFieldsAsOptional,
} from "./diffSchema";
export type { SchemaFieldInfo, RemovedFieldInfo, SchemaDiff } from "./diffSchema";

export { planMigration } from "./planMigration";
export type { MigrationOp } from "./planMigration";

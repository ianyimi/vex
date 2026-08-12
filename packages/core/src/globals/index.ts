export { defineGlobal } from "./config";
export type {
  GlobalConfig,
  GlobalConfigInput,
  GlobalAdminConfig,
  GlobalAdminConfigInput,
  ReservedGlobalFieldKey,
} from "./types";
export { getGlobalDefaultValues, getGlobalInputSchema } from "./utils";
export { globalConfigToInterface, globalConfigToFieldTypeMap } from "./interfaceGen";

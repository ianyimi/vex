export { defineGlobal } from "./config";
export type {
  GlobalConfig,
  GlobalConfigInput,
  GlobalAdminConfig,
  GlobalAdminConfigInput,
  ReservedGlobalFieldKey,
} from "./types";
export { globalConfigToInterface } from "./interfaceGen";
export * from "./hooks";

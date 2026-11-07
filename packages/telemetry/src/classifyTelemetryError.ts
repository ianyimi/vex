import type { TelemetryErrorCode } from "./types";

const ERROR_CODE_BY_NAME: Record<string, TelemetryErrorCode> = {
  VexConfigError: "configError",
  VexAccessConfigError: "accessConfigError",
  VexAuthConfigError: "authConfigError",
  VexComponentConfigError: "componentConfigError",
  VexStorageConfigError: "storageConfigError",
};

/**
 * Classifies a caught error into a fixed {@link TelemetryErrorCode} for the
 * telemetry payload, by its `name` — never its message, which may carry
 * project-specific details. Unrecognized error names map to `"unknown"`.
 *
 * @param props.error - The error caught at a vex-owned pipeline stage.
 * @returns The matching allowlisted code, or `"unknown"`.
 */
export function classifyTelemetryError(props: { error: unknown }): TelemetryErrorCode {
  const { error } = props;
  if (error instanceof Error && error.name in ERROR_CODE_BY_NAME) {
    return ERROR_CODE_BY_NAME[error.name] as TelemetryErrorCode;
  }
  return "unknown";
}

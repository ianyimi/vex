import type { TelemetryEnv } from "./types";

const CI_ENV_KEYS = [
  "CI",
  "CONTINUOUS_INTEGRATION",
  "BUILD_NUMBER",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "VERCEL",
  "NETLIFY",
] as const;

/**
 * Detect whether the process is running in a known CI environment.
 * @param props.env - Environment to inspect.
 * @returns `true` when any known CI environment variable is set to a non-empty value.
 */
export function isCi(props: { env: TelemetryEnv }): boolean {
  return CI_ENV_KEYS.some((key) => {
    const value = props.env[key];
    return value !== undefined && value.length > 0;
  });
}

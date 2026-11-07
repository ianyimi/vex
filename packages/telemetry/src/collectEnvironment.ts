import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { TelemetryEnvironment } from "./types";

const LOCKFILE_PACKAGE_MANAGERS = {
  "pnpm-lock.yaml": "pnpm",
  "package-lock.json": "npm",
  "yarn.lock": "yarn",
  "bun.lockb": "bun",
} as const;

function readProjectPackageJson(projectDir: string): Record<string, unknown> {
  const path = join(projectDir, "package.json");
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const LOCAL_VERSION_PREFIXES = ["file:", "link:", "portal:"] as const;

/**
 * Whether a dependency version specifier points at a local path rather than a published release (e.g. `file:../core`, `link:../core`, a path-containing range) — `workspace:*` is NOT local, since it carries no path.
 * @param version - The raw version/range string from `package.json`.
 * @returns `true` when the specifier points at a local path.
 */
function isLocalVersionSpecifier(version: string): boolean {
  return LOCAL_VERSION_PREFIXES.some((prefix) => version.startsWith(prefix)) || version.includes("/");
}

function collectVexVersions(packageJson: Record<string, unknown>): Record<string, string> {
  const versions: Record<string, string> = {};
  const dependencyFields = ["dependencies", "devDependencies"] as const;
  for (const field of dependencyFields) {
    const deps = packageJson[field];
    if (typeof deps !== "object" || deps === null) {
      continue;
    }
    for (const [name, version] of Object.entries(deps as Record<string, string>)) {
      if (name.startsWith("@vexcms/") || name === "create-vexcms") {
        versions[name] = isLocalVersionSpecifier(version) ? "local" : version;
      }
    }
  }
  return versions;
}

const FRAMEWORK_DEPENDENCIES = {
  next: "next",
  "@tanstack/react-start": "tanstack",
} as const;

function detectFramework(packageJson: Record<string, unknown>): TelemetryEnvironment["framework"] {
  const dependencyFields = ["dependencies", "devDependencies"] as const;
  const depNames = new Set<string>();
  for (const field of dependencyFields) {
    const deps = packageJson[field];
    if (typeof deps !== "object" || deps === null) {
      continue;
    }
    for (const name of Object.keys(deps as Record<string, string>)) {
      depNames.add(name);
    }
  }
  for (const [dependency, framework] of Object.entries(FRAMEWORK_DEPENDENCIES)) {
    if (depNames.has(dependency)) {
      return framework;
    }
  }
  return "unknown";
}

function detectPackageManager(props: {
  projectDir: string;
  env: NodeJS.ProcessEnv;
}): TelemetryEnvironment["packageManager"] {
  for (const [lockfile, packageManager] of Object.entries(LOCKFILE_PACKAGE_MANAGERS)) {
    if (existsSync(join(props.projectDir, lockfile))) {
      return packageManager;
    }
  }
  const userAgent = props.env.npm_config_user_agent;
  if (userAgent?.startsWith("pnpm/")) {
    return "pnpm";
  }
  if (userAgent?.startsWith("yarn/")) {
    return "yarn";
  }
  if (userAgent?.startsWith("npm/")) {
    return "npm";
  }
  if (userAgent?.startsWith("bun/")) {
    return "bun";
  }
  return "unknown";
}

/**
 * Collects the build/runtime environment facts recorded on every telemetry
 * event: installed `@vexcms/*` versions, the Node runtime, the OS and the
 * package manager in use.
 *
 * @param props.projectDir Absolute path to the project whose `package.json`
 *   is inspected for `@vexcms/*` / `create-vexcms` dependency versions.
 * @returns The populated {@link TelemetryEnvironment}.
 */
export function collectEnvironment(props: { projectDir: string }): TelemetryEnvironment {
  const packageJson = readProjectPackageJson(props.projectDir);
  return {
    vexVersions: collectVexVersions(packageJson),
    nodeVersion: process.version,
    os: process.platform,
    arch: process.arch,
    packageManager: detectPackageManager({ projectDir: props.projectDir, env: process.env }),
    framework: detectFramework(packageJson),
  };
}

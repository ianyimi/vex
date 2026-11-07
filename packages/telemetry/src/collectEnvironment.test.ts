import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectEnvironment } from "./collectEnvironment";

describe("collectEnvironment", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "vex-telemetry-env-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("collects @vexcms/* and create-vexcms versions from dependencies and devDependencies", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        dependencies: { "@vexcms/core": "0.1.0-alpha.27", react: "19.0.0" },
        devDependencies: { "create-vexcms": "0.1.0-alpha.12", typescript: "5.6.0" },
      }),
    );

    const environment = collectEnvironment({ projectDir });

    expect(environment.vexVersions).toEqual({
      "@vexcms/core": "0.1.0-alpha.27",
      "create-vexcms": "0.1.0-alpha.12",
    });
    expect(environment.nodeVersion).toBe(process.version);
    expect(environment.os).toBe(process.platform);
    expect(environment.arch).toBe(process.arch);
  });

  it("replaces file:/link:/portal: or path-containing @vexcms/* versions with \"local\"", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        dependencies: {
          "@vexcms/core": "file:../core",
          "@vexcms/react": "link:../react",
          "@vexcms/next": "portal:../next",
          "@vexcms/better-auth": "../better-auth",
        },
        devDependencies: {
          "@vexcms/cli": "workspace:*",
          "create-vexcms": "0.1.0-alpha.12",
        },
      }),
    );

    const environment = collectEnvironment({ projectDir });

    expect(environment.vexVersions).toEqual({
      "@vexcms/core": "local",
      "@vexcms/react": "local",
      "@vexcms/next": "local",
      "@vexcms/better-auth": "local",
      "@vexcms/cli": "workspace:*",
      "create-vexcms": "0.1.0-alpha.12",
    });
  });

  it("detects pnpm from a pnpm-lock.yaml", () => {
    writeFileSync(join(projectDir, "package.json"), JSON.stringify({}));
    writeFileSync(join(projectDir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

    expect(collectEnvironment({ projectDir }).packageManager).toBe("pnpm");
  });

  it("falls back to unknown with no lockfile and no npm_config_user_agent", () => {
    writeFileSync(join(projectDir, "package.json"), JSON.stringify({}));
    const previousUserAgent = process.env.npm_config_user_agent;
    delete process.env.npm_config_user_agent;

    try {
      expect(collectEnvironment({ projectDir }).packageManager).toBe("unknown");
    } finally {
      if (previousUserAgent !== undefined) {
        process.env.npm_config_user_agent = previousUserAgent;
      }
    }
  });

  it("returns empty vexVersions and no throw for a missing package.json", () => {
    const environment = collectEnvironment({ projectDir });
    expect(environment.vexVersions).toEqual({});
  });

  it("detects the framework from a next dependency", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ dependencies: { next: "15.0.0" } }),
    );

    expect(collectEnvironment({ projectDir }).framework).toBe("next");
  });

  it("detects the framework from a @tanstack/react-start dependency", () => {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ dependencies: { "@tanstack/react-start": "1.0.0" } }),
    );

    expect(collectEnvironment({ projectDir }).framework).toBe("tanstack");
  });

  it("falls back to unknown framework with neither dependency present", () => {
    writeFileSync(join(projectDir, "package.json"), JSON.stringify({ dependencies: { react: "19.0.0" } }));

    expect(collectEnvironment({ projectDir }).framework).toBe("unknown");
  });
});

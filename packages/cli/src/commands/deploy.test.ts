import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { deployToProduction } = vi.hoisted(() => ({ deployToProduction: vi.fn(() => true) }));

vi.mock("@vexcms/telemetry", () => ({
  classifyTelemetryError: () => "unknown",
  recordTelemetryEvent: vi.fn(async () => {}),
}));
vi.mock("@vexcms/telemetry/config", () => ({
  anonymizeConfig: ({ config }: { config: unknown }) => config,
}));
vi.mock("../lib/loadConfig.js", () => ({
  loadConfig: vi.fn(async () => ({
    schema: { outputPath: "convex/vex.schema.ts" },
    telemetry: { hideLogs: true },
  })),
}));
vi.mock("../lib/resolveConfigPath.js", () => ({
  resolveConfigPath: vi.fn(() => "/project/vex.config.server.ts"),
  isServerConfigPath: vi.fn(() => true),
}));
vi.mock("../lib/convexProcess.js", async () => {
  const actual = await vi.importActual<typeof import("../lib/convexProcess.js")>("../lib/convexProcess.js");
  return { ...actual, deployToProduction };
});
vi.mock("../lib/generateSchema.js", () => ({
  generateAndWrite: vi.fn(async (_config, cwd, _configPath, options) => {
    // Simulate one auto-migration interim push before the final deploy below.
    await options?.pushSchema?.(cwd);
    return { written: true };
  }),
}));

import { deployCommand } from "./deploy";

describe("deployCommand", () => {
  beforeEach(() => {
    deployToProduction.mockClear();
    deployToProduction.mockReturnValue(true);
  });

  it("strips --cmd from the interim push but keeps it on the final deploy", async () => {
    await deployCommand({ cwd: "/project", convexArgs: ["--cmd", "pnpm build"] });

    expect(deployToProduction).toHaveBeenCalledTimes(2);
    expect(deployToProduction).toHaveBeenNthCalledWith(1, { cwd: "/project", convexArgs: [] });
    expect(deployToProduction).toHaveBeenNthCalledWith(2, { cwd: "/project", convexArgs: ["--cmd", "pnpm build"] });
  });

  it("strips --cmd-url-env-var-name and its value from the interim push only", async () => {
    await deployCommand({
      cwd: "/project",
      convexArgs: ["--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"],
    });

    expect(deployToProduction).toHaveBeenNthCalledWith(1, { cwd: "/project", convexArgs: [] });
    expect(deployToProduction).toHaveBeenNthCalledWith(2, {
      cwd: "/project",
      convexArgs: ["--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"],
    });
  });

  it("defaults cwd to process.cwd() when --cwd is not passed", async () => {
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/default/project");
    await deployCommand();
    expect(deployToProduction).toHaveBeenLastCalledWith({ cwd: "/default/project", convexArgs: [] });
    cwdSpy.mockRestore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

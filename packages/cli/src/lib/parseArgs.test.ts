import { describe, expect, it } from "vitest";

import { parseCliArgs } from "./parseArgs";

describe("parseCliArgs", () => {
  it("forwards --cmd and its value to convexArgs for deploy", () => {
    const parsed = parseCliArgs(["deploy", "--cmd", "pnpm build"]);
    expect(parsed.command).toBe("deploy");
    expect(parsed.convexArgs).toEqual(["--cmd", "pnpm build"]);
  });

  it("forwards --preview-create and its value to convexArgs for deploy", () => {
    const parsed = parseCliArgs(["deploy", "--preview-create", "x"]);
    expect(parsed.convexArgs).toEqual(["--preview-create", "x"]);
  });

  it("forwards multiple convex deploy flags in order", () => {
    const parsed = parseCliArgs(["deploy", "--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"]);
    expect(parsed.convexArgs).toEqual(["--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"]);
  });

  it("consumes --cwd itself and never forwards it to convexArgs", () => {
    const parsed = parseCliArgs(["deploy", "--cwd", "/tmp/project", "--cmd", "pnpm build"]);
    expect(parsed.cwd).toBe("/tmp/project");
    expect(parsed.convexArgs).toEqual(["--cmd", "pnpm build"]);
  });

  it("collects no convexArgs for a bare deploy", () => {
    expect(parseCliArgs(["deploy"]).convexArgs).toEqual([]);
  });

  it("forwards every flag vex doesn't own to convexArgs for dev, consuming --once and --cwd", () => {
    const parsed = parseCliArgs([
      "dev",
      "--once",
      "--tail-logs",
      "always",
      "--cwd",
      "/tmp/project",
      "--run=init:seed",
      "-v",
      "--start",
      "next dev",
    ]);
    expect(parsed.once).toBe(true);
    expect(parsed.cwd).toBe("/tmp/project");
    expect(parsed.convexArgs).toEqual(["--tail-logs", "always", "--run=init:seed", "-v", "--start", "next dev"]);
  });

  it("forwards --once on deploy and --json on dev instead of treating them as vex flags", () => {
    const deploy = parseCliArgs(["deploy", "--once"]);
    expect(deploy.once).toBe(false);
    expect(deploy.convexArgs).toEqual(["--once"]);

    const dev = parseCliArgs(["dev", "--json"]);
    expect(dev.json).toBe(false);
    expect(dev.convexArgs).toEqual(["--json"]);
  });

  it("collects no convexArgs for commands that wrap no Convex command", () => {
    expect(parseCliArgs(["generate", "--tail-logs", "always"]).convexArgs).toEqual([]);
    const telemetry = parseCliArgs(["telemetry", "status", "--json"]);
    expect(telemetry.telemetryAction).toBe("status");
    expect(telemetry.json).toBe(true);
    expect(telemetry.convexArgs).toEqual([]);
  });
});

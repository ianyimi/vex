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

  it("never populates convexArgs for a non-deploy command", () => {
    const parsed = parseCliArgs(["dev", "--once", "--cwd", "/tmp/project"]);
    expect(parsed.once).toBe(true);
    expect(parsed.cwd).toBe("/tmp/project");
    expect(parsed.convexArgs).toEqual([]);
  });
});

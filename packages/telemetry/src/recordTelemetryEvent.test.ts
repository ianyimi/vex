import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TELEMETRY_SCHEMA_VERSION } from "./constants";
import { recordTelemetryEvent } from "./recordTelemetryEvent";
import { writeTelemetrySettings } from "./settings";
import type { TelemetryEnv } from "./types";

describe("recordTelemetryEvent", () => {
  let configHome: string;
  let projectDir: string;

  beforeEach(() => {
    configHome = mkdtempSync(join(tmpdir(), "vex-telemetry-config-"));
    projectDir = mkdtempSync(join(tmpdir(), "vex-telemetry-project-"));
  });

  afterEach(() => {
    rmSync(configHome, { recursive: true, force: true });
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("makes no request when DO_NOT_TRACK is set", async () => {
    let requested = false;
    const server = createServer((_req, res) => {
      requested = true;
      res.writeHead(204);
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      DO_NOT_TRACK: "1",
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" } });

    expect(requested).toBe(false);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("sends an event with schemaVersion 1 and no project path string when enabled", async () => {
    const received: { body: string } = { body: "" };
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received.body = Buffer.concat(chunks).toString("utf8");
        res.writeHead(204);
        res.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" } });

    expect(received.body).not.toContain(projectDir);
    const event = JSON.parse(received.body);
    expect(event.schemaVersion).toBe(TELEMETRY_SCHEMA_VERSION);
    expect(event.event).toBe("dev");
    expect(typeof event.projectId).toBe("string");

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("prints the per-run notice once after a send to the local test server (not the first run)", async () => {
    writeTelemetrySettings({
      env: { XDG_CONFIG_HOME: configHome },
      settings: { machineId: "machine-1", salt: "salt-1", noticeShownAt: new Date().toISOString() },
    });
    const server = createServer((_req, res) => {
      res.writeHead(204);
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" } });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy.mock.calls[0]?.[0]).toContain("VexCMS collects anonymous telemetry");

    writeSpy.mockRestore();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("does not print the per-run notice when DO_NOT_TRACK disables telemetry", async () => {
    const env: TelemetryEnv = { XDG_CONFIG_HOME: configHome, DO_NOT_TRACK: "1" };
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" } });

    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("does not print the per-run notice when hideRunNotice is set", async () => {
    writeTelemetrySettings({
      env: { XDG_CONFIG_HOME: configHome },
      settings: { machineId: "machine-1", salt: "salt-1", noticeShownAt: new Date().toISOString() },
    });
    const server = createServer((_req, res) => {
      res.writeHead(204);
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" }, hideRunNotice: true });

    expect(writeSpy).not.toHaveBeenCalled();

    writeSpy.mockRestore();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("on the first run, prints only the first-run notice, not the per-run line", async () => {
    const server = createServer((_req, res) => {
      res.writeHead(204);
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" } });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy.mock.calls[0]?.[0]).toContain("anonymous build-time telemetry");
    expect(writeSpy.mock.calls[0]?.[0]).not.toContain("VexCMS collects anonymous telemetry");

    writeSpy.mockRestore();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("sends the event without config when the config factory throws, and still resolves", async () => {
    const received: { body: string } = { body: "" };
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received.body = Buffer.concat(chunks).toString("utf8");
        res.writeHead(204);
        res.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      XDG_CONFIG_HOME: configHome,
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
    };
    const throwingConfig = (): never => {
      throw new Error("anonymizeConfig blew up");
    };

    await expect(
      recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" }, config: throwingConfig }),
    ).resolves.toBeUndefined();

    const event = JSON.parse(received.body);
    expect(event.outcome).toEqual({ status: "ok" });
    expect(event.config).toBeUndefined();

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("never calls the config factory when telemetry is disabled", async () => {
    const configFactory = vi.fn(() => {
      throw new Error("should never run");
    });
    const env: TelemetryEnv = { XDG_CONFIG_HOME: configHome, DO_NOT_TRACK: "1" };

    await recordTelemetryEvent({ event: "dev", projectDir, env, outcome: { status: "ok" }, config: configFactory });

    expect(configFactory).not.toHaveBeenCalled();
  });
});

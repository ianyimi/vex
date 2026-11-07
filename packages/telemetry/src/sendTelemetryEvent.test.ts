import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TELEMETRY_SCHEMA_VERSION } from "./constants";
import { sendTelemetryEvent } from "./sendTelemetryEvent";
import type { TelemetryEnv, TelemetryEvent } from "./types";

function buildEvent(): TelemetryEvent {
  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    event: "dev",
    machineId: "machine-1",
    projectId: "project-1",
    sentAt: new Date().toISOString(),
    environment: {
      vexVersions: {},
      nodeVersion: process.version,
      os: process.platform,
      arch: process.arch,
      packageManager: "pnpm",
      framework: "unknown",
    },
    outcome: { status: "ok" },
  };
}

describe("sendTelemetryEvent", () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = undefined;
    }
  });

  it("POSTs the event body to the configured endpoint", async () => {
    const received: { body: string } = { body: "" };
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received.body = Buffer.concat(chunks).toString("utf8");
        res.writeHead(204);
        res.end();
      });
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = { VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events` };

    const event = buildEvent();
    await sendTelemetryEvent({ event, env });

    expect(JSON.parse(received.body)).toEqual(event);
  });

  it("resolves within 1.6s and never throws against an endpoint that accepts but never responds", async () => {
    server = createServer(() => {
      // Intentionally never calls res.end() — simulates a blackholed endpoint.
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = { VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events` };

    const start = Date.now();
    await expect(sendTelemetryEvent({ event: buildEvent(), env })).resolves.toBeUndefined();
    expect(Date.now() - start).toBeLessThanOrEqual(1600);
  });

  // Real setTimeout, not fake timers: this exercises `AbortSignal.timeout()`
  // racing a real HTTP server's real response delay — both run on the
  // platform clock, which vitest's fake timers don't drive.
  it("honors a custom timeoutMs — a server responding after ~2s succeeds with timeoutMs 3000", async () => {
    const received: { body: string } = { body: "" };
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        setTimeout(() => {
          received.body = Buffer.concat(chunks).toString("utf8");
          res.writeHead(204);
          res.end();
        }, 2000);
      });
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = { VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events` };

    const event = buildEvent();
    await sendTelemetryEvent({ event, env, timeoutMs: 3000 });

    expect(JSON.parse(received.body)).toEqual(event);
  });

  // Real setTimeout, not fake timers — see the comment on the previous test.
  it("aborts the same ~2s-slow server with the default timeoutMs", async () => {
    const received: { body: string } = { body: "" };
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        setTimeout(() => {
          received.body = Buffer.concat(chunks).toString("utf8");
          res.writeHead(204);
          res.end();
        }, 2000);
      });
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = { VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events` };

    const start = Date.now();
    await expect(sendTelemetryEvent({ event: buildEvent(), env })).resolves.toBeUndefined();
    expect(Date.now() - start).toBeLessThanOrEqual(1600);
    expect(received.body).toBe("");
  });

  it("prints to stderr and makes no request when VEX_TELEMETRY_DEBUG is set", async () => {
    let requested = false;
    server = createServer((_req, res) => {
      requested = true;
      res.writeHead(204);
      res.end();
    });
    await new Promise<void>((resolve) => server?.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const env: TelemetryEnv = {
      VEX_TELEMETRY_ENDPOINT: `http://127.0.0.1:${port}/events`,
      VEX_TELEMETRY_DEBUG: "1",
    };
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const event = buildEvent();
    await sendTelemetryEvent({ event, env });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy.mock.calls[0]?.[0]).toContain(JSON.stringify(event, null, 2));
    expect(requested).toBe(false);

    writeSpy.mockRestore();
  });
});

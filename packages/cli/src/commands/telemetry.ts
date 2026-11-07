import { resolve } from "node:path";

import {
  buildTelemetryEvent,
  fitTelemetryEvent,
  isTelemetryEnabled,
  readTelemetrySettings,
  resolveSettingsPath,
  writeTelemetrySettings,
} from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";

/**
 * `vex telemetry enable|disable|status [--json]` — manage the per-machine
 * telemetry setting and show what would be sent.
 * @param props.action - `"enable"`, `"disable"`, or `"status"`; anything else prints an error and exits 1.
 * @param props.json - For `status`, print the exact `TelemetryEvent` payload instead of a human summary.
 * @param props.cwd - Run as if started from this directory (defaults to `process.cwd()`).
 * @returns Resolves once the requested action has completed.
 */
export async function telemetryCommand(props: {
  action: string | undefined;
  json: boolean;
  cwd?: string;
}): Promise<void> {
  const cwd = props.cwd ? resolve(process.cwd(), props.cwd) : process.cwd();
  const env = process.env;
  const settingsPath = resolveSettingsPath({ env });

  switch (props.action) {
    case "enable": {
      const settings = readTelemetrySettings({ env });
      writeTelemetrySettings({ env, settings: { ...settings, enabled: true } });
      logger.success("Telemetry enabled");
      return;
    }

    case "disable": {
      const settings = readTelemetrySettings({ env });
      writeTelemetrySettings({ env, settings: { ...settings, enabled: false } });
      logger.success("Telemetry disabled");
      return;
    }

    case "status": {
      const settings = readTelemetrySettings({ env });
      const { enabled, reason } = isTelemetryEnabled({ env, settings });

      if (props.json) {
        const configPath = resolveConfigPath(cwd);
        if (!isServerConfigPath(configPath)) {
          logger.error(
            `vex telemetry status --json requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
          );
          process.exit(1);
        }
        const config = await loadConfig({ configPath, projectDir: cwd });
        const event = buildTelemetryEvent({
          event: "dev",
          projectDir: cwd,
          settings,
          config: anonymizeConfig({ config }),
          outcome: { status: "ok" },
        });
        const fittedEvent = fitTelemetryEvent({ event });
        if (!fittedEvent) {
          logger.error("Telemetry payload exceeds the size cap even after truncation — nothing would be sent.");
          process.exit(1);
        }
        console.log(JSON.stringify(fittedEvent, null, 2));
        return;
      }

      logger.info(`Telemetry: ${enabled ? "enabled" : "disabled"} (${reason})`);
      logger.info(`Settings file: ${settingsPath}`);
      return;
    }

    default:
      logger.error(
        `Unknown telemetry action: ${props.action ?? "(none)"}. Use enable, disable, or status.`,
      );
      process.exit(1);
  }
}

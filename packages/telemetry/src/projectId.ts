import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Derives a stable, non-reversible identifier for a project directory.
 *
 * The id is a sha256 hex digest of the machine-local `salt` concatenated
 * with the project's real (symlink-resolved) absolute path, so the same
 * project on the same machine always produces the same id, different
 * machines (different salts) never produce the same id for the same
 * project, and the id cannot be reversed back into a filesystem path.
 *
 * @param props.salt - Machine-local secret from `TelemetrySettings.salt`.
 * @param props.projectDir - Absolute or relative path to the project root.
 * @returns A 64-character lowercase hex sha256 digest.
 */
export function createProjectId(props: { salt: string; projectDir: string }): string {
  const resolvedPath = resolveProjectPath(props.projectDir);
  return createHash("sha256").update(`${props.salt}\0${resolvedPath}`).digest("hex");
}

function resolveProjectPath(projectDir: string): string {
  try {
    return realpathSync(projectDir);
  } catch {
    return resolve(projectDir);
  }
}

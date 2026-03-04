import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Resolve the Convex deployment URL from environment variables or `.env.local`.
 *
 * Priority:
 * 1. `CONVEX_URL` env var
 * 2. `NEXT_PUBLIC_CONVEX_URL` env var
 * 3. `.env.local` file in `cwd`
 */
export function resolveConvexUrl(cwd: string): string | null {
  // Check environment variables first
  if (process.env.CONVEX_URL) return process.env.CONVEX_URL;
  if (process.env.NEXT_PUBLIC_CONVEX_URL)
    return process.env.NEXT_PUBLIC_CONVEX_URL;

  // Fall back to .env.local
  const envPath = resolve(cwd, ".env.local");
  if (!existsSync(envPath)) return null;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const eqIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key === "CONVEX_URL" || key === "NEXT_PUBLIC_CONVEX_URL") {
      return value || null;
    }
  }

  return null;
}

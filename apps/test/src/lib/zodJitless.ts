import { z } from "zod"

/**
 * Turns off Zod 4's JIT probe in the browser.
 *
 * On its first object parse, Zod runs `new Function("")` inside a try/catch
 * to find out whether it may compile parsers. The production CSP has no
 * `'unsafe-eval'`, so the browser blocks it. The throw is caught, but the
 * browser still records a CSP violation, and Lighthouse fails it as an
 * `inspector-issues` entry on every page with an auth form. `jitless` skips
 * the probe.
 *
 * Zod keeps this setting on `globalThis.__zod_globalConfig`, so it covers
 * every Zod 4 copy in the bundle (Better Auth ships its own). Browser-only,
 * so the server keeps compiled parsers.
 *
 * Imported first in `components/providers/client.tsx`, before any module
 * that might parse.
 */
if (typeof window !== "undefined") {
  z.config({ jitless: true })
}

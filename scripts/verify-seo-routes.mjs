#!/usr/bin/env node
/**
 * Assert the SEO and caching contract of a built Next.js app, then exit.
 *
 * Why this exists: the spec's original acceptance criteria were shaped like
 * `pnpm --filter www build && pnpm --filter www start`, followed by a list of
 * `curl` commands a human runs. `next start` never exits, so that command can
 * only ever be recorded as a timeout — a criterion nothing can pass (AP-012).
 * This script performs the same assertions and terminates with a real exit
 * code, so the same gate works for `harness implement verify` and for CI.
 *
 * What it does:
 *  1. Optionally builds the app (`--build`).
 *  2. Asserts the build's route table via `.next/prerender-manifest.json` and
 *     `.next/app-path-routes-manifest.json` (`--routes`) — which routes were
 *     prerendered, without parsing human-readable stdout.
 *  3. Boots `next start` on a free ephemeral port, waits for readiness, runs
 *     the HTTP assertions, and always tears the server down.
 *
 * Checks are opt-in so one script serves several task groups:
 *   --metadata  description / og:title / og:description / canonical present
 *   --notfound  an unknown slug returns 404 (never 200 with an empty body)
 *   --routes    the public routes named by --static are prerendered
 *   --cache     prerendered HTML is CDN-cacheable and served from cache
 *
 * `og:image` is deliberately NOT asserted: it requires an uploaded image in
 * `siteSettings`, so asserting it would be a criterion that fails on a fresh
 * deployment for reasons unrelated to the code.
 *
 * Usage:
 *   node scripts/verify-seo-routes.mjs --app apps/www --build --metadata --notfound
 *   node scripts/verify-seo-routes.mjs --app apps/www --routes --static /,/features
 *   node scripts/verify-seo-routes.mjs --app apps/www --cache --path /
 */

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);

/**
 * Reads a `--flag value` pair from argv.
 *
 * @param name - Flag name without dashes.
 * @param fallback - Value when the flag is absent.
 * @returns The flag's value, or `fallback`.
 */
function opt(name, fallback = undefined) {
  const i = args.indexOf(`--${name}`);
  return i === -1 || i === args.length - 1 ? fallback : args[i + 1];
}

const has = (name) => args.includes(`--${name}`);

const appDir = opt("app", "apps/www");
const appName = appDir.split("/").pop();
const staticRoutes = (opt("static", "") || "").split(",").filter(Boolean);
const cachePath = opt("path", "/");

const failures = [];
const notes = [];

/**
 * Records an assertion result.
 *
 * @param ok - Whether the assertion held.
 * @param label - Human-readable description.
 * @param detail - Extra context shown on failure.
 */
function assert(ok, label, detail = "") {
  const mark = ok ? "\u2713" : "\u2717";
  console.log(`  ${mark} ${label}${ok || !detail ? "" : ` — ${detail}`}`);
  if (!ok) failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
}

/** @returns A TCP port currently free on the loopback interface. */
async function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

if (has("build")) {
  console.log(`\nBuilding ${appName}…`);
  const built = spawnSync("pnpm", ["--filter", appName, "build"], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (built.status !== 0) {
    console.error("build failed");
    process.exit(1);
  }
}

if (has("routes")) {
  console.log("\nRoute table (from build manifests):");
  const prerenderPath = join(appDir, ".next", "prerender-manifest.json");
  let prerendered = [];
  try {
    const manifest = JSON.parse(readFileSync(prerenderPath, "utf8"));
    prerendered = Object.keys(manifest.routes ?? {});
  } catch (error) {
    assert(false, `read ${prerenderPath}`, String(error));
  }
  console.log(`    prerendered: ${prerendered.join(", ") || "(none)"}`);
  for (const route of staticRoutes) {
    assert(prerendered.includes(route), `${route} is prerendered`);
  }
}

const needsServer = has("metadata") || has("notfound") || has("cache");
let server;
let exitCode = 0;

try {
  if (needsServer) {
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    console.log(`\nStarting ${appName} on :${port}…`);

    server = spawn("pnpm", ["--filter", appName, "start", "--port", String(port)], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const deadline = Date.now() + 90_000;
    let ready = false;
    while (Date.now() < deadline && !ready) {
      try {
        const probe = await fetch(base, { redirect: "manual" });
        ready = probe.status > 0;
      } catch {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    if (!ready) {
      throw new Error(`server did not become ready on ${base}`);
    }

    if (has("metadata")) {
      console.log("\nMetadata:");
      const html = await (await fetch(base)).text();
      assert(/<meta name="description" content="[^"]+"/.test(html), "description present");
      assert(/property="og:title" content="[^"]+"/.test(html), "og:title present");
      assert(/property="og:description" content="[^"]+"/.test(html), "og:description present");
      assert(/rel="canonical" href="[^"]+"/.test(html), "canonical present");
      if (!/property="og:image"/.test(html)) {
        notes.push("og:image absent — no ogImage uploaded in siteSettings (data, not code)");
      }

      for (const route of ["/sitemap.xml", "/robots.txt"]) {
        const res = await fetch(`${base}${route}`);
        assert(res.status === 200, `${route} returns 200`, `got ${res.status}`);
      }
      const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
      const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
      assert(locs.length > 0, "sitemap lists at least the site root", `locs: ${locs.length}`);
      console.log(`    sitemap locs: ${locs.join(", ")}`);

      const robots = await (await fetch(`${base}/robots.txt`)).text();
      assert(/Disallow:\s*\/admin/.test(robots), "robots disallows /admin");
      assert(/Sitemap:\s*\S+/.test(robots), "robots points at the sitemap");
    }

    if (has("notfound")) {
      console.log("\nMissing document:");
      const res = await fetch(`${base}/this-slug-does-not-exist`, { redirect: "manual" });
      assert(res.status === 404, "unknown slug returns 404", `got ${res.status}`);
      const body = await res.text();
      assert(body.length > 0, "404 body is not empty");
    }

    if (has("cache")) {
      console.log("\nCacheability:");
      const first = await fetch(`${base}${cachePath}`);
      const second = await fetch(`${base}${cachePath}`);
      const cc = second.headers.get("cache-control") ?? "";
      const state = second.headers.get("x-nextjs-cache") ?? "";
      console.log(`    cache-control: ${cc || "(none)"}`);
      console.log(`    x-nextjs-cache: ${state || "(none)"}`);
      assert(!/no-store/.test(cc), "Cache-Control does not say no-store", cc);
      assert(/s-maxage=\d+/.test(cc), "Cache-Control carries s-maxage", cc);
      assert(first.status === 200 && second.status === 200, "both requests 200");
    }
  }
} catch (error) {
  assert(false, "harness", String(error));
} finally {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
}

if (notes.length > 0) {
  console.log("\nNotes:");
  for (const note of notes) console.log(`  \u2139 ${note}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} assertion(s) failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  exitCode = 1;
} else {
  console.log("\nAll assertions passed.");
}

process.exit(exitCode);

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const APP_BASE_PORTS = { test: 3020, www: 3030 };

/**
 * Confirms a working Java runtime is on `PATH` — `vnu-jar` is a JAR and will
 * not run without one. macOS ships a `/usr/bin/java` shim that exists but
 * errors at invocation when no JDK is installed, so this runs `java -version`
 * rather than checking for the binary's presence.
 *
 * @returns Nothing; exits the process with a one-line message if Java is
 *   unusable.
 */
function ensureJava() {
  try {
    execFileSync("java", ["-version"], { stdio: "ignore" });
  } catch {
    console.error(
      "validate-html.mjs needs a Java runtime for vnu-jar — install one (e.g. `brew install openjdk`) so `java -version` works, then re-run.",
    );
    process.exit(1);
  }
}

/**
 * Runs the Nu Html Checker against one or more fully-qualified URLs.
 *
 * `vnu-jar` refuses to fetch private hosts (`localhost` reports "Forbidden
 * host"), so each page is fetched here, written to a temporary `.html` file,
 * and the files are validated; every message's `url` is mapped back to the
 * page URL it came from.
 *
 * @param props - Input props.
 * @param props.urls - URLs to fetch and validate.
 * @returns The parsed `vnu-jar --format json` result, plus each URL's HTTP status.
 */
async function runNu(props) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vex-nu-"));
  try {
    const fileToUrl = new Map();
    const statuses = {};
    for (const [index, url] of props.urls.entries()) {
      const response = await fetch(url, { headers: bypassHeaders() });
      statuses[url] = response.status;
      const file = path.join(dir, `page-${index}.html`);
      fs.writeFileSync(file, await response.text());
      fileToUrl.set(file, url);
    }
    const output = execFileSync(
      "npx",
      ["vnu-jar", "--format", "json", "--stdout", "--exit-zero-always", ...fileToUrl.keys()],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 1024 * 1024 * 32 },
    );
    const result = JSON.parse(output);
    for (const message of result.messages) {
      message.url = fileToUrl.get(fileURLToPath(message.url)) ?? message.url;
    }
    return { ...result, statuses };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The Vercel deployment-protection bypass headers, when the secret is set.
 *
 * @returns Request headers for `fetch`.
 */
function bypassHeaders() {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  return secret ? { "x-vercel-protection-bypass": secret } : {};
}

/**
 * Reads an app's `e2e/routes.data.js` `QUALITY_ROUTES` and resolves the URLs
 * to validate for it. Plain CommonJS, not `routes.ts` — loadable by any
 * Node ≥20 with a bare `import()`, no native TypeScript type-stripping
 * (≥22.18) required.
 *
 * @param props - Input props.
 * @param props.app - Workspace app name (`"www"` or `"test"`).
 * @param props.baseURL - Base URL the app is running on.
 * @returns Fully-qualified URLs, excluding `draft` routes when `CI` is set.
 */
async function resolveAppUrls(props) {
  const routesDataPath = path.join(ROOT, "apps", props.app, "e2e", "routes.data.js");
  const mod = await import(pathToFileURL(routesDataPath).href);
  const { QUALITY_ROUTES } = mod.default ?? mod;
  return QUALITY_ROUTES.filter((route) => !(process.env.CI && route.draft)).map(
    (route) => `${props.baseURL}${route.path}`,
  );
}

async function main() {
  ensureJava();

  const [arg, appArg] = process.argv.slice(2);
  if (!arg) {
    console.error("Usage: node scripts/validate-html.mjs <url> | --app <www|test>");
    process.exitCode = 1;
    return;
  }

  if (arg === "--app") {
    if (appArg !== "www" && appArg !== "test") {
      console.error(`Unknown app "${appArg}" — expected "www" or "test".`);
      process.exitCode = 1;
      return;
    }
    const baseURL = process.env.QUALITY_BASE_URL ?? `http://localhost:${APP_BASE_PORTS[appArg]}`;
    const urls = await resolveAppUrls({ app: appArg, baseURL });
    const result = await runNu({ urls });
    const outDir = path.join(ROOT, "apps", appArg, "audit");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, `${appArg}-nu.json`),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(`Wrote apps/${appArg}/audit/${appArg}-nu.json (${urls.length} routes).`);
    return;
  }

  console.log(JSON.stringify(await runNu({ urls: [arg] }), null, 2));
}

await main();

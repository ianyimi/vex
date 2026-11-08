/**
 * Calibrates Lighthouse's CPU throttling to the machine running LHCI.
 *
 * `cpuSlowdownMultiplier` is relative to the host CPU: the default 4x turns a
 * high-end desktop (benchmarkIndex ~1500) into a mid-tier phone. GitHub's
 * shared runners are slower than that, so a fixed 4x over-throttles them and
 * total-blocking-time fails pages that pass everywhere else. Run as a script,
 * this measures the host's benchmarkIndex with one Lighthouse pass over a
 * blank local page, prints it, and appends
 * `LHCI_CPU_SLOWDOWN_MULTIPLIER=<value>` to `$GITHUB_ENV` when set, which
 * `lighthouserc.cjs` applies to every audited run.
 */
const { spawn } = require("node:child_process");
const { appendFileSync, mkdtempSync, readFileSync } = require("node:fs");
const { createServer } = require("node:http");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

/**
 * Maps a Lighthouse benchmarkIndex to the CPU slowdown that emulates the
 * mid-tier mobile device Lighthouse targets. Same piecewise fit as the
 * Lighthouse CPU throttling calculator linked from Lighthouse's
 * `docs/throttling.md`.
 *
 * @param {number} benchmarkIndex - `lhr.environment.benchmarkIndex` of the host.
 * @returns {number} The multiplier, rounded to one decimal.
 * @throws {Error} When the host is too slow to emulate the target device.
 */
function cpuSlowdownMultiplier(benchmarkIndex) {
  let multiplier;
  if (benchmarkIndex >= 1300) multiplier = 3 + (benchmarkIndex - 1300) / 233;
  else if (benchmarkIndex >= 800) multiplier = 2 + (benchmarkIndex - 800) / 500;
  else if (benchmarkIndex >= 150) multiplier = 1 + (benchmarkIndex - 150) / 650;
  else {
    throw new Error(
      `benchmarkIndex ${benchmarkIndex} is too slow to emulate Lighthouse's target device`,
    );
  }
  return Math.round(multiplier * 10) / 10;
}

/**
 * Runs Lighthouse once against a blank page served from localhost and returns
 * the benchmarkIndex it measured.
 *
 * @returns {Promise<number>} The host's benchmarkIndex.
 */
async function measureBenchmarkIndex() {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html" });
    response.end("<!doctype html><title>benchmark</title><p>benchmark</p>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const outputPath = join(mkdtempSync(join(tmpdir(), "lh-benchmark-")), "report.json");
  const lighthouseCli = require.resolve("lighthouse/cli/index.js", {
    paths: [require.resolve("@lhci/cli/package.json")],
  });

  try {
    // Async on purpose: a sync spawn would block this process's event loop,
    // and with it the server Lighthouse is loading.
    const status = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          lighthouseCli,
          `http://127.0.0.1:${port}/`,
          "--quiet",
          "--chrome-flags=--headless=new",
          "--only-audits=viewport",
          "--output=json",
          `--output-path=${outputPath}`,
        ],
        { stdio: "inherit" },
      );
      child.on("error", reject);
      child.on("exit", resolve);
    });
    if (status !== 0) throw new Error(`lighthouse exited ${status}`);
    return JSON.parse(readFileSync(outputPath, "utf8")).environment.benchmarkIndex;
  } finally {
    server.close();
  }
}

module.exports = { cpuSlowdownMultiplier };

if (require.main === module) {
  measureBenchmarkIndex().then((benchmarkIndex) => {
    const multiplier = cpuSlowdownMultiplier(benchmarkIndex);
    console.log(`benchmarkIndex ${benchmarkIndex} → cpuSlowdownMultiplier ${multiplier}`);
    if (process.env.GITHUB_ENV) {
      appendFileSync(process.env.GITHUB_ENV, `LHCI_CPU_SLOWDOWN_MULTIPLIER=${multiplier}\n`);
    }
  });
}

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
try {
  execFileSync(dir + "/node_modules/.bin/tsup", ["--no-clean"], {
    cwd: dir,
    stdio: "inherit",
  });
  mkdirSync(dir + "/dist", { recursive: true });
  writeFileSync(dir + "/dist/.build", Date.now().toString());
} catch {
  // build errors should not kill the watcher
}

// Stay alive so node --watch-path only restarts on file changes, not on exit
process.stdin.resume();

import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { interopDefault: true });
const { loadConfig } = await jiti.import("../../packages/cli/src/lib/loadConfig.ts");
const { resolveConfigPath } = await jiti.import("../../packages/cli/src/lib/resolveConfigPath.ts");
const { generateVexSchema } = await import("@vexcms/core");
import fs from "fs";

const cwd = process.cwd();
const configPath = resolveConfigPath(cwd);
const config = await loadConfig({ configPath, projectDir: cwd });
const { contents } = generateVexSchema({ config });
fs.writeFileSync("/tmp/fresh-vex-schema-www.ts", contents);
console.log("done, length", contents.length);

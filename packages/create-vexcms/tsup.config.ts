import { defineConfig } from "tsup";

export default defineConfig({
  noExternal: ["@vexcms/telemetry"],
});

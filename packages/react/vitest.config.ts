import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Installs jest-dom's matchers and the jsdom polyfills the shared test kit
    // needs. Same module consumers point their own `setupFiles` at.
    setupFiles: ["./src/testing/setup.ts"],
    passWithNoTests: true,
    coverage: {
      // Deliberately NOT `enabled: true`. Coverage belongs to the `coverage`
      // script (which passes `--coverage`) and to turbo's `coverage` task,
      // which declares `coverage/**` as its outputs. Enabling it here made the
      // plain `test` script compute coverage too, which cost time and — because
      // vitest wipes `coverage/.tmp` at startup — meant two concurrent runs in
      // one package deleted each other's in-flight temp files and BOTH died on
      // `readCoverageFiles` ENOENT with every test passing.
      // `json-summary` feeds the coverage-policy CI gate (reads
      // coverage/coverage-summary.json's `total.statements.pct`); keep
      // alongside the human-readable `text` reporter.
      reporter: ["text", "json-summary"],
      // `exclude` REPLACES vitest's defaults unless they're spread back in
      // (docs.vitest.dev/guide/coverage#coverage-setup) — do not drop this.
      //
      // Per .agent/docs/standards/testing/coverage-policy.md: only files
      // vendored VERBATIM from a named upstream may be listed here. Every
      // entry below cites its upstream. Any local hand-modification to one
      // of these files returns it to the denominator (remove its line).
      // button.tsx and input.tsx are @wds-registry primitives too but are
      // NOT listed — both received local isPending/icon-slot feature
      // commits after vendoring, so they stay in the denominator.
      exclude: [
        ...coverageConfigDefaults.exclude,
        // shadcn CLI registry primitives (components.json → registries.@wds:
        // "https://wds-shadcn-registry.netlify.app/r/{name}.json"), built on
        // @base-ui/react. Untouched since `shadcn add` — verified via
        // `git log --follow -p` per file, no header comment exists for
        // these (unlike datetime/** below).
        "src/components/ui/alert-dialog.tsx", // .../r/alert-dialog.json
        "src/components/ui/badge.tsx", // .../r/badge.json
        "src/components/ui/card.tsx", // .../r/card.json
        "src/components/ui/checkbox.tsx", // .../r/checkbox.json
        "src/components/ui/command.tsx", // .../r/command.json
        "src/components/ui/dialog.tsx", // .../r/dialog.json
        "src/components/ui/dropdown-menu.tsx", // .../r/dropdown-menu.json
        "src/components/ui/input-group.tsx", // .../r/input-group.json
        "src/components/ui/label.tsx", // .../r/label.json
        "src/components/ui/pagination.tsx", // .../r/pagination.json
        "src/components/ui/popover.tsx", // .../r/popover.json
        "src/components/ui/scroll-area.tsx", // .../r/scroll-area.json
        "src/components/ui/select.tsx", // .../r/select.json
        "src/components/ui/separator.tsx", // .../r/separator.json
        "src/components/ui/sheet.tsx", // .../r/sheet.json
        "src/components/ui/sidebar.tsx", // .../r/sidebar.json
        "src/components/ui/skeleton.tsx", // .../r/skeleton.json
        "src/components/ui/table.tsx", // .../r/table.json
        "src/components/ui/tabs.tsx", // .../r/tabs.json
        "src/components/ui/textarea.tsx", // .../r/textarea.json
        "src/components/ui/tooltip.tsx", // .../r/tooltip.json
        // Hand-vendored (not via the shadcn CLI): copied from
        // https://github.com/huybuidac/shadcn-datetime-picker per the
        // header comment in each file under this directory.
        "src/components/ui/datetime/**",
      ],
      // Reported for visibility only. No thresholds, deliberately: a coverage
      // percentage must never be the thing that fails a run — only a stale test,
      // or a test catching a real problem, should. `reportOnFailure` keeps the
      // numbers visible even when the suite is red.
      reportOnFailure: true,
    },
  },
});

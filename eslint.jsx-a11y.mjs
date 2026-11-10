import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Promotes one `jsx-a11y/flatConfigs.recommended` rule entry's severity to
 * `"error"`, preserving its options array untouched. A rule the preset ships
 * `"off"` (e.g. `control-has-associated-label`, `label-has-for`) stays `"off"`
 * — the preset disables those deliberately (too many false positives on
 * generic markup), so promoting them would make the config stricter than
 * `recommended`, not just blocking instead of warning.
 *
 * @param config - The rule's entry from `flatConfigs.recommended.rules`:
 *   `"off"` | `"warn"` | `"error"` | `[severity, ...options]`.
 * @returns The same shape with severity promoted to `"error"`, or `"off"`
 *   unchanged.
 */
function promoteToError(config) {
  if (config === "off" || (Array.isArray(config) && config[0] === "off")) {
    return "off";
  }
  if (Array.isArray(config)) {
    return ["error", ...config.slice(1)];
  }
  return "error";
}

/**
 * The jsx-a11y flat-config block shared by the root, `apps/www`, and
 * `apps/test` ESLint configs: every `flatConfigs.recommended` rule at its
 * original options, severity promoted to `"error"` (rules the preset leaves
 * `"off"` stay `"off"`).
 */
export const jsxA11yConfig = {
  files: ["**/*.tsx"],
  plugins: {
    "jsx-a11y": jsxA11y,
  },
  rules: Object.fromEntries(
    Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule, config]) => [
      rule,
      promoteToError(config),
    ]),
  ),
};

/**
 * The same rule set as `jsxA11yConfig`, without the `plugins` key — for
 * configs that already register `"jsx-a11y"` via `eslint-config-next`'s
 * `core-web-vitals` config (`apps/test`, `apps/www`, the `base-nextjs`
 * template); re-declaring the plugin under the same key with a different
 * object reference throws `TypeError: Cannot redefine plugin "jsx-a11y"`.
 */
export const jsxA11yRules = {
  files: jsxA11yConfig.files,
  rules: jsxA11yConfig.rules,
};

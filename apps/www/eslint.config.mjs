import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import importX from "eslint-plugin-import-x"
import perfectionist from "eslint-plugin-perfectionist"
import tseslint from "typescript-eslint"

import { jsxA11yRules } from "../../eslint.jsx-a11y.mjs"

export const defaultESLintIgnores = [
  "**/.temp",
  "**/.git",
  "**/.hg",
  "**/.pnp.*",
  "**/.svn",
  "**/.next",
  "**/.open-next",
  "**/.sst",
  "**/playwright.config.ts",
  "**/vitest.config.ts",
  "**/tsconfig.tsbuildinfo",
  "**/README.md",
  "**/eslint.config.js",
  "**/dist/",
  "**/.yarn/",
  "**/build/",
  "**/node_modules/",
  "**/temp/",
  "**/registry/",
  "**/public/",
  "**/convex/_generated/",
  "**/.source/",
  "**/sst.config.ts",
  "**/sst.workflow.ts",
]

export default tseslint.config(
  {
    ignores: defaultESLintIgnores,
  },
  ...nextCoreWebVitals,
  perfectionist.configs["recommended-natural"],
  {
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "import-x": importX,
    },
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/ban-tslint-comment": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^(_|ignore)",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/unbound-method": "off",

      curly: ["warn", "all"],
      "import-x/no-duplicates": "warn",
      "import-x/prefer-default-export": "off",
      "no-console": "off",
      // Allow default exports for Next.js
      "no-restricted-exports": "off",
      "no-underscore-dangle": "off",
      "no-useless-escape": "warn",

      "object-shorthand": "warn",

      "perfectionist/sort-imports": "warn",
      "perfectionist/sort-interfaces": "warn",
      "perfectionist/sort-intersection-types": "warn",
      // Perfectionist sorting configuration (from PayloadCMS)
      "perfectionist/sort-jsx-props": "warn",
      "perfectionist/sort-modules": "warn",
      "perfectionist/sort-named-imports": "warn",
      "perfectionist/sort-object-types": "warn",
      "perfectionist/sort-objects": [
        "off",
        {
          customGroups: [
            {
              elementNamePattern: "^(_id|id|name|slug|type)$",
              groupName: "top",
            },
          ],
          groups: ["top", "unknown"],
          order: "asc",
          partitionByComment: true,
          partitionByNewLine: true,
          type: "natural",
        },
      ],
      "perfectionist/sort-switch-case": "off",
      "perfectionist/sort-union-types": "warn",
    },
  },
  {
    // Disable rules for test files and config files
    files: ["src/test/**/*.js", "src/test/**/*.ts", "tests/**/*.ts", "*.config.js", "*.config.mjs"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
  jsxA11yRules,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        project: "./tsconfig.json",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    settings: {
      // Workaround for ESLint flat config circular reference in diagnostics
      _internalSilentUse: true,
    },
  },
  {
    extends: [tseslint.configs.disableTypeChecked],
    files: ["**/*.test.ts", "**/*.test.tsx"],
  }
)

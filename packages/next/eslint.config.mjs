import { FlatCompat } from "@eslint/eslintrc";
import importX from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [
      "**/.temp",
      "**/.git",
      "**/.hg",
      "**/.pnp.*",
      "**/.svn",
      "**/.yarn/",
      "**/build/",
      "**/dist/",
      "**/node_modules/",
      "**/temp/",
      "**/tsconfig.tsbuildinfo",
      "**/README.md",
      "**/eslint.config.js",
      "**/vitest.config.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
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
      "no-restricted-exports": "off",
      "no-underscore-dangle": "off",
      "no-useless-escape": "warn",

      "object-shorthand": "warn",

      "perfectionist/sort-imports": "warn",
      "perfectionist/sort-interfaces": "warn",
      "perfectionist/sort-intersection-types": "warn",
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
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
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
      _internalSilentUse: true,
    },
  },
);

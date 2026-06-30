import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdocPlugin from "eslint-plugin-jsdoc";

export default [
  js.configs.recommended,
  {
    files: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/dist/**",
      "**/node_modules/**",
      "packages/react/**",
      "packages/next/**",
    ],
    plugins: {
      "@typescript-eslint": tsPlugin,
      jsdoc: jsdocPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: true,
        tsConfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // JSDoc enforcement - CRITICAL for v1 rebuild
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false, // Only if exported
            FunctionExpression: false,
          },
          publicOnly: true, // Only enforce on exported symbols
          contexts: [
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportDefaultDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration > VariableDeclaration",
            "ExportNamedDeclaration > TSTypeAliasDeclaration",
            "ExportNamedDeclaration > TSInterfaceDeclaration",
          ],
        },
      ],
      "jsdoc/require-description": [
        "error",
        {
          contexts: ["any"],
          checkConstructors: false,
          checkGetters: false,
          checkSetters: false,
        },
      ],
      "jsdoc/require-param": [
        "error",
        {
          // Don't demand nested `@param args.foo` docs when the function takes
          // an object whose shape is already documented on its TypeScript
          // interface (e.g., FindClientArgs). The interface JSDoc is the
          // single source of truth for prop docs; mirroring nested @params
          // here is duplication, not helpful documentation.
          checkDestructured: false,
          checkDestructuredRoots: false,
        },
      ],
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-type": "off", // TypeScript handles this
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-type": "off", // TypeScript handles this
      "jsdoc/check-param-names": [
        "error",
        {
          // Same reasoning as require-param above.
          checkDestructured: false,
        },
      ],
      "jsdoc/check-tag-names": ["error", {
        // TypeDoc-specific tags not in the JSDoc standard — keep in sync with typedoc.json
        definedTags: ["typeParam", "defaultValue", "expand", "ignore"],
      }],
      "jsdoc/check-types": "off", // TypeScript handles this
      "jsdoc/valid-types": "off", // TypeScript handles this
      "jsdoc/require-throws": "warn", // Warn about documenting thrown errors

      // Example enforcement
      "jsdoc/require-example": "off", // Optional - enable if you want examples required

      // TypeScript-specific
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      // Use TS-aware variants for these rules; the base versions don't
      // understand TypeScript function overloads (each overload signature
      // looks like a redeclaration / unused-args to plain ESLint).
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // Allow leading underscore for intentionally-unused params (common
          // in overload-implementation signatures where the merged-args type
          // is broader than any individual overload).
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          // Don't flag the args of overload signature stubs — their bodies
          // are erased; the implementation is what runs.
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // Browser-facing packages use DOM globals (fetch, File, Response, etc.).
    // TypeScript's type checker already validates these via tsconfig lib — ESLint's
    // no-undef can't read tsconfig lib so it false-positives on browser globals.
    files: [
      "packages/file-storage-convex/src/**/*.ts",
      "packages/react/src/**/*.ts",
      "packages/react/src/**/*.tsx",
      "packages/next/src/**/*.ts",
      "packages/next/src/**/*.tsx",
    ],
    rules: {
      "no-undef": "off",
    },
  },
  {
    // Standard shadcn/base UI primitives — no JSDoc required
    files: [
      "packages/react/src/components/ui/**/*.ts",
      "packages/react/src/components/ui/**/*.tsx",
    ],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-example": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      // Relax JSDoc requirements in tests
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
];

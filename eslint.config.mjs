import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdocPlugin from "eslint-plugin-jsdoc";

export default [
  js.configs.recommended,
  {
    // Node globals used across server-side package code and tests (process.env
    // guards, console.warn dev validation + warn-spies). TypeScript validates
    // these via tsconfig lib/types; ESLint's no-undef can't read tsconfig so
    // it false-positives without them.
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"],
    ignores: ["**/*.test.ts", "**/*.test.tsx", "**/dist/**", "**/node_modules/**"],
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
      // An empty `catch {}` is a deliberate "best effort, ignore failure"
      // pattern here (e.g. optional code formatters in the CLI, where a failed
      // formatter must fall through to returning the source unchanged). Empty
      // blocks of every other kind stay errors.
      "no-empty": ["error", { allowEmptyCatch: true }],
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
    // `no-undef` is off for ALL TypeScript. TypeScript's own checker validates
    // identifiers against tsconfig `lib`/`types`, which ESLint cannot read — so
    // the rule only ever false-positives here, on DOM globals (`fetch`, `File`,
    // `document`), Node globals (`__dirname`, `setTimeout`, `URL`), and the
    // `React` UMD global under `jsx: react-jsx`. This is the typescript-eslint
    // recommendation; keeping it on for a subset just hid real findings behind
    // noise. Applies to tests too, which the typed block above excludes.
    files: ["**/*.ts", "**/*.tsx"],
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
    // Load the plugin so eslint-disable comments referencing
    // @typescript-eslint rules resolve inside test files too.
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // Relax JSDoc requirements in tests
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      // Same reasoning as the main block: the base rule does not understand
      // TypeScript. Test files are excluded from that block's `files` glob, so
      // without repeating this they fall back to the base rule — which reports the
      // parameter names inside a function TYPE annotation, `(f: string) => void`,
      // as unused variables.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];

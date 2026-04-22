# Monorepo Setup Spec

This document defines the monorepo structure, tooling, and configuration for the Vex CMS project.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 0.1

**Depends on**: None (first step)

---

## Design Goals

1. **pnpm workspaces** for dependency management and linking
2. **Turborepo** for build orchestration, caching, and task running
3. **Shared configs** for TypeScript, ESLint, and Prettier as internal packages
4. **Clear separation** between publishable packages and example apps
5. **Consistent namespace** with `@vexcms/*` for all packages

---

## Folder Structure

```
vex/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Test + lint on PR
│       └── release.yml            # Publish to npm on main
│
├── apps/
│   ├── blog/                      # Full example project (Next.js + Convex)
│   │   ├── app/
│   │   ├── convex/
│   │   ├── components/
│   │   ├── vex.config.ts
│   │   ├── package.json
│   │   └── ...
│   └── admin-test/                # Isolated admin test harness for Playwright
│       ├── app/
│       ├── package.json
│       └── ...
│
├── packages/
│   ├── core/                      # @vexcms/core
│   │   ├── src/
│   │   │   ├── fields/
│   │   │   ├── collection.ts
│   │   │   ├── global.ts
│   │   │   ├── block.ts
│   │   │   ├── config.ts
│   │   │   ├── adapters/          # Adapter interfaces
│   │   │   │   ├── storage.ts
│   │   │   │   └── auth.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── convex/                    # @vexcms/convex
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   ├── schema/
│   │   │   ├── storage/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── client/                    # @vexcms/client
│   │   ├── src/
│   │   │   ├── upload.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── ui/                        # @vexcms/ui (shared React components)
│   │   ├── src/
│   │   │   ├── primitives/        # Button, Card, Input (shadcn-based)
│   │   │   ├── forms/             # Form components (TanStack Form)
│   │   │   ├── hooks/             # useField, useForm (Legend State)
│   │   │   ├── layout/            # Layout, Header (no routing)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── admin-next/                # @vexcms/admin-next (Phase 1)
│   │   ├── src/
│   │   │   ├── routes/            # Next.js route handlers
│   │   │   ├── components/        # Next.js specific (Sidebar with Link)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin-tanstack-start/      # @vexcms/admin-tanstack-start (Phase 4)
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── live-preview-react/        # @vexcms/live-preview-react
│   │   ├── src/
│   │   │   ├── useRefreshOnSave.ts
│   │   │   ├── RefreshOnSave.tsx
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── cli/                       # @vexcms/cli
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── sync.ts        # vex sync - schema generation
│   │   │   │   └── init.ts        # vex init - project setup (future)
│   │   │   ├── cli.ts             # Main CLI entry
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── tsconfig/                  # @vexcms/tsconfig (internal)
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   ├── react-library.json
│   │   ├── node-library.json
│   │   └── package.json
│   │
│   └── eslint-config/             # @vexcms/eslint-config (internal)
│       ├── base.js
│       ├── nextjs.js
│       ├── react.js
│       └── package.json
│
├── turbo.json                     # Turborepo config
├── pnpm-workspace.yaml            # Workspace definition
├── package.json                   # Root package.json
├── .npmrc                         # pnpm config
├── .gitignore
└── README.md
```

**Note:** Admin packages are framework-specific (no shared UI code between them). Each framework gets its own package using idiomatic patterns for data fetching, routing, and mutations. `@vexcms/core` contains shared types, config, and schema definitions that both admin packages consume.

---

## Configuration Files

### pnpm-workspace.yaml

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

**Note:** All packages are top-level in `packages/` - no nesting required.

### .npmrc

```ini
# Hoist all dependencies to root for faster installs
shamefully-hoist=true

# Use exact versions
save-exact=true

# Strict peer dependencies
strict-peer-dependencies=false
```

### Root package.json

```json
{
  "name": "vex",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "@vexcms/eslint-config": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
    "prettier": "^3.2.0",
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

## TypeScript Configuration

### packages/tsconfig/base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Base",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist"]
}
```

### packages/tsconfig/react-library.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx"
  }
}
```

### packages/tsconfig/node-library.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Node Library",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

### packages/tsconfig/nextjs.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

### packages/tsconfig/package.json

```json
{
  "name": "@vexcms/tsconfig",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "files": ["*.json"]
}
```

---

## Package Configuration Template

### Example: packages/core/package.json

```json
{
  "name": "@vexcms/core",
  "version": "0.0.0",
  "description": "Schema definitions and field types for Vex CMS",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@vexcms/eslint-config": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.4.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### Example: packages/core/tsconfig.json

```json
{
  "extends": "@vexcms/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Example: packages/core/tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
```

---

## Package Dependencies

```
@vexcms/core (no runtime deps, no React)
    │
    ├──► @vexcms/convex
    │        depends on: @vexcms/core, convex
    │
    ├──► @vexcms/client
    │        depends on: @vexcms/core
    │
    ├──► @vexcms/cli
    │        depends on: @vexcms/core, @vexcms/convex
    │        provides: vex sync, vex init (future)
    │
    └──► @vexcms/ui (shared React components)
             depends on: @vexcms/core, react, @tanstack/react-form, @legendapp/state
             │
             ├──► @vexcms/admin-next (Phase 1)
             │        depends on: @vexcms/core, @vexcms/ui, next, better-auth
             │
             └──► @vexcms/admin-tanstack-start (Phase 4)
                      depends on: @vexcms/core, @vexcms/ui, @tanstack/start, better-auth

@vexcms/live-preview-react
    depends on: react, next
```

**Package Responsibilities:**
- `@vexcms/core` — Types, schema, config (no React)
- `@vexcms/ui` — Shared React components: primitives (shadcn), form fields (TanStack Form), hooks (Legend State), layout (Layout, Header)
- `@vexcms/admin-next` — Next.js routing, server components, data fetching, framework-specific components (Sidebar with next/link)
- `@vexcms/admin-tanstack-start` — TanStack Start routing, createServerFn, framework-specific components

### Workspace Dependencies

Use `workspace:*` protocol for internal dependencies:

```json
{
  "dependencies": {
    "@vexcms/core": "workspace:*"
  }
}
```

This ensures packages always use the local version during development.

---

## ESLint Configuration

### packages/eslint-config/base.js

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '.turbo/'],
};
```

### packages/eslint-config/react.js

```javascript
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react', 'react-hooks'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};
```

### packages/eslint-config/package.json

```json
{
  "name": "@vexcms/eslint-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "main": "base.js",
  "files": ["*.js"],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  },
  "peerDependencies": {
    "eslint": "^8.0.0 || ^9.0.0"
  }
}
```

---

## Initial Setup Commands

```bash
# 1. Initialize pnpm workspace
pnpm init

# 2. Create workspace config
echo 'packages:\n  - "packages/*"\n  - "apps/*"' > pnpm-workspace.yaml

# 3. Install turbo globally (optional, can use npx)
pnpm add -g turbo

# 4. Create package directories
mkdir -p packages/{core,convex,client,admin,live-preview-react,tsconfig,eslint-config}
mkdir -p apps/{blog,admin-test}

# 5. Install root dependencies
pnpm add -D turbo prettier -w

# 6. Initialize each package
cd packages/core && pnpm init
# ... repeat for each package

# 7. Install all dependencies
pnpm install

# 8. Build all packages
pnpm build
```

---

## Development Workflow

### Running Dev Mode

```bash
# Run all packages in dev mode
pnpm dev

# Run specific package
pnpm --filter @vexcms/core dev

# Run example app
pnpm --filter blog dev
```

### Building

```bash
# Build all packages (respects dependency order)
pnpm build

# Build specific package and its dependencies
pnpm --filter @vexcms/admin... build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @vexcms/core test

# Run E2E tests
pnpm test:e2e
```

### Adding Dependencies

```bash
# Add to specific package
pnpm --filter @vexcms/core add zod

# Add dev dependency to root
pnpm add -D typescript -w

# Add workspace dependency
pnpm --filter @vexcms/admin add @vexcms/core@workspace:*
```

---

## Checklist

- [ ] Initialize pnpm workspace
- [ ] Create folder structure
- [ ] Configure turbo.json
- [ ] Create shared tsconfig packages
- [ ] Create shared eslint-config package
- [ ] Initialize all package.json files
- [ ] Set up build tooling (tsup) for each package
- [ ] Configure workspace dependencies
- [ ] Verify `pnpm build` works
- [ ] Verify `pnpm dev` works
- [ ] Add .gitignore with proper exclusions

/**
 * Package manager detected or chosen for the scaffolded project; determines
 * which install/format/lint commands the installer shells out to.
 */
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun"

/**
 * Frontend framework selected for the scaffolded project. Only `"nextjs"` is
 * currently implemented — `createInstaller` throws when `"tanstack"` is chosen.
 */
export type Framework = "nextjs" | "tanstack"

/**
 * A single environment variable required by an OAuth provider, used to
 * populate `.env.example` and the typed env schema.
 */
export interface EnvVariable {
  /** Environment variable name, e.g. `GOOGLE_CLIENT_ID`. */
  name: string
  /** Whether the variable is server-only or also exposed to the client bundle. */
  type: "server" | "client"
  /** Human-readable description written as a comment above the variable in `.env.example`. */
  description: string
}

/**
 * Metadata describing one supported OAuth provider, used to generate its auth
 * config, sign-in UI, `.env.example` entries, and README setup section during
 * scaffolding.
 */
export interface OAuthProvider {
  /** Provider id used as the key in `OAUTH_PROVIDERS` and in `ProjectOptions.oauthProviders`, e.g. `"google"`. */
  id: string
  /** Human-readable provider name shown in CLI prompts and generated UI, e.g. `"Google"`. */
  name: string
  /** Prefix used to derive this provider's environment variable names, e.g. `"GOOGLE"`. */
  envPrefix: string
  /** Name of the environment variable holding the OAuth client ID. */
  clientIdVar: string
  /** Name of the environment variable holding the OAuth client secret. */
  clientSecretVar: string
  /** Better Auth social-provider configuration inserted into the generated `convex/auth/options.ts`. */
  betterAuthConfig: string
  /** Environment variables this provider needs, used to populate `.env.example`. */
  env: EnvVariable[]
  /** Link to the provider's OAuth app setup documentation. */
  docs: string
  /** Whether this provider needs additional manual configuration beyond the client id/secret. */
  requiresExtraConfig: boolean
  /** README section content added when this provider is selected. */
  readme: string
}

/**
 * Resolved answers collected from CLI flags and interactive prompts, passed to
 * `VexFrameworkInstaller#initProject` to drive scaffolding.
 */
export interface ProjectOptions {
  /** npm package name, derived from the last segment of the target path. */
  projectName: string
  /** Absolute path to the directory the project is scaffolded into. */
  projectDir: string
  /** Framework selected for the project; only `"nextjs"` is currently supported. */
  framework: Framework
  /** Dev server port, written into `package.json`'s dev script and `.env.local`. */
  port: number
  /** When true, skips the marketing site template overlay and scaffolds an empty project. */
  bare: boolean
  /** Whether to enable the Better Auth organizations (multi-tenant) plugin. */
  orgs: boolean
  /** Whether to enable email/password authentication alongside any selected OAuth providers. */
  emailPasswordAuth: boolean
  /** IDs of the OAuth providers selected for the project, e.g. `["google", "github"]`. */
  oauthProviders: string[]
  /** Whether to run `git init` and create an initial commit after scaffolding. */
  initGit: boolean
  /** Whether to install dependencies (and run lint/format) after scaffolding. */
  installDependencies: boolean
  /**
   * When true, scaffold into `apps/<name>` under the detected pnpm workspace
   * root and rewrite dependency protocols (`workspace:*` / `catalog:`)
   * instead of running a standalone install (`--monorepo`).
   */
  monorepo: boolean
  /**
   * Absolute path to the host pnpm workspace root (the directory containing
   * `pnpm-workspace.yaml`), resolved by walking up from `cwd` when
   * `monorepo` is true. `null` outside `--monorepo` mode.
   */
  workspaceRoot: string | null
  /**
   * When true, every interactive prompt was skipped and answered with its
   * default (`--yes`, for automation). Scaffolding behavior is fully
   * captured by the resolved fields above — this flag is recorded for
   * diagnostics only, nothing downstream branches on it directly.
   */
  yes: boolean
}

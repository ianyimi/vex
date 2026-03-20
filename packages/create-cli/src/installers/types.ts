export type PackageManager = "pnpm" | "npm" | "yarn" | "bun"
export type Framework = "nextjs" | "tanstack"

export interface EnvVariable {
  name: string
  type: "server" | "client"
  description: string
}

export interface OAuthProvider {
  id: string
  name: string
  envPrefix: string
  clientIdVar: string
  clientSecretVar: string
  betterAuthConfig: string
  env: EnvVariable[]
  docs: string
  requiresExtraConfig: boolean
  readme: string
}

export interface ProjectOptions {
  projectName: string
  projectDir: string
  framework: Framework
  bare: boolean
  emailPasswordAuth: boolean
  oauthProviders: string[]
  initGit: boolean
  installDependencies: boolean
}

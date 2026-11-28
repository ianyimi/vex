import type { PackageManager, ResolvedPackageManager } from '../installers/types.js';

/** Every package manager the scaffolder writes commands for, in detection order. */
export const PACKAGE_MANAGERS = ['pnpm', 'yarn', 'bun', 'deno', 'npm'] as const satisfies readonly PackageManager[];

/** Props for {@link resolvePackageManager}. */
export interface ResolvePackageManagerProps {
  /** `process.env.npm_config_user_agent`, e.g. `"pnpm/10.30.2 npm/? node/v24.9.0 darwin arm64"`. */
  userAgent: string | undefined
  /** Manager forced by a `--use-<manager>` flag; wins over the user agent. */
  override?: PackageManager
  /** True when the scaffolder itself runs under Deno (`process.versions.deno` is set). */
  runningUnderDeno?: boolean
}

const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

/**
 * Resolves the package manager to scaffold for. Order: the `--use-<manager>` override, then
 * Deno's own runtime marker (the CLI only runs under Deno when Deno launched it), then the
 * first `<name>/<version>` token of `npm_config_user_agent` (every manager's create command
 * sets it: `npm/11.6.0 …`, `pnpm/10.30.2 …`, `yarn/4.19.0 …`, `bun/1.3.14 …`,
 * `deno/2.9.6 npm/? …`), then `npm`.
 *
 * @param props - The user agent, an optional override, and whether the CLI runs under Deno.
 * @returns The manager plus its version when the user agent names that same manager with a semver.
 */
export function resolvePackageManager(props: ResolvePackageManagerProps): ResolvedPackageManager {
  const first = props.userAgent?.trim().split(/\s+/)[0] ?? '';
  const [agentName = '', agentVersion = ''] = first.split('/');
  const agent = PACKAGE_MANAGERS.find((pm) => pm === agentName);

  const name: PackageManager =
    props.override ?? (props.runningUnderDeno ? 'deno' : agent ?? 'npm');
  const version = agent === name && SEMVER_RE.test(agentVersion) ? agentVersion : null;
  return { name, version };
}

/**
 * The Corepack `packageManager` field (`"pnpm@10.30.2"`) for a resolved manager, or `undefined`
 * when there is no exact version to pin or the manager is Deno (Corepack doesn't know Deno;
 * a guessed or malformed value such as `"npm@?"` makes Corepack refuse to run in the project).
 *
 * @param pm - The resolved package manager.
 * @returns The field value, or `undefined` to leave the field out.
 */
export function packageManagerField(pm: ResolvedPackageManager): string | undefined {
  if (pm.name === 'deno' || pm.version === null) return undefined;
  return `${pm.name}@${pm.version}`;
}

/** An executable plus its arguments, ready for `execa(command, args)`. */
export interface CommandLine {
  /** Executable to spawn. */
  command: string
  /** Arguments passed to it. */
  args: string[]
}

/**
 * argv for installing the project's dependencies.
 *
 * @param pm - Package manager name.
 * @returns `{ command: pm, args: ["install"] }` — every supported manager spells it the same.
 */
export function installCommandLine(pm: PackageManager): CommandLine {
  return { command: pm, args: ['install'] };
}

/**
 * argv for running a `package.json` script with extra arguments. npm needs `--` before
 * script arguments; Deno runs scripts through `deno task`; the rest take `run <script> <args>`.
 *
 * @param pm - Package manager name.
 * @param script - Script name in `package.json`.
 * @param args - Arguments appended to the script's command.
 * @returns The command line to spawn.
 */
export function runScriptCommandLine(pm: PackageManager, script: string, args: string[] = []): CommandLine {
  if (pm === 'deno') return { command: 'deno', args: ['task', script, ...args] };
  if (pm === 'npm' && args.length > 0) return { command: 'npm', args: ['run', script, '--', ...args] };
  return { command: pm, args: ['run', script, ...args] };
}

/**
 * The command a person types to run a `package.json` script, e.g. `npm run dev`, `pnpm dev`,
 * `yarn dev`, `bun run dev` (`bun dev` would shadow scripts named like Bun built-ins such as
 * `build`), `deno task dev`.
 *
 * @param pm - Package manager name.
 * @param script - Script name.
 * @param args - Arguments for the script, already shell-quoted.
 * @returns The command as one string.
 */
export function runScriptCommand(pm: PackageManager, script: string, args = ''): string {
  const prefix = { npm: 'npm run', pnpm: 'pnpm', yarn: 'yarn', bun: 'bun run', deno: 'deno task' }[pm];
  if (!args) return `${prefix} ${script}`;
  return pm === 'npm' ? `${prefix} ${script} -- ${args}` : `${prefix} ${script} ${args}`;
}

/**
 * The command a person types to run a binary from the project's own dependencies — the same
 * forms the docs show: `npx convex`, `pnpm convex`, `yarn convex`, `bunx convex`,
 * `deno x convex` (Deno 2.6+).
 *
 * @param pm - Package manager name.
 * @param bin - Binary name.
 * @returns The command prefix, to which the binary's own arguments are appended.
 */
export function execBinCommand(pm: PackageManager, bin: string): string {
  return {
    npm: `npx ${bin}`,
    pnpm: `pnpm ${bin}`,
    yarn: `yarn ${bin}`,
    bun: `bunx ${bin}`,
    deno: `deno x ${bin}`,
  }[pm];
}

/**
 * The command that adds dependencies: `npm install`, `pnpm add`, `yarn add`, `bun add`, or
 * `deno add` with every package spec prefixed `npm:`.
 *
 * @param pm - Package manager name.
 * @param packages - Package specs, e.g. `["@vexcms/core@latest"]`.
 * @returns The full add command.
 */
export function addPackagesCommand(pm: PackageManager, packages: string[]): string {
  if (pm === 'deno') return `deno add ${packages.map((p) => `npm:${p}`).join(' ')}`;
  const verb = { npm: 'npm install', pnpm: 'pnpm add', yarn: 'yarn add', bun: 'bun add' }[pm];
  return `${verb} ${packages.join(' ')}`;
}

/**
 * Rewrites the pnpm-flavoured commands in a scaffolded README (or any text) to `pm`:
 * `pnpm install`, `pnpm <script> [args]` (including a command quoted inside the args, as in
 * `--cmd 'pnpm build'`) and `npx <bin>`. For pnpm only `npx <bin>` changes (to `pnpm exec <bin>`).
 *
 * @param text - Source text using pnpm/npx commands.
 * @param pm - Target package manager.
 * @param scripts - Script names in the scaffold's `package.json`; `pnpm <word>` is only
 *   rewritten when `<word>` is one of them (so prose like "pnpm workspace" survives).
 * @returns The rewritten text.
 */
export function rewriteCommands(text: string, pm: PackageManager, scripts: string[]): string {
  const scriptAlternation = scripts
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');
  const scriptRe = new RegExp(
    `\\bpnpm (${scriptAlternation})(?![\\w:-])((?: --?[\\w-]+(?: '[^']*'| [^\\s'#\`]+)?)*)`,
    'g',
  );
  const rewriteScripts = (input: string): string =>
    input.replace(scriptRe, (_m, script: string, args: string) => {
      // A quoted argument can itself hold a command (`--cmd 'pnpm build'`).
      const inner = args.trim().replace(/'([^']*)'/g, (_q, quoted: string) => `'${rewriteScripts(quoted)}'`);
      return runScriptCommand(pm, script, inner);
    });
  return rewriteScripts(
    text
      .replace(/\bnpx ([a-z][\w-]*)/g, (_m, bin: string) => execBinCommand(pm, bin))
      .replace(/\bpnpm install\b/g, `${pm} install`),
  );
}

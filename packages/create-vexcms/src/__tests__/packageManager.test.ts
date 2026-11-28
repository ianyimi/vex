import { describe, it, expect } from 'vitest';
import {
  packageManagerField,
  resolvePackageManager,
  runScriptCommand,
  runScriptCommandLine,
} from '../helpers/packageManager.js';

describe('resolvePackageManager', () => {
  it.each([
    ['npm/11.6.0 node/v24.9.0 darwin arm64 workspaces/false', 'npm', '11.6.0'],
    ['pnpm/10.30.2 npm/? node/v24.9.0 darwin arm64', 'pnpm', '10.30.2'],
    ['yarn/1.22.22 npm/? node/v24.9.0 darwin arm64', 'yarn', '1.22.22'],
    ['yarn/4.19.0 npm/? node/v24.9.0 darwin arm64', 'yarn', '4.19.0'],
    ['bun/1.4.5 npm/? node/v24.3.0 darwin arm64', 'bun', '1.4.5'],
    // Deno names npm with no version; the old detector wrote "npm@?" from it.
    ['deno/2.9.6 npm/? deno/2.9.6 darwin arm64', 'deno', '2.9.6'],
  ])('reads %s', (userAgent, name, version) => {
    expect(resolvePackageManager({ userAgent })).toEqual({ name, version });
  });

  it('an override wins, and only keeps the version when the agent is the same manager', () => {
    expect(resolvePackageManager({ userAgent: 'npm/11.6.0 node/v24', override: 'bun' })).toEqual({ name: 'bun', version: null });
    expect(resolvePackageManager({ userAgent: 'pnpm/10.30.2 npm/?', override: 'pnpm' })).toEqual({ name: 'pnpm', version: '10.30.2' });
  });

  it('deno wins under the Deno runtime whatever the user agent says; else npm with no version', () => {
    expect(resolvePackageManager({ userAgent: undefined, runningUnderDeno: true })).toEqual({ name: 'deno', version: null });
    expect(resolvePackageManager({ userAgent: 'npm/? deno/2.9.6', runningUnderDeno: true })).toEqual({ name: 'deno', version: null });
    expect(resolvePackageManager({ userAgent: undefined })).toEqual({ name: 'npm', version: null });
    expect(resolvePackageManager({ userAgent: 'npm/? node/v24' })).toEqual({ name: 'npm', version: null });
  });
});

describe('packageManagerField', () => {
  it('pins only an exact version, never for deno', () => {
    expect(packageManagerField({ name: 'pnpm', version: '10.30.2' })).toBe('pnpm@10.30.2');
    expect(packageManagerField({ name: 'npm', version: null })).toBeUndefined();
    expect(packageManagerField({ name: 'deno', version: '2.9.6' })).toBeUndefined();
  });
});

describe('script commands', () => {
  it('npm needs -- before script arguments; deno uses deno task', () => {
    expect(runScriptCommandLine('npm', 'lint', ['--fix'])).toEqual({ command: 'npm', args: ['run', 'lint', '--', '--fix'] });
    expect(runScriptCommandLine('deno', 'lint', ['--fix'])).toEqual({ command: 'deno', args: ['task', 'lint', '--fix'] });
    expect(runScriptCommand('npm', 'vex:deploy', "--cmd 'npm run build'")).toBe("npm run vex:deploy -- --cmd 'npm run build'");
  });

  it('bun scripts go through bun run, so `build` is the script, not Bun’s bundler', () => {
    expect(runScriptCommand('bun', 'build')).toBe('bun run build');
  });
});

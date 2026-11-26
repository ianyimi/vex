/**
 * Pins a module-scope singleton — a React Context object, a
 * `createFormHookContexts()` tuple, anything whose IDENTITY other code
 * depends on — to `globalThis`, keyed by a stable string via `Symbol.for()`.
 *
 * Turbopack's production build (scope hoisting, specifically) can evaluate
 * the SAME source module's factory more than once under certain module-graph
 * shapes — two different `package.json` `exports` subpaths both transitively
 * reaching the same file, or a partially-hoisted import cycle (confirmed
 * upstream: vercel/next.js#96648, #96691, #96697) — producing two LIVE
 * objects from one `createContext` call at module scope. A Provider built
 * from one copy and a consumer hook reading the other see different Context
 * identities: the consumer gets the context's DEFAULT value instead of
 * whatever the Provider above it actually passed (observed here as
 * `useVexConfig` throwing "must be used within a VexConfigProvider" with a
 * real `VexConfigProvider` mounted as an ancestor — `AdminLayout` reached
 * `VexConfigContext` through `@vexcms/react/admin`, the app's own provider
 * mount reached it through `@vexcms/react`, and Turbopack's production build
 * compiled two independent `createContext` calls, each seeded `null`, one
 * per path).
 *
 * `globalThis` is the one thing guaranteed single-instance across however
 * many times a module factory actually runs within one JS process (Node.js
 * server, or one browser tab) — every call converges on the same slot, keyed
 * by a `Symbol.for()` registry entry rather than a plain object property:
 * `Symbol.for(key)` always returns the SAME symbol for the same string from
 * the engine's global symbol registry, so two separately-evaluated copies of
 * this very file still agree on which slot to read and write.
 *
 * This does not prevent the module from being duplicated — it only makes
 * the duplication harmless by converging every copy's state into one place.
 *
 * @param key - Stable identifier, unique within `@vexcms/react` — the
 *   defining file's own path relative to `src/` is a good choice (e.g.
 *   `"config/VexConfigContext"`).
 * @param create - Builds the singleton. Runs at most once per process — a
 *   second call with the same `key`, even from a duplicated module copy,
 *   gets the first call's result instead of building a second one.
 * @returns The singleton value, identical across every caller that passes
 *   the same `key`, regardless of how many times the defining module's
 *   factory actually ran.
 */
export function globalSingleton<T>(key: string, create: () => T): T {
  const symbolKey = Symbol.for(`vexcms:react:${key}`);
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  if (store[symbolKey] === undefined) {
    store[symbolKey] = create();
  }
  return store[symbolKey] as T;
}

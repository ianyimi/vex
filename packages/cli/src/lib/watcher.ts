import { watch, type FSWatcher } from "chokidar";

export interface Watcher {
  on(event: "change" | "add" | "unlink", cb: (path: string) => void): void;
  on(event: "all", cb: (eventName: string, path: string) => void): void;
  updatePaths(newPaths: string[]): void;
  close(): Promise<void>;
}

export function createWatcher(paths: string[]): Watcher {
  const currentPaths = new Set(paths);
  const unlinked = new Set<string>();

  const watcher: FSWatcher = watch([...currentPaths], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
    },
  });

  // Track unlinked files so updatePaths can re-add them
  watcher.on("unlink", (p) => {
    unlinked.add(p);
  });

  return {
    on(event, cb) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      watcher.on(event, cb as any);
    },

    updatePaths(newPaths: string[]) {
      const newSet = new Set(newPaths);

      for (const p of newSet) {
        if (!currentPaths.has(p) || unlinked.has(p)) {
          // New path, or was unlinked and needs re-watching
          watcher.add(p);
          currentPaths.add(p);
          unlinked.delete(p);
        }
      }

      // Unwatch removed paths
      for (const p of currentPaths) {
        if (!newSet.has(p)) {
          watcher.unwatch(p);
          currentPaths.delete(p);
          unlinked.delete(p);
        }
      }
    },

    async close() {
      await watcher.close();
    },
  };
}

import { watch, type FSWatcher } from "chokidar";

export interface Watcher {
  on(event: "change", cb: (path: string) => void): void;
  updatePaths(newPaths: string[]): void;
  close(): Promise<void>;
}

export function createWatcher(paths: string[]): Watcher {
  const currentPaths = new Set(paths);

  const watcher: FSWatcher = watch([...currentPaths], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
    },
  });

  return {
    on(event, cb) {
      watcher.on(event, cb);
    },

    updatePaths(newPaths: string[]) {
      const newSet = new Set(newPaths);

      // Add newly discovered paths
      for (const p of newSet) {
        if (!currentPaths.has(p)) {
          watcher.add(p);
          currentPaths.add(p);
        }
      }

      // Unwatch removed paths
      for (const p of currentPaths) {
        if (!newSet.has(p)) {
          watcher.unwatch(p);
          currentPaths.delete(p);
        }
      }
    },

    async close() {
      await watcher.close();
    },
  };
}

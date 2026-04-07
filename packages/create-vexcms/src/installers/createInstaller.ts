import { VexNextJSInstaller } from './nextjs.js';
import type { VexFrameworkInstaller } from './base.js';
import type { Framework } from './types.js';

/**
 * Factory function to create the appropriate framework installer.
 * Currently only supports Next.js. When TanStack Start is ready,
 * this will switch on the framework parameter.
 */
export function createInstaller(props: {
  framework: Framework;
  projectDir: string;
  projectName: string;
}): VexFrameworkInstaller {
  switch (props.framework) {
    case 'nextjs':
      return new VexNextJSInstaller(props.projectDir, props.projectName);
    case 'tanstack':
      throw new Error('TanStack Start is not yet supported');
    default:
      throw new Error(`Unknown framework: ${props.framework}`);
  }
}

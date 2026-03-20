export { VexFrameworkInstaller } from './base.js';
export { VexNextJSInstaller } from './nextjs.js';
export * from './types.js';
export * from './providers.js';
export {
  replacePlaceholder,
  generateAuthProvidersBlock,
  generateOAuthUIProvidersBlock,
  generateEnvVarsBlock,
  generateEnvTsServerSchema,
  generateEnvTsRuntimeMapping,
  generateReadmeSection,
  generateCredentialsValue,
} from './string-utils.js';
export { createInstaller } from './createInstaller.js';

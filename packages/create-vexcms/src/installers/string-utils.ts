/**
 * String Replacement Utilities
 *
 * This module provides utilities for placeholder-based string replacement
 * and code generation for OAuth configuration.
 */

import fs from 'fs-extra';
import { getProvider } from './providers.js';
import type { Framework, OAuthProvider } from './types.js';

/**
 * Detects the indentation (leading whitespace) of a line
 *
 * @param line - The line to analyze
 * @returns The leading whitespace string
 */
export function detectIndentation(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

/**
 * Replaces a placeholder in a file with the provided content
 * Preserves the indentation of the placeholder line
 *
 * Enhanced behavior:
 * - When content is empty string: removes the entire placeholder line
 * - When content is a removal marker (e.g., '__REMOVE_SOCIAL_PROP__'): removes the entire placeholder line
 * - Otherwise: replaces placeholder with content, preserving indentation
 *
 * @param filePath - Absolute path to the file
 * @param placeholder - The placeholder to replace (e.g., '// {{OAUTH_PROVIDERS}}')
 * @param content - The content to insert in place of the placeholder
 * @param options - Optional configuration for error handling
 * @throws Error if file not found or placeholder not found (unless graceful mode enabled)
 */
export async function replacePlaceholder(
  filePath: string,
  placeholder: string,
  content: string,
  options?: { graceful?: boolean; inline?: boolean }
): Promise<void> {
  // Read the file content
  const fileContent = await fs.readFile(filePath, 'utf-8');

  // Check if placeholder exists
  if (!fileContent.includes(placeholder)) {
    if (options?.graceful) {
      // Log warning but don't fail
      console.warn(
        `Warning: Placeholder "${placeholder}" not found in file: ${filePath}. Skipping replacement.`
      );
      return;
    }
    throw new Error(
      `Placeholder "${placeholder}" not found in file: ${filePath}`
    );
  }

  // If inline mode, do simple string replacement
  if (options?.inline) {
    const updatedContent = fileContent.replace(placeholder, content);
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    return;
  }

  // Split content into lines to preserve indentation
  const lines = fileContent.split('\n');
  const updatedLines: string[] = [];

  for (const line of lines) {
    if (line.includes(placeholder)) {
      // Special handling: if content is empty or a removal marker, remove the entire line
      if (content === '' || content.startsWith('__REMOVE_')) {
        // Skip this line entirely (line removal)
        continue;
      }

      // Detect indentation of the placeholder line
      const indentation = detectIndentation(line);

      // Apply indentation to each line of the content
      const indentedContent = content
        .split('\n')
        .map((contentLine, index) => {
          // First line replaces the placeholder, so use its indentation
          if (index === 0) {
            return indentation + contentLine;
          }
          // Subsequent lines also get indented
          return contentLine ? indentation + contentLine : '';
        })
        .join('\n');

      updatedLines.push(indentedContent);
    } else {
      updatedLines.push(line);
    }
  }

  // Write the updated content back to the file
  await fs.writeFile(filePath, updatedLines.join('\n'), 'utf-8');
}

/**
 * Generates email/password authentication configuration for Better Auth
 * Uses proper Better Auth object structure
 *
 * @param enabled - Whether email/password authentication is enabled
 * @returns Configuration object if enabled, empty string if disabled (triggers line removal)
 *
 * @example
 * generateEmailPasswordConfig(true)
 * // Returns: 'emailAndPassword: {\n  enabled: true\n},'
 *
 * generateEmailPasswordConfig(false)
 * // Returns: '' (triggers line removal in replacePlaceholder)
 */
export function generateEmailPasswordConfig(enabled: boolean): string {
  if (!enabled) {
    return '';
  }
  return `emailAndPassword: {
  enabled: true
},`;
}

/**
 * Generates the credentials prop for Better Auth UI Provider
 * Used to enable/disable email & password authentication UI
 *
 * @param enabled - Whether email/password authentication is enabled
 * @returns Complete credentials prop with boolean value
 *
 * @example
 * generateCredentialsValue(true)
 * // Returns: 'credentials={true}'
 *
 * generateCredentialsValue(false)
 * // Returns: 'credentials={false}'
 */
export function generateCredentialsValue(enabled: boolean): string {
  return `credentials={${enabled}}`;
}

/**
 * Generates the complete authentication providers block for Better Auth
 * Combines email/password and OAuth provider configurations using proper Better Auth object structure
 *
 * @param oauthProviders - Array of OAuth provider IDs (e.g., ['google', 'github'])
 * @param emailPasswordEnabled - Whether email/password authentication is enabled
 * @returns Combined authentication configuration with emailAndPassword always included
 *
 * @example
 * generateAuthProvidersBlock(['google', 'github'], true)
 * // Returns: emailAndPassword: { enabled: true }, and socialProviders with google and github
 *
 * generateAuthProvidersBlock(['google'], false)
 * // Returns: emailAndPassword: { enabled: false }, and socialProviders with google
 *
 * generateAuthProvidersBlock([], true)
 * // Returns: emailAndPassword: { enabled: true }, (no socialProviders)
 */
export function generateAuthProvidersBlock(
  oauthProviders: string[],
  emailPasswordEnabled: boolean
): string {
  const parts: string[] = [];

  // Always add email/password configuration with enabled set to true or false
  parts.push(`emailAndPassword: {
      enabled: ${emailPasswordEnabled}
    },`);

  // Add OAuth providers (using object structure)
  if (oauthProviders.length > 0) {
    const providersObject = oauthProviders
      .map(providerId => {
        const provider = getProvider(providerId);
        if (!provider) {
          throw new Error(`Unknown OAuth provider: ${providerId}`);
        }

        // Build the provider configuration object
        const configLines: string[] = [
          `clientId: process.env.${provider.envPrefix}_CLIENT_ID!,`,
          `clientSecret: process.env.${provider.envPrefix}_CLIENT_SECRET!,`
        ];

        // Add extra fields if needed (like Figma's clientKey)
        if (providerId === 'figma') {
          configLines.push(`clientKey: process.env.FIGMA_CLIENT_KEY!,`);
        }

        return `${providerId}: {
        ${configLines.join('\n        ')}
      }`;
      })
      .join(',\n      ');

    parts.push(`socialProviders: {
      ${providersObject}
    },`);
  }

  // Return combined content or empty string (which triggers line removal)
  return parts.join('\n    ');
}

/**
 * Generates env.ts server schema block for OAuth providers
 * Creates zod validation schema entries for OAuth provider credentials
 *
 * @param providers - Array of OAuth provider IDs
 * @returns Zod schema definitions for server-side env vars
 *
 * @example
 * generateEnvTsServerSchema(['google', 'github'])
 * // Returns:
 * // GOOGLE_CLIENT_ID: z.string().optional(),
 * // GOOGLE_CLIENT_SECRET: z.string().optional(),
 * // GITHUB_CLIENT_ID: z.string().optional(),
 * // GITHUB_CLIENT_SECRET: z.string().optional(),
 */
export function generateEnvTsServerSchema(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const schemas = providers
    .map(providerId => {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error(`Unknown OAuth provider: ${providerId}`);
      }

      const lines: string[] = [];

      // Add CLIENT_ID
      lines.push(`${provider.envPrefix}_CLIENT_ID: z.string(),`);

      // Add CLIENT_SECRET
      lines.push(`${provider.envPrefix}_CLIENT_SECRET: z.string(),`);

      // Add extra fields if needed (like Figma's CLIENT_KEY)
      if (providerId === 'figma') {
        lines.push(`FIGMA_CLIENT_KEY: z.string(),`);
      }

      return lines.join('\n    ');
    })
    .join('\n    ');

  return schemas;
}

/**
 * Generates env.ts runtime mapping block for OAuth providers
 * Creates process.env mappings for OAuth provider credentials
 *
 * @param providers - Array of OAuth provider IDs
 * @returns Runtime environment mappings for OAuth env vars
 *
 * @example
 * generateEnvTsRuntimeMapping(['google', 'github'])
 * // Returns:
 * // GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
 * // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
 * // GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
 * // GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
 */
export function generateEnvTsRuntimeMapping(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const mappings = providers
    .map(providerId => {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error(`Unknown OAuth provider: ${providerId}`);
      }

      const lines: string[] = [];

      // Add CLIENT_ID mapping
      lines.push(`${provider.envPrefix}_CLIENT_ID: process.env.${provider.envPrefix}_CLIENT_ID,`);

      // Add CLIENT_SECRET mapping
      lines.push(`${provider.envPrefix}_CLIENT_SECRET: process.env.${provider.envPrefix}_CLIENT_SECRET,`);

      // Add extra fields if needed (like Figma's CLIENT_KEY)
      if (providerId === 'figma') {
        lines.push(`FIGMA_CLIENT_KEY: process.env.FIGMA_CLIENT_KEY,`);
      }

      return lines.join('\n    ');
    })
    .join('\n    ');

  return mappings;
}

/**
 * Generates the complete social prop for AuthUIProvider
 * Used in src/providers.tsx and src/auth/client.tsx for OAuth UI integration
 *
 * @param providers - Array of OAuth provider IDs (e.g., ['google', 'github'])
 * @returns Complete social prop object if providers exist, empty string if no providers
 *
 * @example
 * generateOAuthUIProvidersBlock(['google', 'github'])
 * // Returns: 'social={{\n  providers: ["google", "github"]\n}}'
 *
 * generateOAuthUIProvidersBlock([])
 * // Returns: '' (no social prop)
 */
export function generateOAuthUIProvidersBlock(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const providerList = providers.map(id => `"${id}"`).join(', ');
  return `social={{\n  providers: [${providerList}]\n}}`;
}

/**
 * Generates OAuth configuration block for Better Auth
 * Uses provider.betterAuthConfig.socialProvider directly from OAUTH_PROVIDERS constant
 *
 * @param providers - Array of provider IDs (e.g., ['google', 'github'])
 * @returns Generated configuration code as string
 */
export function generateOAuthConfigBlock(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const providerConfigs = providers
    .map(providerId => {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error(`Unknown OAuth provider: ${providerId}`);
      }

      // Use the stored betterAuthConfig.socialProvider directly
      if (!provider.betterAuthConfig) {
        throw new Error(
          `Provider ${providerId} missing betterAuthConfig metadata`
        );
      }

      return provider.betterAuthConfig.socialProvider;
    })
    .join(',\n');

  return `socialProviders: {
${providerConfigs}
},`;
}

/**
 * Generates OAuth UI configuration block for better-auth-ui
 * Creates an array of provider IDs for the UI component
 *
 * @param providers - Array of provider IDs (e.g., ['google', 'github'])
 * @returns Generated provider array as string
 */
export function generateOAuthUIConfigBlock(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const providerList = providers.map(id => `'${id}'`).join(', ');
  return `providers: [${providerList}],`;
}

/**
 * Generates client-side social provider buttons/links code
 * Uses provider.betterAuthConfig.clientSideProvider for each provider
 *
 * @param providers - Array of provider IDs (e.g., ['google', 'github'])
 * @returns Generated client-side provider code as string
 */
export function generateClientSideProvidersBlock(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const providerButtons = providers
    .map(providerId => {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error(`Unknown OAuth provider: ${providerId}`);
      }

      if (!provider.betterAuthConfig?.clientSideProvider) {
        throw new Error(
          `Provider ${providerId} missing betterAuthConfig.clientSideProvider`
        );
      }

      // Generate button/link for each provider
      return `<button onClick={() => authClient.signIn.social({ provider: ${provider.betterAuthConfig.clientSideProvider} })}>
  Sign in with ${provider.name}
</button>`;
    })
    .join('\n');

  return providerButtons;
}

/**
 * Generates environment variable declarations for OAuth providers
 * Applies framework-specific prefixes for client variables
 *
 * @param providers - Array of provider IDs (e.g., ['google', 'github'])
 * @param framework - Target framework ('nextjs' or 'tanstack')
 * @returns Generated environment variable declarations as string
 */
export function generateEnvVarsBlock(
  providers: string[],
  framework: Framework
): string {
  if (providers.length === 0) {
    return '';
  }

  const envVars = providers.flatMap(providerId => {
    const provider = getProvider(providerId);
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerId}`);
    }

    // Use new env array structure if available, otherwise fall back to legacy fields
    if (provider.env && provider.env.length > 0) {
      return provider.env.map(envVar => {
        // Determine prefix based on framework and variable type
        let prefix = '';
        if (envVar.type === 'client') {
          prefix = framework === 'nextjs' ? 'NEXT_PUBLIC_' : 'VITE_';
        }

        // Format: # Description
        //         PREFIXED_VAR_NAME=
        return `# ${envVar.description}\n${prefix}${envVar.name}=`;
      });
    } else {
      // Legacy fallback for providers without env array
      return [
        `${provider.clientIdVar}=`,
        `${provider.clientSecretVar}=`
      ];
    }
  });

  return envVars.join('\n');
}

/**
 * Generates README section with OAuth provider setup guides
 * Compiles markdown content from selected providers
 *
 * @param providers - Array of provider IDs (e.g., ['google', 'github'])
 * @returns Generated README markdown as string
 */
export function generateReadmeSection(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const sections = providers
    .map(providerId => {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error(`Unknown OAuth provider: ${providerId}`);
      }

      if (!provider.readme) {
        throw new Error(
          `Provider ${providerId} missing readme metadata`
        );
      }

      return provider.readme.content;
    })
    .filter(Boolean);

  if (sections.length === 0) {
    return '';
  }

  // Join sections with horizontal rule separator
  return `# OAuth Provider Setup

${sections.join('\n\n---\n\n')}`;
}

/**
 * Gets providers that require extra configuration beyond clientId/clientSecret
 * Used for displaying warnings in the CLI
 *
 * @param providers - Array of provider IDs to filter
 * @returns Array of OAuthProvider objects that require extra config
 */
export function getProvidersRequiringExtraConfig(
  providers: string[]
): OAuthProvider[] {
  return providers
    .map(providerId => {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error(`Unknown OAuth provider: ${providerId}`);
      }
      return provider;
    })
    .filter(provider => provider.requiresExtraConfig === true);
}

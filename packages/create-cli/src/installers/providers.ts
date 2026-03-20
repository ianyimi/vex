/**
 * OAuth Provider Registry
 *
 * This module provides a centralized registry of all OAuth providers
 * supported by Better Auth, along with helper functions for provider lookup.
 */

import type { OAuthProvider } from './types.js';

/**
 * Registry of all supported OAuth providers
 * Maps provider ID to provider configuration
 */
export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  // ========================================
  // POPULAR PROVIDERS (10)
  // ========================================

  google: {
    id: 'google',
    name: 'Google',
    envPrefix: 'GOOGLE',
    clientIdVar: 'GOOGLE_CLIENT_ID',
    clientSecretVar: 'GOOGLE_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"google"',
      socialProvider: `google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'GOOGLE_CLIENT_ID',
        type: 'server',
        description: 'Google OAuth Client ID',
      },
      {
        name: 'GOOGLE_CLIENT_SECRET',
        type: 'server',
        description: 'Google OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://console.cloud.google.com/apis/credentials',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Google OAuth Setup',
      content: `## Google OAuth Setup

1. Create OAuth credentials at https://console.cloud.google.com/apis/credentials
2. Set the Authorized redirect URI to: \`http://localhost:3000/api/auth/callback/google\` (update for production)
3. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  github: {
    id: 'github',
    name: 'GitHub',
    envPrefix: 'GITHUB',
    clientIdVar: 'GITHUB_CLIENT_ID',
    clientSecretVar: 'GITHUB_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"github"',
      socialProvider: `github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })`,
      scopes: ['user:email'],
    },
    env: [
      {
        name: 'GITHUB_CLIENT_ID',
        type: 'server',
        description: 'GitHub OAuth App Client ID',
      },
      {
        name: 'GITHUB_CLIENT_SECRET',
        type: 'server',
        description: 'GitHub OAuth App Client Secret',
      },
    ],
    docs: {
      provider:
        'https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'You MUST include the user:email scope in your GitHub app. For GitHub Apps, enable Read-Only access to Email Addresses in Permissions.',
    readme: {
      title: 'GitHub OAuth Setup',
      content: `## GitHub OAuth Setup

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set the Authorization callback URL to: \`http://localhost:3000/api/auth/callback/github\` (update for production)
3. Copy the Client ID and Client Secret to your \`.env\` file
4. **Important**: Include the \`user:email\` scope in your GitHub app permissions

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  discord: {
    id: 'discord',
    name: 'Discord',
    envPrefix: 'DISCORD',
    clientIdVar: 'DISCORD_CLIENT_ID',
    clientSecretVar: 'DISCORD_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"discord"',
      socialProvider: `discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'DISCORD_CLIENT_ID',
        type: 'server',
        description: 'Discord OAuth Application Client ID',
      },
      {
        name: 'DISCORD_CLIENT_SECRET',
        type: 'server',
        description: 'Discord OAuth Application Client Secret',
      },
    ],
    docs: {
      provider: 'https://discord.com/developers/applications',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes:
      'You can optionally add a permissions field to request additional Discord permissions.',
    readme: {
      title: 'Discord OAuth Setup',
      content: `## Discord OAuth Setup

1. Create an application at https://discord.com/developers/applications
2. Add a redirect URL: \`http://localhost:3000/api/auth/callback/discord\` (update for production)
3. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  apple: {
    id: 'apple',
    name: 'Apple',
    envPrefix: 'APPLE',
    clientIdVar: 'APPLE_CLIENT_ID',
    clientSecretVar: 'APPLE_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"apple"',
      socialProvider: `apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'APPLE_CLIENT_ID',
        type: 'server',
        description: 'Apple Sign In Service ID',
      },
      {
        name: 'APPLE_CLIENT_SECRET',
        type: 'server',
        description: 'Apple Sign In Client Secret (JWT token)',
      },
    ],
    docs: {
      provider: 'https://developer.apple.com/sign-in-with-apple/get-started/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'Apple requires additional configuration: clientId is your Service ID, clientSecret must be a JWT token generated from your Team ID, Key ID, and Private Key. You may also need to provide appBundleIdentifier for iOS apps.',
    readme: {
      title: 'Apple Sign In Setup',
      content: `## Apple Sign In Setup

1. Create a Sign In with Apple service at https://developer.apple.com
2. Configure your Service ID and return URLs
3. Generate a client secret JWT using your private key, Team ID, and Key ID
4. Add credentials to your \`.env\` file

**Note**: The clientSecret must be a JWT token generated from your Apple credentials, not a standard client secret.

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    envPrefix: 'MICROSOFT',
    clientIdVar: 'MICROSOFT_CLIENT_ID',
    clientSecretVar: 'MICROSOFT_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"microsoft"',
      socialProvider: `microsoft({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'MICROSOFT_CLIENT_ID',
        type: 'server',
        description: 'Microsoft Entra ID Application (client) ID',
      },
      {
        name: 'MICROSOFT_CLIENT_SECRET',
        type: 'server',
        description: 'Microsoft Entra ID Client Secret',
      },
      {
        name: 'MICROSOFT_TENANT_ID',
        type: 'server',
        description:
          'Microsoft Entra ID Tenant ID (optional, defaults to "common")',
      },
    ],
    docs: {
      provider: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'Optional fields: tenantId (defaults to "common"), authority (custom authority URL), prompt (consent behavior).',
    readme: {
      title: 'Microsoft Entra ID OAuth Setup',
      content: `## Microsoft Entra ID OAuth Setup

1. Register an application at https://portal.azure.com
2. Add a redirect URI: \`http://localhost:3000/api/auth/callback/microsoft\` (update for production)
3. Create a client secret in "Certificates & secrets"
4. Copy the Application (client) ID and Client Secret to your \`.env\` file
5. (Optional) Copy the Directory (tenant) ID if you want to restrict to a specific tenant

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  facebook: {
    id: 'facebook',
    name: 'Facebook',
    envPrefix: 'FACEBOOK',
    clientIdVar: 'FACEBOOK_CLIENT_ID',
    clientSecretVar: 'FACEBOOK_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"facebook"',
      socialProvider: `facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'FACEBOOK_CLIENT_ID',
        type: 'server',
        description: 'Facebook App ID',
      },
      {
        name: 'FACEBOOK_CLIENT_SECRET',
        type: 'server',
        description: 'Facebook App Secret',
      },
    ],
    docs: {
      provider: 'https://developers.facebook.com/apps/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes:
      'Facebook supports custom scopes and fields arrays to request additional user data.',
    readme: {
      title: 'Facebook OAuth Setup',
      content: `## Facebook OAuth Setup

1. Create an app at https://developers.facebook.com/apps/
2. Add Facebook Login product to your app
3. Add OAuth redirect URI: \`http://localhost:3000/api/auth/callback/facebook\` (update for production)
4. Copy the App ID and App Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    envPrefix: 'TWITTER',
    clientIdVar: 'TWITTER_CLIENT_ID',
    clientSecretVar: 'TWITTER_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"twitter"',
      socialProvider: `twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'TWITTER_CLIENT_ID',
        type: 'server',
        description: 'Twitter/X OAuth 2.0 Client ID',
      },
      {
        name: 'TWITTER_CLIENT_SECRET',
        type: 'server',
        description: 'Twitter/X OAuth 2.0 Client Secret',
      },
    ],
    docs: {
      provider: 'https://developer.twitter.com/en/portal/projects-and-apps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Twitter/X OAuth Setup',
      content: `## Twitter/X OAuth Setup

1. Create an app at https://developer.twitter.com/en/portal/projects-and-apps
2. Enable OAuth 2.0 authentication
3. Add callback URL: \`http://localhost:3000/api/auth/callback/twitter\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    envPrefix: 'LINKEDIN',
    clientIdVar: 'LINKEDIN_CLIENT_ID',
    clientSecretVar: 'LINKEDIN_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"linkedin"',
      socialProvider: `linkedin({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'LINKEDIN_CLIENT_ID',
        type: 'server',
        description: 'LinkedIn OAuth Client ID',
      },
      {
        name: 'LINKEDIN_CLIENT_SECRET',
        type: 'server',
        description: 'LinkedIn OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://www.linkedin.com/developers/apps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'LinkedIn OAuth Setup',
      content: `## LinkedIn OAuth Setup

1. Create an app at https://www.linkedin.com/developers/apps
2. Add redirect URL: \`http://localhost:3000/api/auth/callback/linkedin\` (update for production)
3. Request access to Sign In with LinkedIn
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  twitch: {
    id: 'twitch',
    name: 'Twitch',
    envPrefix: 'TWITCH',
    clientIdVar: 'TWITCH_CLIENT_ID',
    clientSecretVar: 'TWITCH_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"twitch"',
      socialProvider: `twitch({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'TWITCH_CLIENT_ID',
        type: 'server',
        description: 'Twitch Application Client ID',
      },
      {
        name: 'TWITCH_CLIENT_SECRET',
        type: 'server',
        description: 'Twitch Application Client Secret',
      },
    ],
    docs: {
      provider: 'https://dev.twitch.tv/console/apps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Twitch OAuth Setup',
      content: `## Twitch OAuth Setup

1. Register an application at https://dev.twitch.tv/console/apps
2. Set OAuth Redirect URL to: \`http://localhost:3000/api/auth/callback/twitch\` (update for production)
3. Copy the Client ID and generate a Client Secret
4. Add credentials to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  spotify: {
    id: 'spotify',
    name: 'Spotify',
    envPrefix: 'SPOTIFY',
    clientIdVar: 'SPOTIFY_CLIENT_ID',
    clientSecretVar: 'SPOTIFY_CLIENT_SECRET',
    popular: true,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"spotify"',
      socialProvider: `spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'SPOTIFY_CLIENT_ID',
        type: 'server',
        description: 'Spotify App Client ID',
      },
      {
        name: 'SPOTIFY_CLIENT_SECRET',
        type: 'server',
        description: 'Spotify App Client Secret',
      },
    ],
    docs: {
      provider: 'https://developer.spotify.com/dashboard/applications',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Spotify OAuth Setup',
      content: `## Spotify OAuth Setup

1. Create an app at https://developer.spotify.com/dashboard/applications
2. Add redirect URI: \`http://localhost:3000/api/auth/callback/spotify\` (update for production)
3. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  // ========================================
  // ADDITIONAL PROVIDERS (23)
  // ========================================

  atlassian: {
    id: 'atlassian',
    name: 'Atlassian',
    envPrefix: 'ATLASSIAN',
    clientIdVar: 'ATLASSIAN_CLIENT_ID',
    clientSecretVar: 'ATLASSIAN_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"atlassian"',
      socialProvider: `atlassian({
      clientId: process.env.ATLASSIAN_CLIENT_ID!,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'ATLASSIAN_CLIENT_ID',
        type: 'server',
        description: 'Atlassian OAuth 2.0 Client ID',
      },
      {
        name: 'ATLASSIAN_CLIENT_SECRET',
        type: 'server',
        description: 'Atlassian OAuth 2.0 Client Secret',
      },
    ],
    docs: {
      provider: 'https://developer.atlassian.com/console/myapps/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes:
      'Default scopes include read:jira-user, read:jira-work, and offline_access.',
    readme: {
      title: 'Atlassian OAuth Setup',
      content: `## Atlassian OAuth Setup

1. Create an app at https://developer.atlassian.com/console/myapps/
2. Configure OAuth 2.0 integration
3. Add callback URL: \`http://localhost:3000/api/auth/callback/atlassian\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  cognito: {
    id: 'cognito',
    name: 'AWS Cognito',
    envPrefix: 'COGNITO',
    clientIdVar: 'COGNITO_CLIENT_ID',
    clientSecretVar: 'COGNITO_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"cognito"',
      socialProvider: `cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      domain: process.env.COGNITO_DOMAIN!,
      region: process.env.COGNITO_REGION!,
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'COGNITO_CLIENT_ID',
        type: 'server',
        description: 'AWS Cognito App Client ID',
      },
      {
        name: 'COGNITO_CLIENT_SECRET',
        type: 'server',
        description: 'AWS Cognito App Client Secret',
      },
      {
        name: 'COGNITO_DOMAIN',
        type: 'server',
        description:
          'AWS Cognito domain (e.g., your-domain.auth.us-east-1.amazoncognito.com)',
      },
      {
        name: 'COGNITO_REGION',
        type: 'server',
        description: 'AWS region (e.g., us-east-1)',
      },
      {
        name: 'COGNITO_USER_POOL_ID',
        type: 'server',
        description: 'AWS Cognito User Pool ID',
      },
    ],
    docs: {
      provider: 'https://console.aws.amazon.com/cognito/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'AWS Cognito requires domain, region, and userPoolId in addition to clientId and clientSecret.',
    readme: {
      title: 'AWS Cognito OAuth Setup',
      content: `## AWS Cognito OAuth Setup

1. Create a User Pool at https://console.aws.amazon.com/cognito/
2. Configure an App Client with OAuth 2.0 flows
3. Set up a Cognito domain for your user pool
4. Add callback URL: \`http://localhost:3000/api/auth/callback/cognito\` (update for production)
5. Copy the following to your \`.env\` file:
   - App Client ID
   - App Client Secret
   - Cognito Domain
   - AWS Region
   - User Pool ID

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    envPrefix: 'DROPBOX',
    clientIdVar: 'DROPBOX_CLIENT_ID',
    clientSecretVar: 'DROPBOX_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"dropbox"',
      socialProvider: `dropbox({
      clientId: process.env.DROPBOX_CLIENT_ID!,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'DROPBOX_CLIENT_ID',
        type: 'server',
        description: 'Dropbox App Key',
      },
      {
        name: 'DROPBOX_CLIENT_SECRET',
        type: 'server',
        description: 'Dropbox App Secret',
      },
    ],
    docs: {
      provider: 'https://www.dropbox.com/developers/apps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Dropbox OAuth Setup',
      content: `## Dropbox OAuth Setup

1. Create an app at https://www.dropbox.com/developers/apps
2. Choose OAuth 2 settings
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/dropbox\` (update for production)
4. Copy the App Key and App Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  figma: {
    id: 'figma',
    name: 'Figma',
    envPrefix: 'FIGMA',
    clientIdVar: 'FIGMA_CLIENT_ID',
    clientSecretVar: 'FIGMA_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"figma"',
      socialProvider: `figma({
      clientId: process.env.FIGMA_CLIENT_ID!,
      clientSecret: process.env.FIGMA_CLIENT_SECRET!,
      clientKey: process.env.FIGMA_CLIENT_KEY!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'FIGMA_CLIENT_ID',
        type: 'server',
        description: 'Figma OAuth Client ID',
      },
      {
        name: 'FIGMA_CLIENT_SECRET',
        type: 'server',
        description: 'Figma OAuth Client Secret',
      },
      {
        name: 'FIGMA_CLIENT_KEY',
        type: 'server',
        description: 'Figma OAuth Client Key',
      },
    ],
    docs: {
      provider: 'https://www.figma.com/developers/apps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'Figma requires a clientKey in addition to clientId and clientSecret.',
    readme: {
      title: 'Figma OAuth Setup',
      content: `## Figma OAuth Setup

1. Create an app at https://www.figma.com/developers/apps
2. Configure OAuth settings
3. Add callback URL: \`http://localhost:3000/api/auth/callback/figma\` (update for production)
4. Copy the Client ID, Client Secret, and Client Key to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    envPrefix: 'GITLAB',
    clientIdVar: 'GITLAB_CLIENT_ID',
    clientSecretVar: 'GITLAB_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"gitlab"',
      socialProvider: `gitlab({
      clientId: process.env.GITLAB_CLIENT_ID!,
      clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'GITLAB_CLIENT_ID',
        type: 'server',
        description: 'GitLab Application ID',
      },
      {
        name: 'GITLAB_CLIENT_SECRET',
        type: 'server',
        description: 'GitLab Application Secret',
      },
    ],
    docs: {
      provider: 'https://gitlab.com/-/profile/applications',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes:
      'Optionally supports an issuer field for self-hosted GitLab instances.',
    readme: {
      title: 'GitLab OAuth Setup',
      content: `## GitLab OAuth Setup

1. Create an application at https://gitlab.com/-/profile/applications
2. Add redirect URI: \`http://localhost:3000/api/auth/callback/gitlab\` (update for production)
3. Select the required scopes (read_user is recommended)
4. Copy the Application ID and Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face',
    envPrefix: 'HUGGINGFACE',
    clientIdVar: 'HUGGINGFACE_CLIENT_ID',
    clientSecretVar: 'HUGGINGFACE_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"huggingface"',
      socialProvider: `huggingface({
      clientId: process.env.HUGGINGFACE_CLIENT_ID!,
      clientSecret: process.env.HUGGINGFACE_CLIENT_SECRET!,
    })`,
      scopes: ['email'],
    },
    env: [
      {
        name: 'HUGGINGFACE_CLIENT_ID',
        type: 'server',
        description: 'Hugging Face OAuth Client ID',
      },
      {
        name: 'HUGGINGFACE_CLIENT_SECRET',
        type: 'server',
        description: 'Hugging Face OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://huggingface.co/settings/connected-applications',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes: 'You MUST include the email scope for Hugging Face.',
    readme: {
      title: 'Hugging Face OAuth Setup',
      content: `## Hugging Face OAuth Setup

1. Create an OAuth app at https://huggingface.co/settings/connected-applications
2. Set redirect URI to: \`http://localhost:3000/api/auth/callback/huggingface\` (update for production)
3. Copy the Client ID and Client Secret to your \`.env\` file
4. **Important**: Make sure to include the \`email\` scope in your configuration

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  kakao: {
    id: 'kakao',
    name: 'Kakao',
    envPrefix: 'KAKAO',
    clientIdVar: 'KAKAO_CLIENT_ID',
    clientSecretVar: 'KAKAO_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"kakao"',
      socialProvider: `kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'KAKAO_CLIENT_ID',
        type: 'server',
        description: 'Kakao REST API Key',
      },
      {
        name: 'KAKAO_CLIENT_SECRET',
        type: 'server',
        description: 'Kakao Client Secret',
      },
    ],
    docs: {
      provider: 'https://developers.kakao.com/console/app',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Kakao OAuth Setup',
      content: `## Kakao OAuth Setup

1. Create an application at https://developers.kakao.com/console/app
2. Enable Kakao Login in the app settings
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/kakao\` (update for production)
4. Copy the REST API Key and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  kick: {
    id: 'kick',
    name: 'Kick',
    envPrefix: 'KICK',
    clientIdVar: 'KICK_CLIENT_ID',
    clientSecretVar: 'KICK_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"kick"',
      socialProvider: `kick({
      clientId: process.env.KICK_CLIENT_ID!,
      clientSecret: process.env.KICK_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'KICK_CLIENT_ID',
        type: 'server',
        description: 'Kick OAuth Client ID',
      },
      {
        name: 'KICK_CLIENT_SECRET',
        type: 'server',
        description: 'Kick OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://dev.kick.com/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Kick OAuth Setup',
      content: `## Kick OAuth Setup

1. Create an application at https://dev.kick.com/
2. Configure OAuth settings
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/kick\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  line: {
    id: 'line',
    name: 'LINE',
    envPrefix: 'LINE',
    clientIdVar: 'LINE_CLIENT_ID',
    clientSecretVar: 'LINE_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"line"',
      socialProvider: `line({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'LINE_CLIENT_ID',
        type: 'server',
        description: 'LINE Channel ID',
      },
      {
        name: 'LINE_CLIENT_SECRET',
        type: 'server',
        description: 'LINE Channel Secret',
      },
    ],
    docs: {
      provider: 'https://developers.line.biz/console/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: 'Supports multi-channel configuration.',
    readme: {
      title: 'LINE OAuth Setup',
      content: `## LINE OAuth Setup

1. Create a channel at https://developers.line.biz/console/
2. Enable LINE Login
3. Add callback URL: \`http://localhost:3000/api/auth/callback/line\` (update for production)
4. Copy the Channel ID and Channel Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  linear: {
    id: 'linear',
    name: 'Linear',
    envPrefix: 'LINEAR',
    clientIdVar: 'LINEAR_CLIENT_ID',
    clientSecretVar: 'LINEAR_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"linear"',
      socialProvider: `linear({
      clientId: process.env.LINEAR_CLIENT_ID!,
      clientSecret: process.env.LINEAR_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'LINEAR_CLIENT_ID',
        type: 'server',
        description: 'Linear OAuth Client ID',
      },
      {
        name: 'LINEAR_CLIENT_SECRET',
        type: 'server',
        description: 'Linear OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://linear.app/settings/api',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: 'Supports custom scope options.',
    readme: {
      title: 'Linear OAuth Setup',
      content: `## Linear OAuth Setup

1. Create an OAuth application at https://linear.app/settings/api
2. Add redirect URL: \`http://localhost:3000/api/auth/callback/linear\` (update for production)
3. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  naver: {
    id: 'naver',
    name: 'Naver',
    envPrefix: 'NAVER',
    clientIdVar: 'NAVER_CLIENT_ID',
    clientSecretVar: 'NAVER_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"naver"',
      socialProvider: `naver({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'NAVER_CLIENT_ID',
        type: 'server',
        description: 'Naver Client ID',
      },
      {
        name: 'NAVER_CLIENT_SECRET',
        type: 'server',
        description: 'Naver Client Secret',
      },
    ],
    docs: {
      provider: 'https://developers.naver.com/apps/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Naver OAuth Setup',
      content: `## Naver OAuth Setup

1. Register an application at https://developers.naver.com/apps/
2. Configure Login API settings
3. Add callback URL: \`http://localhost:3000/api/auth/callback/naver\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  notion: {
    id: 'notion',
    name: 'Notion',
    envPrefix: 'NOTION',
    clientIdVar: 'NOTION_CLIENT_ID',
    clientSecretVar: 'NOTION_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"notion"',
      socialProvider: `notion({
      clientId: process.env.NOTION_CLIENT_ID!,
      clientSecret: process.env.NOTION_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'NOTION_CLIENT_ID',
        type: 'server',
        description: 'Notion OAuth Client ID',
      },
      {
        name: 'NOTION_CLIENT_SECRET',
        type: 'server',
        description: 'Notion OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://www.notion.so/my-integrations',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'Notion OAuth Setup',
      content: `## Notion OAuth Setup

1. Create an integration at https://www.notion.so/my-integrations
2. Configure OAuth settings and capabilities
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/notion\` (update for production)
4. Copy the OAuth Client ID and Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  paybin: {
    id: 'paybin',
    name: 'Paybin',
    envPrefix: 'PAYBIN',
    clientIdVar: 'PAYBIN_CLIENT_ID',
    clientSecretVar: 'PAYBIN_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"paybin"',
      socialProvider: `paybin({
      clientId: process.env.PAYBIN_CLIENT_ID!,
      clientSecret: process.env.PAYBIN_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'PAYBIN_CLIENT_ID',
        type: 'server',
        description: 'Paybin OAuth Client ID',
      },
      {
        name: 'PAYBIN_CLIENT_SECRET',
        type: 'server',
        description: 'Paybin OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://paybin.io/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: 'Uses OpenID Connect scopes.',
    readme: {
      title: 'Paybin OAuth Setup',
      content: `## Paybin OAuth Setup

1. Create an application at https://paybin.io/
2. Configure OAuth settings
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/paybin\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  paypal: {
    id: 'paypal',
    name: 'PayPal',
    envPrefix: 'PAYPAL',
    clientIdVar: 'PAYPAL_CLIENT_ID',
    clientSecretVar: 'PAYPAL_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"paypal"',
      socialProvider: `paypal({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
      environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'PAYPAL_CLIENT_ID',
        type: 'server',
        description: 'PayPal REST API Client ID',
      },
      {
        name: 'PAYPAL_CLIENT_SECRET',
        type: 'server',
        description: 'PayPal REST API Secret',
      },
      {
        name: 'PAYPAL_ENVIRONMENT',
        type: 'server',
        description: 'PayPal environment: "sandbox" or "live" (default: sandbox)',
      },
    ],
    docs: {
      provider: 'https://developer.paypal.com/dashboard/applications',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'PayPal supports environment (sandbox/live) and requestShippingAddress options.',
    readme: {
      title: 'PayPal OAuth Setup',
      content: `## PayPal OAuth Setup

1. Create an app at https://developer.paypal.com/dashboard/applications
2. Configure OAuth settings in the app
3. Add return URL: \`http://localhost:3000/api/auth/callback/paypal\` (update for production)
4. Copy the Client ID and Secret to your \`.env\` file
5. Set PAYPAL_ENVIRONMENT to "sandbox" for testing or "live" for production

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  polar: {
    id: 'polar',
    name: 'Polar',
    envPrefix: 'POLAR',
    clientIdVar: 'POLAR_CLIENT_ID',
    clientSecretVar: 'POLAR_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"polar"',
      socialProvider: `polar({
      clientId: process.env.POLAR_CLIENT_ID!,
      clientSecret: process.env.POLAR_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'POLAR_CLIENT_ID',
        type: 'server',
        description: 'Polar OAuth Client ID',
      },
      {
        name: 'POLAR_CLIENT_SECRET',
        type: 'server',
        description: 'Polar OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://polar.sh/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: 'Uses OpenID Connect scopes.',
    readme: {
      title: 'Polar OAuth Setup',
      content: `## Polar OAuth Setup

1. Create an OAuth application at https://polar.sh/
2. Configure OAuth settings
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/polar\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  reddit: {
    id: 'reddit',
    name: 'Reddit',
    envPrefix: 'REDDIT',
    clientIdVar: 'REDDIT_CLIENT_ID',
    clientSecretVar: 'REDDIT_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"reddit"',
      socialProvider: `reddit({
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'REDDIT_CLIENT_ID',
        type: 'server',
        description: 'Reddit App Client ID',
      },
      {
        name: 'REDDIT_CLIENT_SECRET',
        type: 'server',
        description: 'Reddit App Client Secret',
      },
    ],
    docs: {
      provider: 'https://www.reddit.com/prefs/apps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: 'Supports duration and scope fields for custom access.',
    readme: {
      title: 'Reddit OAuth Setup',
      content: `## Reddit OAuth Setup

1. Create an app at https://www.reddit.com/prefs/apps
2. Choose "web app" as the app type
3. Set redirect URI to: \`http://localhost:3000/api/auth/callback/reddit\` (update for production)
4. Copy the Client ID (under app name) and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  roblox: {
    id: 'roblox',
    name: 'Roblox',
    envPrefix: 'ROBLOX',
    clientIdVar: 'ROBLOX_CLIENT_ID',
    clientSecretVar: 'ROBLOX_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"roblox"',
      socialProvider: `roblox({
      clientId: process.env.ROBLOX_CLIENT_ID!,
      clientSecret: process.env.ROBLOX_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'ROBLOX_CLIENT_ID',
        type: 'server',
        description: 'Roblox OAuth Client ID',
      },
      {
        name: 'ROBLOX_CLIENT_SECRET',
        type: 'server',
        description: 'Roblox OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://create.roblox.com/credentials',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'Note: Roblox OAuth does not provide user email addresses.',
    readme: {
      title: 'Roblox OAuth Setup',
      content: `## Roblox OAuth Setup

1. Create OAuth credentials at https://create.roblox.com/credentials
2. Configure OAuth 2.0 settings
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/roblox\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

**Note**: Roblox does not provide email addresses through OAuth.

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    envPrefix: 'SALESFORCE',
    clientIdVar: 'SALESFORCE_CLIENT_ID',
    clientSecretVar: 'SALESFORCE_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"salesforce"',
      socialProvider: `salesforce({
      clientId: process.env.SALESFORCE_CLIENT_ID!,
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET!,
      environment: process.env.SALESFORCE_ENVIRONMENT || "login",
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'SALESFORCE_CLIENT_ID',
        type: 'server',
        description: 'Salesforce Connected App Consumer Key',
      },
      {
        name: 'SALESFORCE_CLIENT_SECRET',
        type: 'server',
        description: 'Salesforce Connected App Consumer Secret',
      },
      {
        name: 'SALESFORCE_ENVIRONMENT',
        type: 'server',
        description:
          'Salesforce environment: "login" (production) or "test" (sandbox) (default: login)',
      },
    ],
    docs: {
      provider: 'https://developer.salesforce.com/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'Salesforce supports environment field: "login" for production, "test" for sandbox.',
    readme: {
      title: 'Salesforce OAuth Setup',
      content: `## Salesforce OAuth Setup

1. Create a Connected App in Salesforce Setup
2. Enable OAuth Settings
3. Add callback URL: \`http://localhost:3000/api/auth/callback/salesforce\` (update for production)
4. Copy the Consumer Key and Consumer Secret to your \`.env\` file
5. Set SALESFORCE_ENVIRONMENT to "login" for production or "test" for sandbox

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  slack: {
    id: 'slack',
    name: 'Slack',
    envPrefix: 'SLACK',
    clientIdVar: 'SLACK_CLIENT_ID',
    clientSecretVar: 'SLACK_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"slack"',
      socialProvider: `slack({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'SLACK_CLIENT_ID',
        type: 'server',
        description: 'Slack App Client ID',
      },
      {
        name: 'SLACK_CLIENT_SECRET',
        type: 'server',
        description: 'Slack App Client Secret',
      },
    ],
    docs: {
      provider: 'https://api.slack.com/apps',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: 'Supports optional team field for workspace restrictions.',
    readme: {
      title: 'Slack OAuth Setup',
      content: `## Slack OAuth Setup

1. Create a Slack app at https://api.slack.com/apps
2. Add OAuth & Permissions and configure redirect URLs
3. Add redirect URL: \`http://localhost:3000/api/auth/callback/slack\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    envPrefix: 'TIKTOK',
    clientIdVar: 'TIKTOK_CLIENT_KEY',
    clientSecretVar: 'TIKTOK_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"tiktok"',
      socialProvider: `tiktok({
      clientKey: process.env.TIKTOK_CLIENT_KEY!,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'TIKTOK_CLIENT_KEY',
        type: 'server',
        description: 'TikTok Client Key (not Client ID)',
      },
      {
        name: 'TIKTOK_CLIENT_SECRET',
        type: 'server',
        description: 'TikTok Client Secret',
      },
    ],
    docs: {
      provider: 'https://developers.tiktok.com/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes:
      'TikTok uses clientKey instead of clientId. Make sure to use the correct field name.',
    readme: {
      title: 'TikTok OAuth Setup',
      content: `## TikTok OAuth Setup

1. Register an app at https://developers.tiktok.com/
2. Configure Login Kit
3. Add redirect URI: \`http://localhost:3000/api/auth/callback/tiktok\` (update for production)
4. Copy the Client Key (not Client ID) and Client Secret to your \`.env\` file

**Important**: TikTok uses clientKey instead of clientId.

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  vercel: {
    id: 'vercel',
    name: 'Vercel',
    envPrefix: 'VERCEL',
    clientIdVar: 'VERCEL_CLIENT_ID',
    clientSecretVar: 'VERCEL_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"vercel"',
      socialProvider: `vercel({
      clientId: process.env.VERCEL_CLIENT_ID!,
      clientSecret: process.env.VERCEL_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'VERCEL_CLIENT_ID',
        type: 'server',
        description: 'Vercel OAuth Client ID',
      },
      {
        name: 'VERCEL_CLIENT_SECRET',
        type: 'server',
        description: 'Vercel OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://vercel.com/account/integrations',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: 'Uses PKCE for enhanced security.',
    readme: {
      title: 'Vercel OAuth Setup',
      content: `## Vercel OAuth Setup

1. Create an integration at https://vercel.com/account/integrations
2. Configure OAuth settings
3. Add redirect URL: \`http://localhost:3000/api/auth/callback/vercel\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  vk: {
    id: 'vk',
    name: 'VK',
    envPrefix: 'VK',
    clientIdVar: 'VK_CLIENT_ID',
    clientSecretVar: 'VK_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"vk"',
      socialProvider: `vk({
      clientId: process.env.VK_CLIENT_ID!,
      clientSecret: process.env.VK_CLIENT_SECRET!,
    })`,
      scopes: [],
    },
    env: [
      {
        name: 'VK_CLIENT_ID',
        type: 'server',
        description: 'VK Application ID',
      },
      {
        name: 'VK_CLIENT_SECRET',
        type: 'server',
        description: 'VK Secure Key',
      },
    ],
    docs: {
      provider: 'https://vk.com/apps?act=manage',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: false,
    extraConfigNotes: '',
    readme: {
      title: 'VK OAuth Setup',
      content: `## VK OAuth Setup

1. Create an app at https://vk.com/apps?act=manage
2. Configure OAuth settings in the app
3. Add authorized redirect URI: \`http://localhost:3000/api/auth/callback/vk\` (update for production)
4. Copy the Application ID and Secure Key to your \`.env\` file

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },

  zoom: {
    id: 'zoom',
    name: 'Zoom',
    envPrefix: 'ZOOM',
    clientIdVar: 'ZOOM_CLIENT_ID',
    clientSecretVar: 'ZOOM_CLIENT_SECRET',
    popular: false,
    betterAuthConfig: {
      import: '',
      clientSideProvider: '"zoom"',
      socialProvider: `zoom({
      clientId: process.env.ZOOM_CLIENT_ID!,
      clientSecret: process.env.ZOOM_CLIENT_SECRET!,
    })`,
      scopes: ['user:read:user'],
    },
    env: [
      {
        name: 'ZOOM_CLIENT_ID',
        type: 'server',
        description: 'Zoom OAuth Client ID',
      },
      {
        name: 'ZOOM_CLIENT_SECRET',
        type: 'server',
        description: 'Zoom OAuth Client Secret',
      },
    ],
    docs: {
      provider: 'https://marketplace.zoom.us/',
      betterAuth: 'https://www.better-auth.com/docs/authentication/social',
    },
    requiresExtraConfig: true,
    extraConfigNotes: 'You MUST include the user:read:user scope for Zoom.',
    readme: {
      title: 'Zoom OAuth Setup',
      content: `## Zoom OAuth Setup

1. Create an app at https://marketplace.zoom.us/
2. Choose OAuth as the app type
3. Add redirect URL: \`http://localhost:3000/api/auth/callback/zoom\` (update for production)
4. Copy the Client ID and Client Secret to your \`.env\` file
5. **Important**: Make sure to include the \`user:read:user\` scope

For more details, see the [Better Auth documentation](https://www.better-auth.com/docs/authentication/social).`,
    },
  },
};

/**
 * Gets a provider configuration by ID
 *
 * @param id - The provider ID to lookup
 * @returns The provider configuration, or undefined if not found
 */
export function getProvider(id: string): OAuthProvider | undefined {
  return OAUTH_PROVIDERS[id];
}

/**
 * Gets an array of all supported provider IDs
 *
 * @returns Array of provider IDs
 */
export function getProviderIds(): string[] {
  return Object.keys(OAUTH_PROVIDERS);
}

/**
 * Gets an array of all popular OAuth providers
 * These are shown by default in the CLI form
 *
 * @returns Array of popular OAuthProvider objects
 */
export function getPopularProviders(): OAuthProvider[] {
  return Object.values(OAUTH_PROVIDERS).filter(
    (provider) => provider.popular === true
  );
}

/**
 * Gets an array of all additional (non-popular) OAuth providers
 * These are shown when user selects "Show more" in the CLI form
 *
 * @returns Array of additional OAuthProvider objects
 */
export function getAdditionalProviders(): OAuthProvider[] {
  return Object.values(OAUTH_PROVIDERS).filter(
    (provider) => provider.popular !== true
  );
}

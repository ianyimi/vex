# Next.js + Better Auth + Convex + shadcn/ui Template

A modern, production-ready SaaS template built with:

- **[Next.js](https://nextjs.org)** - The React framework for production with App Router
- **[Better Auth](https://www.better-auth.com/)** - Modern authentication with email/password and OAuth providers
- **[Convex](https://convex.dev/)** - Real-time database and backend
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautifully designed components built on Radix UI
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

## Getting Started

### 1. Prerequisites

- Node.js 18+ and npm/pnpm/yarn installed
- A Convex account (free at [convex.dev](https://convex.dev))

### 2. Clone and Install

```bash
# Clone this template
git clone <your-repo-url>
cd <your-project-name>

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

### 4. Generate Better Auth Secret

Generate a secure secret for Better Auth:

```bash
npm run secret:create
# or
pnpm secret:create
# or
yarn secret:create
```

This will generate a random 32-character hex string and copy it to your clipboard.

### 5. Configure Convex

#### Set up Convex project

```bash
npx convex dev
```

This will:

- Create a new Convex project (or link to an existing one)
- Generate your `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`
- Start the Convex development server

#### Add environment variables to Convex

You need to add two critical environment variables to your Convex deployment via the [Convex Dashboard](https://dashboard.convex.dev):

1. **BETTER_AUTH_SECRET**: Paste the secret you generated in step 4
2. **SITE_URL**: Set to your application URL
   - Development: `http://localhost:3000` (or whatever port your dev server uses)
   - Production: Your production domain (e.g., `https://yourdomain.com`)

To add these in the Convex Dashboard:

1. Go to your project at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Navigate to "Settings" → "Environment Variables"
3. Add both `BETTER_AUTH_SECRET` and `SITE_URL`

### 6. Update Your .env File

Update your `.env` file with the values from Convex setup:

```env
NODE_ENV=development

# From Convex setup
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=https://your-deployment.convex.site
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site

# Better Auth (same secret you added to Convex Dashboard)
BETTER_AUTH_SECRET=your-generated-secret-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 7. Start Development

```bash
# Terminal 1: Run Convex dev server
npx convex dev

# Terminal 2: Run the application
npm run dev
# or
pnpm dev
# or
yarn dev
```

Visit `http://localhost:3000` to see your application running.

## Authentication Setup

This project uses Better Auth for authentication.

## Customizing Authentication

### Adding OAuth Providers

To add or modify OAuth providers:

1. **Update Better Auth configuration** in `convex/auth/index.ts`:

```typescript
export const createAuth = (ctx: GenericActionCtx<DataModel>) => {
  return betterAuth({
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectURI: `${process.env.SITE_URL}/api/auth/callback/google`,
      },
      // Add more providers
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
    // ... rest of config
  })
}
```

2. **Add credentials to Convex Dashboard** as environment variables

3. **Consult the Better Auth documentation** for provider-specific configuration:
   - [Better Auth Providers](https://www.better-auth.com/docs/authentication/social-login)

### Customizing User Schema

To add custom fields to your user model:

1. Update the `user.additionalFields` in `convex/auth/index.ts`
2. Update your Convex schema accordingly
3. See [Better Auth User Management](https://www.better-auth.com/docs/concepts/user-management) for details

### Email/Password Configuration

The template has email/password authentication enabled by default. To customize:

- [Better Auth Email/Password Docs](https://www.better-auth.com/docs/authentication/email-password)
- [Email Verification Setup](https://www.better-auth.com/docs/authentication/email-verification)

## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/        # Frontend routes group
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── auth/                  # Authentication components
│   ├── components/            # React components
│   ├── lib/                   # Utilities and helpers
│   └── env.mjs                # Typed environment variables
├── convex/                    # Convex backend
│   ├── auth/                  # Better Auth integration
│   ├── schema.ts              # Database schema
│   └── *.ts                   # Convex functions (queries, mutations, actions)
├── public/                    # Static assets
└── .env                       # Environment variables (not committed)
```

## Development Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
npm run typecheck        # Type check without emitting
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run secret:create    # Generate a Better Auth secret
```

## Documentation Resources

### Core Technologies

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Better Auth**: [better-auth.com/docs](https://www.better-auth.com/docs)
- **Convex**: [docs.convex.dev](https://docs.convex.dev)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

### Integration Guides

- **Better Auth + Convex**: [better-auth.com/docs/integrations/convex](https://www.better-auth.com/docs/integrations/convex)
- **Better Auth + Next.js**: [better-auth.com/docs/integrations/nextjs](https://www.better-auth.com/docs/integrations/nextjs)

## Deployment

### Deploy to Production

1. **Deploy Convex Backend**:

```bash
npx convex deploy
```

2. **Update Convex environment variables** in production:
   - Set `SITE_URL` to your production domain
   - Keep `BETTER_AUTH_SECRET` the same (or rotate it)

3. **Deploy your application** to your hosting provider (Vercel recommended):

For Vercel:

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

4. **Update environment variables** in your hosting provider with production values:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CONVEX_SITE_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `BETTER_AUTH_SECRET`

See [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying) and [Convex Production Deployment](https://docs.convex.dev/production/hosting) for detailed deployment instructions.

## License

MIT
